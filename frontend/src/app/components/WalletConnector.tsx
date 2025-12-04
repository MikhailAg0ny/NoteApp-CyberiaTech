"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  PowerIcon,
} from "@heroicons/react/24/outline";
import { useWallet } from "../contexts/WalletContext";
import SendAdaPanel from "./SendAdaPanel";

function truncateAddress(addr: string) {
  if (!addr) return "--";
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
}

export default function WalletConnector() {
  const {
    isEnabled,
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
    refreshBalance,
    linkWalletManually,
  } = useWallet();

  const [expanded, setExpanded] = useState(false);
    const [manualOpen, setManualOpen] = useState(false);
    const [manualAddress, setManualAddress] = useState("");
    const [manualLabel, setManualLabel] = useState("");
    const [manualNetwork, setManualNetwork] = useState<string>(
      config?.network || "mainnet"
    );
    const [manualSubmitting, setManualSubmitting] = useState(false);
    const [manualError, setManualError] = useState<string | null>(null);
    const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const isBusy = loading || accountSyncing;
  const displayAddress = address || linkedWallet?.wallet_address || null;
  const networkLabel = linkedWallet?.wallet_network || config?.network;
  const walletLabel =
    connectedWallet?.label || linkedWallet?.wallet_label || "Linked wallet";
  const hasLinkedWallet = Boolean(displayAddress);

    useEffect(() => {
      if (config?.network) {
        setManualNetwork((prev) => prev || config.network);
      }
    }, [config?.network]);

    const handleManualLink = async (event: FormEvent) => {
      event.preventDefault();
      if (manualSubmitting) return;
      const trimmedAddress = manualAddress.trim();
      if (!trimmedAddress) {
        setManualError("Wallet address is required");
        setManualSuccess(null);
        return;
      }
      setManualSubmitting(true);
      setManualError(null);
      setManualSuccess(null);
      try {
        await linkWalletManually({
          address: trimmedAddress,
          label: manualLabel.trim() || null,
          network: manualNetwork || config?.network || null,
        });
        setManualSuccess("Wallet linked successfully");
        setManualAddress("");
        setManualLabel("");
        setManualOpen(false);
      } catch (err) {
        setManualError(
          err instanceof Error ? err.message : "Failed to link wallet"
        );
      } finally {
        setManualSubmitting(false);
      }
    };

  if (!isEnabled) {
    return (
      <div className="card rounded-xl p-4 text-xs text-secondary bg-[var(--github-bg-secondary)]/50 border border-dashed border-default">
        <p className="font-semibold text-primary mb-1">Wallet beta disabled</p>
        <p>Enable NEXT_PUBLIC_ENABLE_WALLET to surface Cardano wallet tools.</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="card rounded-xl p-4 border border-default animate-pulse">
        <div className="h-5 w-1/2 bg-[var(--github-border)]/60 rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-[var(--github-border)]/40 rounded"></div>
      </div>
    );
  }

  if (hasLinkedWallet) {
    return (
      <div className="space-y-3">
        <div className="card rounded-xl p-4 border border-default bg-[var(--github-bg-secondary)]/60">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="w-4 h-4 text-[var(--github-accent)]" />
              <div>
                <p className="text-sm font-semibold text-primary">{walletLabel}</p>
                {networkLabel && (
                  <p className="text-[11px] uppercase tracking-wide text-secondary/70">
                    {networkLabel}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => displayAddress && refreshBalance(displayAddress)}
              className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-[var(--github-border)]/40 transition disabled:opacity-60"
              disabled={isBusy || !displayAddress}
              title="Refresh balance"
            >
              <ArrowPathIcon
                className={`w-4 h-4 ${isBusy ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          {accountSyncing && (
            <div className="text-[11px] text-secondary mb-2 flex items-center gap-1">
              <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
              Syncing wallet link…
            </div>
          )}
          <div className="text-xs text-secondary mb-3 flex items-center gap-2 flex-wrap">
            <CheckCircleIcon
              className={`w-4 h-4 ${connectedWallet ? "text-emerald-400" : "text-[var(--github-accent)]"}`}
            />
            {displayAddress && <span>{truncateAddress(displayAddress)}</span>}
            <span className="text-[11px] uppercase tracking-wide text-secondary/70">
              {connectedWallet ? "Browser session active" : "Linked to account"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-secondary/70 mb-0.5">
                Balance
              </p>
              <p className="font-semibold text-primary">
                {balanceAda === null ? "--" : `${balanceAda.toFixed(2)} ADA`}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--github-accent)] bg-[var(--github-accent)]/15 hover:bg-[var(--github-accent)]/25 transition"
              >
                {expanded ? "Hide" : "Details"}
              </button>
              {connectedWallet && (
                <button
                  onClick={disconnectWallet}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--github-danger)] bg-[var(--github-danger)]/10 hover:bg-[var(--github-danger)]/20 transition flex items-center gap-1"
                >
                  <PowerIcon className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              )}
              <button
                onClick={() => unlinkWallet().catch(() => null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--github-danger)]/90 bg-[var(--github-danger)]/5 hover:bg-[var(--github-danger)]/15 transition"
                disabled={accountSyncing}
              >
                {accountSyncing ? "Unlinking…" : "Unlink"}
              </button>
            </div>
          </div>
          {expanded && (
            <div className="mt-3 text-xs text-secondary space-y-1">
              <p>Wallet key: {connectedWallet?.key || "--"}</p>
              {linkedWallet?.wallet_label && <p>Label: {linkedWallet.wallet_label}</p>}
              <p>Lovelace: {formatLovelace(lovelace)}</p>
              {linkedWallet?.wallet_connected_at && (
                <p>Linked: {formatTimestamp(linkedWallet.wallet_connected_at)}</p>
              )}
              {error && (
                <p className="text-[var(--github-danger)] flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
        <SendAdaPanel />
      </div>
    );
  }

  return (
    <div className="card rounded-xl p-4 border border-dashed border-default bg-[var(--github-bg-secondary)]/30">
      <div className="flex items-center gap-2 mb-2">
        <BoltIcon className="w-4 h-4 text-[var(--github-accent)]" />
        <div>
          <p className="text-sm font-semibold text-primary">Connect wallet</p>
          <p className="text-xs text-secondary">Securely link a Cardano browser wallet.</p>
        </div>
      </div>
      {error && (
        <div className="text-[11px] text-[var(--github-danger)] mb-2 flex items-center gap-1">
          <ExclamationTriangleIcon className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
      {availableWallets.length === 0 ? (
        <p className="text-xs text-secondary">Install Nami, Eternl, or Flint to continue.</p>
      ) : (
        <div className="space-y-2">
          {availableWallets.map((wallet) => (
            <button
              key={wallet.key}
              onClick={() => connectWallet(wallet.key)}
              disabled={isBusy}
              className="w-full px-4 py-2.5 rounded-lg border border-default text-sm font-semibold text-left flex items-center justify-between hover:border-[var(--github-accent)] hover:text-[var(--github-accent)] transition disabled:opacity-60"
            >
              <span>{wallet.label}</span>
              {isBusy && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 border-t border-dashed border-default/70 pt-3">
        <button
          type="button"
          onClick={() => {
            setManualOpen((prev) => !prev);
            setManualError(null);
            setManualSuccess(null);
          }}
          className="text-xs font-semibold text-[var(--github-accent)] hover:underline"
        >
          {manualOpen ? "Hide manual link" : "Link address manually"}
        </button>
        {manualOpen && (
          <form className="mt-3 space-y-2" onSubmit={handleManualLink}>
            <label className="text-[11px] uppercase tracking-wide text-secondary font-semibold">
              Wallet address
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-default bg-transparent px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--github-accent)]/60"
                placeholder="addr1..."
              />
            </label>
            <label className="text-[11px] uppercase tracking-wide text-secondary font-semibold">
              Label (optional)
              <input
                type="text"
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-default bg-transparent px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--github-accent)]/60"
                placeholder="Ledger cold storage"
              />
            </label>
            <label className="text-[11px] uppercase tracking-wide text-secondary font-semibold">
              Network
              <select
                value={manualNetwork}
                onChange={(e) => setManualNetwork(e.target.value)}
                className="mt-1 w-full rounded-lg border border-default bg-transparent px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--github-accent)]/60"
              >
                {["mainnet", "preprod", "preview"].map((net) => (
                  <option key={net} value={net}>
                    {net}
                  </option>
                ))}
              </select>
            </label>
            {manualError && (
              <p className="text-[11px] text-[var(--github-danger)] flex items-center gap-1">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                {manualError}
              </p>
            )}
            {manualSuccess && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                {manualSuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={manualSubmitting}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-[var(--github-accent)]/90 text-white hover:bg-[var(--github-accent)] transition disabled:opacity-60"
            >
              {manualSubmitting ? "Linking…" : "Link wallet"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function formatLovelace(lovelace: string | null) {
  if (!lovelace) return "--";
  return `${lovelace} lovelace`;
}

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) return "--";
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
}
