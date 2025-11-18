"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useWallet } from "../contexts/WalletContext";

export default function ManualWalletPanel() {
  const {
    linkedWallet,
    accountSyncing,
    linkWalletManually,
    relaySignedTransaction,
  } = useWallet();
  const [manualLabel, setManualLabel] = useState(linkedWallet?.wallet_label || "");
  const [manualAddress, setManualAddress] = useState(
    linkedWallet?.wallet_address || ""
  );
  const [manualNetwork, setManualNetwork] = useState(
    linkedWallet?.wallet_network || "preprod"
  );
  const [manualStatus, setManualStatus] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [signedCbor, setSignedCbor] = useState("");
  const [relayHash, setRelayHash] = useState<string | null>(null);
  const [relayError, setRelayError] = useState<string | null>(null);
  const [relayLoading, setRelayLoading] = useState(false);

  useEffect(() => {
    if (!linkedWallet) return;
    setManualLabel(linkedWallet.wallet_label || "");
    setManualAddress(linkedWallet.wallet_address || "");
    setManualNetwork(linkedWallet.wallet_network || "preprod");
  }, [linkedWallet]);

  const handleManualLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManualStatus(null);
    setManualError(null);
    try {
      await linkWalletManually({
        address: manualAddress,
        label: manualLabel || null,
        network: manualNetwork,
      });
      setManualStatus(
        "Address key saved. Balance tools will rely on this entry."
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to link address";
      setManualError(message);
    }
  };

  const handleManualSubmit = async () => {
    setRelayError(null);
    setRelayHash(null);
    const trimmed = signedCbor.trim();
    if (!trimmed) {
      setRelayError("Paste the signed CBOR payload before submitting");
      return;
    }
    try {
      setRelayLoading(true);
      const { txHash } = await relaySignedTransaction(trimmed);
      setRelayHash(txHash || null);
      setSignedCbor("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Relay failed";
      setRelayError(message);
    } finally {
      setRelayLoading(false);
    }
  };

  return (
    <section className="card rounded-2xl border border-default bg-[var(--github-bg-secondary)]/35 p-5 space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-primary flex items-center gap-2">
          Manual Wallet Workflow
        </p>
        <p className="text-xs text-secondary">
          Prefinals rubric requires real addresses. Store your actual bech32 key and relay signed CBOR from this page.
        </p>
      </div>

      <div className="rounded-xl border border-default/70 bg-[var(--github-bg-secondary)]/60 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-secondary">
          <span className="font-semibold text-primary">Linked address</span>
          {linkedWallet?.wallet_address ? (
            <span className="text-primary">
              {linkedWallet.wallet_label ? `${linkedWallet.wallet_label} • ` : ""}
              {truncate(linkedWallet.wallet_address)} ({linkedWallet.wallet_network || "preprod"})
            </span>
          ) : (
            <span className="text-secondary/80">None yet — add yours below.</span>
          )}
        </div>

        <form onSubmit={handleManualLink} className="grid gap-3 text-xs">
          <label className="font-semibold uppercase tracking-wide text-secondary">
            Label (optional)
            <input
              type="text"
              value={manualLabel}
              onChange={(e) => setManualLabel(e.target.value)}
              placeholder="Personal wallet"
              className="mt-1 w-full rounded-lg border border-default bg-transparent px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--github-accent)]/60"
            />
          </label>

          <label className="font-semibold uppercase tracking-wide text-secondary">
            Wallet Address Key
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="addr1..."
              className="mt-1 w-full rounded-lg border border-default bg-transparent px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--github-accent)]/60"
              required
            />
            <span className="mt-1 block text-[11px] font-normal normal-case text-secondary">
              Paste the exact bech32 address you will fund. No mock data or sample strings.
            </span>
          </label>

          <label className="font-semibold uppercase tracking-wide text-secondary">
            Network
            <select
              value={manualNetwork}
              onChange={(e) => setManualNetwork(e.target.value)}
              className="mt-1 w-full rounded-lg border border-default bg-[var(--github-bg-secondary)] px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--github-accent)]/60"
            >
              <option value="preprod">Preprod (class sandbox)</option>
              <option value="mainnet">Mainnet</option>
              <option value="preview">Preview</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={accountSyncing}
            className="w-full rounded-lg bg-[var(--github-accent)]/90 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {accountSyncing ? "Saving…" : "Save Address Key"}
          </button>
        </form>

        {manualStatus && <p className="text-xs text-emerald-400">{manualStatus}</p>}
        {manualError && (
          <p className="text-xs text-[var(--github-danger)] flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>{manualError}</span>
          </p>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-default/80 bg-[var(--github-bg-secondary)]/45 p-4 space-y-3 text-xs">
        <p className="text-sm font-semibold text-primary">Submit a signed transaction</p>
        <ol className="space-y-1 text-secondary">
          <li>
            <span className="font-semibold text-primary">1.</span> Build the raw transaction using your CLI/tooling with the linked address as the signer.
          </li>
          <li>
            <span className="font-semibold text-primary">2.</span> Sign it offline with your actual payment signing key.
          </li>
          <li>
            <span className="font-semibold text-primary">3.</span> Paste the resulting CBOR hex below and submit. We relay it straight to Blockfrost.
          </li>
        </ol>

        {relayHash && (
          <div className="text-emerald-400 flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4" />
            <span>Relayed tx: {truncate(relayHash)}</span>
          </div>
        )}
        {relayError && (
          <div className="text-[var(--github-danger)] flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>{relayError}</span>
          </div>
        )}

        <textarea
          className="mt-1 w-full rounded-lg border border-default bg-transparent px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--github-accent)]/60"
          rows={4}
          placeholder="Signed transaction CBOR hex"
          value={signedCbor}
          onChange={(e) => setSignedCbor(e.target.value)}
        />

        <button
          onClick={handleManualSubmit}
          disabled={relayLoading}
          className="w-full rounded-lg bg-[var(--github-accent)]/90 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {relayLoading ? "Relaying…" : "Submit Signed Transaction"}
        </button>
      </div>
    </section>
  );
}

function truncate(value: string) {
  if (!value) return "--";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}
