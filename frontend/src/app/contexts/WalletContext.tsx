"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Blaze, Blockfrost, Core, WebWallet } from "@blaze-cardano/sdk";

type CardanoSerializationLib = typeof import("@emurgo/cardano-serialization-lib-browser");

const ENABLE_WALLET =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_ENABLE_WALLET ?? "true") !== "false"
    : true;
const API_BASE =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000"
    : "http://localhost:5000";
const BLOCKFROST_PROJECT_ID =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID || undefined
    : undefined;

const WALLET_PREFERENCES = [
  { key: "nami", label: "Nami" },
  { key: "eternl", label: "Eternl" },
  { key: "flint", label: "Flint" },
];

type DetectedWallet = {
  key: string;
  label: string;
  installed: boolean;
  icon?: string;
};

type WalletConfig = {
  network: string;
  blockfrostUrl: string;
  blockfrostNetworkName: string;
  hasApiKey: boolean;
};

type LinkedWalletRecord = {
  wallet_address: string | null;
  wallet_label: string | null;
  wallet_network: string | null;
  wallet_connected_at: string | null;
};

type SubmitAdaArgs = {
  recipient: string;
  amountLovelace: bigint;
};

type RelaySignedTxResult = {
  txHash: string;
};

type BlockfrostNetwork = ConstructorParameters<typeof Blockfrost>[0]["network"];

type ManualLinkArgs = {
  address: string;
  label?: string | null;
  network?: string | null;
};

type Cip30WalletApi = {
  getNetworkId: () => Promise<number>;
  getUtxos: () => Promise<string[] | undefined>;
  getBalance: () => Promise<string>;
  getUsedAddresses: () => Promise<string[]>;
  getUnusedAddresses: () => Promise<string[]>;
  getChangeAddress: () => Promise<string>;
  getRewardAddresses: () => Promise<string[]>;
  signTx: (tx: string, partialSign: boolean) => Promise<string>;
  signData: (
    address: string,
    payload: string
  ) => Promise<{ signature: string; key: string }>;
  submitTx: (tx: string) => Promise<string>;
  getCollateral: () => Promise<string[]>;
};

type BrowserWalletExtension = {
  name?: string;
  icon?: string;
  enable: () => Promise<Cip30WalletApi>;
};

type CardanoBrowserWindow = Window & {
  cardano?: Record<string, BrowserWalletExtension | undefined>;
};

const getErrorMessage = (
  err: unknown,
  fallback = "An unexpected error occurred"
) => (err instanceof Error ? err.message : fallback);

interface WalletContextValue {
  isEnabled: boolean;
  isReady: boolean;
  availableWallets: DetectedWallet[];
  connectedWallet: DetectedWallet | null;
  address: string | null;
  balanceAda: number | null;
  lovelace: string | null;
  loading: boolean;
  error: string | null;
  config: WalletConfig | null;
  linkedWallet: LinkedWalletRecord | null;
  accountSyncing: boolean;
  connectWallet: (walletKey?: string) => Promise<void>;
  disconnectWallet: () => void;
  unlinkWallet: () => Promise<void>;
  syncLinkedWallet: () => Promise<void>;
  getWalletApi: () => Cip30WalletApi | null;
  linkWalletManually: (args: ManualLinkArgs) => Promise<void>;
  submitAdaPayment: (args: SubmitAdaArgs) => Promise<{ txHash: string }>;
  relaySignedTransaction: (cbor: string) => Promise<RelaySignedTxResult>;
  refreshBalance: (customAddress?: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const hexToBytes = (hex: string | undefined | null) => {
  if (!hex) return null;
  const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (cleaned.length % 2 !== 0) return null;
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    const byte = parseInt(cleaned.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) return null;
    bytes[i / 2] = byte;
  }
  return bytes;
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [availableWallets, setAvailableWallets] = useState<DetectedWallet[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<DetectedWallet | null>(
    null
  );
  const [address, setAddress] = useState<string | null>(null);
  const [balanceAda, setBalanceAda] = useState<number | null>(null);
  const [lovelace, setLovelace] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<WalletConfig | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState<LinkedWalletRecord | null>(null);
  const [accountSyncing, setAccountSyncing] = useState(false);
  const cardanoWasmRef = useRef<CardanoSerializationLib | null>(null);
  const walletApiRef = useRef<Cip30WalletApi | null>(null);
  const addressRef = useRef<string | null>(null);

  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  const detectWallets = useCallback(() => {
    if (typeof window === "undefined") return;
    const cardano = (window as CardanoBrowserWindow).cardano || {};
    const detected: DetectedWallet[] = WALLET_PREFERENCES.map((candidate) => ({
      key: candidate.key,
      label: cardano[candidate.key]?.name || candidate.label,
      installed: Boolean(cardano[candidate.key]),
      icon: cardano[candidate.key]?.icon,
    }));

    Object.keys(cardano)
      .filter((key) => !detected.some((w) => w.key === key))
      .forEach((key) => {
        detected.push({
          key,
          label: cardano[key]?.name || key,
          installed: true,
          icon: cardano[key]?.icon,
        });
      });

    setAvailableWallets(detected.filter((wallet) => wallet.installed));
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!ENABLE_WALLET) {
      setIsReady(true);
      return;
    }

    let cancelled = false;
    detectWallets();

    const handleFocus = () => {
      if (!cancelled) detectWallets();
    };

    window.addEventListener("focus", handleFocus);

    import("@emurgo/cardano-serialization-lib-browser")
      .then((mod) => {
        if (!cancelled) {
          cardanoWasmRef.current = mod;
        }
      })
      .catch((err) => {
        console.error("Failed to load cardano-serialization-lib-browser", err);
        if (!cancelled) {
          setError("Cardano libs failed to load");
        }
      });

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
    };
  }, [detectWallets]);

