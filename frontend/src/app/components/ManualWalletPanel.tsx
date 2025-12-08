"use client";

import { useEffect, useMemo } from "react";
import {
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { useWallet } from "../contexts/WalletContext";

const TX_EXPLORER_URL: Record<string, string> = {
  mainnet: "https://cardanoscan.io/transaction/",
  preprod: "https://preprod.cardanoscan.io/transaction/",
  preview: "https://preview.cardanoscan.io/transaction/",
};

const ADDRESS_EXPLORER_URL: Record<string, string> = {
  mainnet: "https://cardanoscan.io/address/",
  preprod: "https://preprod.cardanoscan.io/address/",
  preview: "https://preview.cardanoscan.io/address/",
};

export default function ManualWalletPanel() {
  const {
    address,
    linkedWallet,
    connectedWallet,
    config,
    transactions,
    transactionsLoading,
    transactionsError,
    loadTransactions,
    selectedNetwork,
    setSelectedNetwork,
  } = useWallet();

  const activeAddress = address || linkedWallet?.wallet_address || null;
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("wallet_network_preference")
        : null;
    if (saved) setSelectedNetwork(saved);
  }, [setSelectedNetwork]);
  useEffect(() => {
    const next = (linkedWallet?.wallet_network || config?.network || "preview").toLowerCase();
    setSelectedNetwork(next);
  }, [linkedWallet?.wallet_network, config?.network, setSelectedNetwork]);
  const explorerBase = TX_EXPLORER_URL[selectedNetwork] || TX_EXPLORER_URL.preview;
  const explorerAddressBase = ADDRESS_EXPLORER_URL[selectedNetwork] || ADDRESS_EXPLORER_URL.preview;
  const subtitle = connectedWallet
    ? "History synced from your Lace sidebar session."
    : "Use the Lace link in the sidebar to connect and populate history.";
  const recentTransactions = useMemo(() => transactions.slice(0, 10), [transactions]);

  const handleRefresh = () => {
    if (activeAddress) {
      loadTransactions(activeAddress).catch(() => null);
    }
  };

  return (
    <section className="card rounded-2xl border border-default bg-[var(--github-bg-secondary)]/35 p-5 space-y-5">
      <header className="space-y-1">
        <p className="text-sm font-semibold text-primary flex items-center gap-2">
          Lace transaction history
        </p>
        <p className="text-xs text-secondary">{subtitle}</p>
        <p className="text-[11px] text-secondary/70">
          We pull the last 10 submissions seen by Blockfrost for your linked address.
        </p>
      </header>

      <div className="rounded-xl border border-default/70 bg-[var(--github-bg-secondary)]/60 p-4 text-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-secondary/70">
              Active address
            </p>
            <p className="text-primary font-semibold">
              {activeAddress ? truncate(activeAddress) : "No wallet linked"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-[11px] text-secondary/80" htmlFor="network-select">
                Network:
              </label>
              <select
                id="network-select"
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="text-[11px] bg-surface border border-default rounded px-2 py-1 text-primary"
              >
                <option value="mainnet">Mainnet</option>
                <option value="preprod">Preprod</option>
                <option value="preview">Preview</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={!activeAddress || transactionsLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-default px-3 py-2 text-[12px] font-semibold text-secondary hover:text-primary disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${transactionsLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            {activeAddress && (
              <a
                className="inline-flex items-center gap-2 rounded-lg border border-default px-3 py-2 text-[12px] font-semibold text-[var(--github-accent)] hover:border-[var(--github-accent)]"
                href={`${explorerAddressBase}${activeAddress}`}
                target="_blank"
                rel="noreferrer"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Explorer
              </a>
            )}
          </div>
        </div>

        {!activeAddress && (
          <div className="rounded-lg border border-dashed border-default/60 bg-[var(--github-bg-secondary)]/40 p-3 text-[11px] text-secondary">
            Link Lace from the sidebar first. Once connected, history automatically appears here.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-default/70 bg-[var(--github-bg-secondary)]/50">
        <div className="flex items-center justify-between px-4 py-3 text-xs">
          <p className="text-sm font-semibold text-primary">Recent transactions</p>
          {activeAddress && (
            <span className="text-secondary text-[11px]">
              Showing {recentTransactions.length || 0} of 10
            </span>
          )}
        </div>
        <div className="divide-y divide-default/40">
          {transactionsLoading && (
            <div className="px-4 py-6 text-center text-secondary text-sm">
              Loading history…
            </div>
          )}
          {!transactionsLoading && transactionsError && (
            <div className="px-4 py-4 text-[var(--github-danger)] text-sm flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {transactionsError}
            </div>
          )}
          {!transactionsLoading && !transactionsError && recentTransactions.length === 0 && (
            <div className="px-4 py-6 text-center text-secondary text-sm">
              No transactions yet. Send ADA from the Lace panel to populate history.
            </div>
          )}
          {!transactionsLoading && !transactionsError && recentTransactions.length > 0 &&
            recentTransactions.map((tx) => (
              <div key={tx.tx_hash} className="px-4 py-3 text-xs flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary flex items-center gap-1">
                    {truncate(tx.tx_hash)}
                  </p>
                  <p className="text-secondary text-[11px] flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {formatTimestamp(tx.block_time)}
                  </p>
                </div>
                <div className="text-right text-[11px] text-secondary/80 space-y-1">
                  <div>
                    <p>Block #{tx.block_height}</p>
                    <p>Index {tx.tx_index}</p>
                  </div>
                  <a
                    href={`${explorerBase}${tx.tx_hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--github-accent)] hover:underline"
                  >
                    View
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

function truncate(value: string) {
  if (!value) return "--";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

function formatTimestamp(unixSeconds?: number) {
  if (!unixSeconds) return "--";
  try {
    const date = new Date(unixSeconds * 1000);
    return date.toLocaleString();
  } catch {
    return "--";
  }
}
