"use client";

import { useState } from "react";
import {
  ArrowUpCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useWallet } from "../contexts/WalletContext";

export default function SendAdaPanel() {
  const {
    connectedWallet,
    address,
    submitAdaPayment,
  } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amountAda, setAmountAda] = useState("");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!connectedWallet) {
    return (
      <div className="card rounded-xl p-4 border border-dashed border-default bg-[var(--github-bg-secondary)]/25 text-xs text-secondary">
        <p className="font-semibold text-primary mb-1">Send ADA</p>
        <p>Connect a browser wallet above to build and submit transactions. Manual address-key tools now live inside the My Notes page.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    setLocalError(null);
    setTxHash(null);

    const trimmedRecipient = recipient.trim();
    if (!trimmedRecipient) {
      setLocalError("Recipient address is required");
      return;
    }

    const parsedAmount = Number(amountAda);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setLocalError("Enter a valid ADA amount");
      return;
    }

    const lovelace = BigInt(Math.round(parsedAmount * 1_000_000));
    if (lovelace <= BigInt(0)) {
      setLocalError("Amount must be greater than zero");
      return;
    }

    try {
      setSending(true);
      const { txHash } = await submitAdaPayment({
        recipient: trimmedRecipient,
        amountLovelace: lovelace,
      });
      setTxHash(txHash || null);
      setRecipient("");
      setAmountAda("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setLocalError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card rounded-xl p-4 border border-default bg-[var(--github-bg-secondary)]/40 space-y-3">
      <div className="flex items-center gap-2">
        <ArrowUpCircleIcon className="w-5 h-5 text-[var(--github-accent)]" />
        <div>
          <p className="text-sm font-semibold text-primary">Send ADA</p>
          <p className="text-xs text-secondary">
            Signed with {connectedWallet.label} ({address ? truncateAddress(address) : "unknown"})
          </p>
        </div>
      </div>
      <ol className="text-xs text-secondary/90 bg-[var(--github-bg-secondary)]/70 border border-dashed border-default rounded-lg p-3 space-y-1">
        <li>
          <span className="font-semibold text-primary">1.</span> Paste the full recipient address and double-check it matches your intended target.
        </li>
        <li>
          <span className="font-semibold text-primary">2.</span> Enter the ADA amount (up to 6 decimals). Negative or zero values are rejected automatically.
        </li>
        <li>
          <span className="font-semibold text-primary">3.</span> Click <span className="font-semibold">Send ADA</span> once and approve the signing prompt from your wallet.
        </li>
      </ol>

      {txHash && (
        <div className="text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4" />
          <span>Transaction submitted: {truncateAddress(txHash)}</span>
        </div>
      )}

      {localError && (
        <div className="text-xs text-[var(--github-danger)] flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span>{localError}</span>
        </div>
      )}

      <label className="text-xs font-semibold text-secondary uppercase tracking-wide">
        Recipient Address
        <input
          type="text"
          placeholder="addr..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="mt-1 w-full rounded-lg border border-default bg-transparent px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--github-accent)]/60"
        />
        <span className="mt-1 block text-[11px] font-normal normal-case text-secondary">
          Paste the complete bech32 address (starts with <code>addr</code>); no short forms or explorer links.
        </span>
      </label>

      <label className="text-xs font-semibold text-secondary uppercase tracking-wide">
        Amount (ADA)
        <input
          type="number"
          min="0"
          step="0.000001"
          placeholder="0.0"
          value={amountAda}
          onChange={(e) => setAmountAda(e.target.value)}
          className="mt-1 w-full rounded-lg border border-default bg-transparent px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--github-accent)]/60"
        />
        <span className="mt-1 block text-[11px] font-normal normal-case text-secondary">
          Minimum 0.000001 ADA. The form converts this to lovelace and blocks amounts above your current wallet balance.
        </span>
      </label>

      <button
        onClick={handleSubmit}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--github-accent)]/90 text-white text-sm font-semibold py-2.5 disabled:opacity-60"
      >
        {sending ? "Submitting…" : "Send ADA"}
      </button>
    </div>
  );
}

function truncateAddress(addr: string) {
  if (!addr) return "--";
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}