  useEffect(() => {
    if (!ENABLE_WALLET) return;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    fetch(`${API_BASE}/api/wallet/config`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setConfig({
            network: data.network,
            blockfrostUrl: data.blockfrostUrl,
            blockfrostNetworkName:
              data.blockfrostNetworkName || `cardano-${data.network || "preprod"}`,
            hasApiKey: Boolean(data.hasApiKey),
          });
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, []);


  const convertHexAddress = useCallback((hex: string | undefined | null) => {
    if (!hex) return null;
    const wasm = cardanoWasmRef.current;
    if (!wasm) return null;
    const bytes = hexToBytes(hex);
    if (!bytes) return null;
    try {
      const addr = wasm.Address.from_bytes(bytes);
      return addr.to_bech32();
    } catch (err) {
      console.error("convertHexAddress failed", err);
      return null;
    }
  }, []);

  const getAuthToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const refreshBalance = useCallback(async (customAddress?: string) => {
    const targetAddress = customAddress || addressRef.current;
    if (!targetAddress || !ENABLE_WALLET) return;
      const token = getAuthToken();
      if (!token) {
        setError("Please sign in to sync wallet data");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/wallet/balance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ address: targetAddress }),
        });
        if (!res.ok) throw new Error(`Balance fetch failed (${res.status})`);
        const data = await res.json();
        setLovelace(data.lovelace || null);
        setBalanceAda(typeof data.ada === "number" ? data.ada : null);
      } catch (err) {
        setError(getErrorMessage(err, "Unable to load balance"));
      }
  }, []);

  const syncLinkedWallet = useCallback(async () => {
    if (!ENABLE_WALLET) return;
    const token = getAuthToken();
    if (!token) return;
    setAccountSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/api/wallet/account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 404) {
          setLinkedWallet(null);
          setAddress(null);
          return;
        }
        throw new Error(`Failed to load linked wallet (${res.status})`);
      }
      const data = await res.json();
      if (data?.wallet?.wallet_address) {
        setLinkedWallet(data.wallet);
        setAddress(data.wallet.wallet_address);
        setTimeout(() => refreshBalance(data.wallet.wallet_address), 0);
      } else {
        setLinkedWallet(null);
        setAddress(null);
      }
    } catch (err) {
      console.warn('syncLinkedWallet failed', err);
    } finally {
      setAccountSyncing(false);
    }
  }, [refreshBalance]);

  const persistLinkedWallet = useCallback(
    async (addr: string, label?: string | null, networkOverride?: string | null) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please sign in to link a wallet");
      }
      setAccountSyncing(true);
      try {
        const res = await fetch(`${API_BASE}/api/wallet/link`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            address: addr,
            label: label || null,
            network: networkOverride || config?.network || "mainnet",
          }),
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(payload?.error || `Failed to link wallet (${res.status})`);
        }
        if (payload?.wallet?.wallet_address) {
          setLinkedWallet(payload.wallet);
          setAddress(payload.wallet.wallet_address);
          setTimeout(() => refreshBalance(payload.wallet.wallet_address), 0);
        }
      } finally {
        setAccountSyncing(false);
      }
    },
    [config, refreshBalance]
  );

  useEffect(() => {
    if (!ENABLE_WALLET) return;
    syncLinkedWallet();
  }, [syncLinkedWallet]);

  const connectWallet = useCallback(
    async (walletKey?: string) => {
      if (!ENABLE_WALLET) {
        setError("Wallet features are disabled");
        return;
      }
      if (typeof window === "undefined") {
        setError("Wallets can only connect in the browser");
        return;
      }
      const token = getAuthToken();
      if (!token) {
        setError("Please sign in to connect a wallet");
        return;
      }
      const key = walletKey || availableWallets[0]?.key;
      if (!key) {
        setError("No browser wallet detected");
        return;
      }
      const walletExt = (window as CardanoBrowserWindow).cardano?.[key];
      if (!walletExt) {
        setError(`${key} is not available`);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const api = await walletExt.enable();
        walletApiRef.current = api;
        let bech32: string | null = null;
        try {
          const usedAddresses: string[] = await api.getUsedAddresses();
          bech32 = convertHexAddress(usedAddresses?.[0]);
        } catch (err) {
          console.warn("Reading used addresses failed", err);
        }
        if (!bech32) {
          try {
            const changeAddress: string = await api.getChangeAddress();
            bech32 = convertHexAddress(changeAddress);
          } catch (err) {
            console.warn("Reading change address failed", err);
          }
        }
        if (!bech32) {
          throw new Error("Unable to derive wallet address");
        }
        setConnectedWallet({
          key,
          label: walletExt.name || key,
          installed: true,
          icon: walletExt.icon,
        });
        await persistLinkedWallet(
          bech32,
          walletExt.name || key,
          config?.network || null
        );
      } catch (err) {
        console.error("connectWallet failed", err);
        setError(getErrorMessage(err, "Failed to connect wallet"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [availableWallets, convertHexAddress, persistLinkedWallet, config]
  );

  const disconnectWallet = useCallback(() => {
    walletApiRef.current = null;
    setConnectedWallet(null);
    setError(null);
    if (!linkedWallet?.wallet_address) {
      setAddress(null);
      setBalanceAda(null);
      setLovelace(null);
    }
  }, [linkedWallet]);

  const unlinkWallet = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError("Please sign in to unlink wallet");
      return;
    }
    setAccountSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/api/wallet/link`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || `Failed to unlink wallet (${res.status})`);
      }
      walletApiRef.current = null;
      setLinkedWallet(null);
      setConnectedWallet(null);
      setAddress(null);
      setBalanceAda(null);
      setLovelace(null);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to unlink wallet"));
      throw err;
    } finally {
      setAccountSyncing(false);
    }
  }, []);

  const getWalletApi = useCallback(() => walletApiRef.current, []);

  const linkWalletManually = useCallback(
    async ({ address: rawAddress, label, network }: ManualLinkArgs) => {
      const trimmed = rawAddress?.trim();
      if (!trimmed) {
        throw new Error("Wallet address is required");
      }
      if (trimmed.length < 20) {
        throw new Error("Address looks invalid");
      }
      await persistLinkedWallet(trimmed, label ?? null, network ?? null);
    },
    [persistLinkedWallet]
  );

  const submitAdaPayment = useCallback(
    async ({ recipient, amountLovelace }: SubmitAdaArgs) => {
      if (!ENABLE_WALLET) {
        throw new Error("Wallet features are disabled");
      }
      const api = walletApiRef.current;
      if (!api) {
        throw new Error("Connect a browser wallet before sending ADA");
      }
      if (!config?.blockfrostNetworkName) {
        throw new Error("Wallet network configuration missing");
      }
      if (!BLOCKFROST_PROJECT_ID) {
        throw new Error("NEXT_PUBLIC_BLOCKFROST_PROJECT_ID is not configured");
      }
      if (!recipient) {
        throw new Error("Recipient address is required");
      }
      if (amountLovelace <= BigInt(0)) {
        throw new Error("Amount must be greater than zero");
      }

      try {
        const providerNetwork =
          (config.blockfrostNetworkName as BlockfrostNetwork) ||
          "cardano-preprod";
        const provider = new Blockfrost({
          network: providerNetwork,
          projectId: BLOCKFROST_PROJECT_ID,
        });
        const wallet = new WebWallet(api);
        const blaze = await Blaze.from(provider, wallet);
        const tx = await blaze
          .newTransaction()
          .payLovelace(Core.Address.fromBech32(recipient), amountLovelace)
          .complete();
        const signedTx = await blaze.signTransaction(tx);
        const txHash = await blaze.provider.postTransactionToChain(signedTx);
        return {
          txHash: `${txHash ?? ""}`,
        };
      } catch (err) {
        const message = getErrorMessage(err, "Failed to submit transaction");
        setError(message);
        throw new Error(message);
      }
    },
    [config]
  );

  const relaySignedTransaction = useCallback(
    async (cborPayload: string) => {
      const trimmed = cborPayload?.trim();
      if (!trimmed) {
        throw new Error("Signed transaction payload is required");
      }
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please sign in to submit transactions");
      }
      const res = await fetch(`${API_BASE}/api/wallet/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cbor: trimmed }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || `Unable to relay transaction (${res.status})`);
      }
      return { txHash: payload?.txHash ?? "" };
    },
    []
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      isEnabled: ENABLE_WALLET,
      isReady,
      availableWallets,
      connectedWallet,
      address,
      balanceAda,
      lovelace,
      loading,
      error,
      config,
      linkedWallet,
      accountSyncing,
      connectWallet,
      disconnectWallet,
      unlinkWallet,
      syncLinkedWallet,
      getWalletApi,
      linkWalletManually,
      submitAdaPayment,
      relaySignedTransaction,
      refreshBalance,
    }),
    [
      address,
      availableWallets,
      accountSyncing,
      balanceAda,
      config,
      connectedWallet,
      error,
      linkedWallet,
      isReady,
      loading,
      lovelace,
      refreshBalance,
      connectWallet,
      disconnectWallet,
      unlinkWallet,
      syncLinkedWallet,
      getWalletApi,
      linkWalletManually,
      submitAdaPayment,
      relaySignedTransaction,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return ctx;
}
