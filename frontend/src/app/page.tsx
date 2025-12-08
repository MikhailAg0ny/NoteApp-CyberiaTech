"use client";

import {
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import CreateNoteModal from "./components/CreateNoteModal";
import ConfirmModal from "./components/ConfirmModal";
import ErrorDialog from "./components/ErrorDialog";
import SettingsModal from "./components/SettingsModal";
import NoteModal from "./components/NoteModal";
import ManualWalletPanel from "./components/ManualWalletPanel";
import { useWallet } from "./contexts/WalletContext";

type Note = {
  id: number;
  title: string;
  content: string;
  notebook_id?: number | null;
  notebook_name?: string | null;
  tags?: { id?: number; name: string }[];
  category?: string;
  date?: string;
  time?: string;
  createdAt?: string | null;
  tx_hash?: string | null;
  tx_status?: string | null;
  cardano_address?: string | null;
  chain_action?: string | null;
  chain_label?: number | null;
  chain_metadata?: unknown;
  deleted_at?: string | null;
};

type ApiNoteResponse = {
  id: number;
  title?: string | null;
  content?: string | null;
  notebook_id?: number | null;
  notebook_name?: string | null;
  tags?: { id?: number; name: string }[];
  created_at?: string | null;
  tx_hash?: string | null;
  tx_status?: string | null;
  cardano_address?: string | null;
  chain_action?: string | null;
  chain_label?: number | null;
  chain_metadata?: unknown;
  deleted_at?: string | null;
};

type NotebookFilterDetail = {
  notebookId: number | null;
};

const mapApiNote = (apiNote: ApiNoteResponse): Note => {
  const createdAt = apiNote.created_at ?? null;
  return {
    id: apiNote.id,
    title: apiNote.title || "",
    content: apiNote.content || "",
    notebook_id: apiNote.notebook_id ?? null,
    notebook_name: apiNote.notebook_name ?? null,
    tags: apiNote.tags || [],
    category: "Notes",
    date: "Today",
    time: createdAt
      ? new Date(createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : undefined,
    createdAt,
    tx_hash: apiNote.tx_hash ?? null,
    tx_status: apiNote.tx_status ?? null,
    cardano_address: apiNote.cardano_address ?? null,
    chain_action: apiNote.chain_action ?? null,
    chain_label: apiNote.chain_label ?? null,
    chain_metadata: apiNote.chain_metadata ?? null,
    deleted_at: apiNote.deleted_at ?? null,
  };
};

const getErrorMessage = (err: unknown) => {
  if (err instanceof Error) {
    return err.message;
  }
  return "An unexpected error occurred";
};

export default function Page() {
  // Starting with an empty notes array
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<{ id: number; name: string }[]>(
    []
  );
  const [trashNotes, setTrashNotes] = useState<Note[]>([]);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);
  const [activeNotebook, setActiveNotebook] = useState<number | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [selected, setSelected] = useState<Note | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [previewing, setPreviewing] = useState<Note | null>(null);
  const [activeFilter, setActiveFilter] = useState("Today");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<
    { title: string; message: string } | null
  >(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<Note | null>(null);
  const wallet = useWallet();
  const {
    isEnabled: walletEnabled,
    connectedWallet,
    address: walletAddress,
    balanceAda: walletBalance,
    error: walletError,
    clearError: clearWalletError,
    browserMnemonic,
    browserAddress,
    linkedWallet,
    submitNoteTransaction,
    getWalletApi,
    config: walletConfig,
    selectedNetwork,
  } = wallet;
  const manualAddress = linkedWallet?.wallet_address || browserAddress || null;
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
  const BLOCKFROST_PROJECT_ID = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID;
  const [isFabDropdownOpen, setIsFabDropdownOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const showErrorDialog = useCallback(
    (err: unknown, title?: string) => {
      const message = typeof err === "string" ? err : getErrorMessage(err);
      setError(message);
      setErrorDialog({
        title: title || "Something went wrong",
        message,
      });
    },
    []
  );

  const dismissError = useCallback(() => {
    setErrorDialog(null);
    setError(null);
    clearWalletError();
  }, [clearWalletError]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadProfile = () => {
      const email = localStorage.getItem("user_email");
      const name = localStorage.getItem("user_name");
      if (email) {
        setUserProfile({ name: name || email.split("@")[0], email });
      } else {
        setUserProfile(null);
      }
    };
    loadProfile();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "user_email" || event.key === "user_name") {
        loadProfile();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (walletError) {
      showErrorDialog(walletError, "Wallet error");
    }
  }, [walletError, showErrorDialog]);

  const redirectToLogin = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
      window.location.href = "/login";
    }
  };

  const filters = ["Today", "This Week", "This Month"];

  // Fetch all notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!token) {
        redirectToLogin();
        return;
      }
      const res = await fetch(`${API_BASE}/api/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error(`Failed to load notes (${res.status})`);
      const data = (await res.json()) as ApiNoteResponse[];
      const mapped: Note[] = data.map(mapApiNote);
      setNotes(mapped);
    } catch (err) {
      showErrorDialog(err, "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
    try {
      if (!token) {
        redirectToLogin();
        return;
      }
      const res = await fetch(`${API_BASE}/api/notes/trash`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error(`Failed to load trash (${res.status})`);
      const data = (await res.json()) as ApiNoteResponse[];
      setTrashNotes(data.map(mapApiNote));
    } catch (err) {
      showErrorDialog(err, "Failed to load trash");
    }
  };

  const fetchNotebooks = async () => {
    try {
      if (!token) {
        redirectToLogin();
        return;
      }
      const res = await fetch(`${API_BASE}/api/notebooks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setNotebooks(data);
    } catch {}
  };

  useEffect(() => {
    fetchNotes();
    fetchNotebooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maybeSubmitNoteTx = async (action: string, noteContent: string) => {
    if (!walletEnabled) return null;
    const api = getWalletApi?.();
    if (!api || !connectedWallet) return null;
    try {
      const result = await submitNoteTransaction({
        action,
        noteContent,
        targetAddress: walletAddress || undefined,
      });
      return {
        tx_hash: result.txHash,
        tx_status: "pending",
        cardano_address: result.cardanoAddress,
        chain_action: action,
        chain_label: result.label,
        chain_metadata: result.metadata,
      } as const;
    } catch (err) {
      showErrorDialog(err, "Cardano metadata error");
      return null;
    }
  };

  const markNoteConfirmed = async (note: Note) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/notes/${note.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          notebook_id: note.notebook_id ?? null,
          tags: (note.tags || []).map((t) => t.name),
          tx_status: "confirmed",
        }),
      });
      if (!res.ok) return;
      const updated = (await res.json()) as ApiNoteResponse;
      const normalized = mapApiNote(updated);
      setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, ...normalized } : n)));
      setSelected((prev) =>
        prev && prev.id === note.id ? { ...prev, ...normalized } : prev
      );
    } catch (err) {
      showErrorDialog(err, "Failed to update note status");
    }
  };

  const refreshPendingStatuses = useCallback(async () => {
    if (!BLOCKFROST_PROJECT_ID) return;
    const pending = notes.filter(
      (n) => n.tx_hash && (n.tx_status || "").toLowerCase() === "pending"
    );
    if (!pending.length) return;
    const baseUrl = walletConfig?.blockfrostUrl ||
      (selectedNetwork === "mainnet"
        ? "https://cardano-mainnet.blockfrost.io/api/v0"
        : selectedNetwork === "preprod"
        ? "https://cardano-preprod.blockfrost.io/api/v0"
        : "https://cardano-preview.blockfrost.io/api/v0");
    for (const note of pending) {
      try {
        const res = await fetch(`${baseUrl}/txs/${note.tx_hash}`, {
          headers: {
            project_id: BLOCKFROST_PROJECT_ID,
          },
        });
        if (res.ok) {
          await markNoteConfirmed(note);
        }
      } catch (err) {
        console.warn("tx status check failed", err);
      }
    }
  }, [BLOCKFROST_PROJECT_ID, notes, walletConfig?.blockfrostUrl, selectedNetwork]);

  useEffect(() => {
    if (!BLOCKFROST_PROJECT_ID) return;
    const hasPending = notes.some(
      (n) => n.tx_hash && (n.tx_status || "").toLowerCase() === "pending"
    );
    if (!hasPending) return;
    const interval = setInterval(() => {
      refreshPendingStatuses();
    }, 25000);
    refreshPendingStatuses();
    return () => clearInterval(interval);
  }, [BLOCKFROST_PROJECT_ID, notes, refreshPendingStatuses]);

  // Create note (calls backend)
  const addNote = async (
    newTitle: string,
    newContent: string,
    notebookId: number | null,
    tagNames: string[],
    sendMetadata: boolean
  ) => {
    if (!newTitle.trim()) return;
    if (sendMetadata) {
      const proceed =
        typeof window === "undefined" ||
        window.confirm("Send this note's metadata to Cardano?");
      if (!proceed) return;
    }
    try {
      setError(null);
      const txMeta = sendMetadata ? await maybeSubmitNoteTx("create", newContent) : null;
      const res = await fetch(`${API_BASE}/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          notebook_id: notebookId,
          tags: tagNames,
          ...(txMeta ? txMeta : {}),
        }),
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error("Create failed");
      const created = (await res.json()) as ApiNoteResponse;
      const note = mapApiNote(created);
      setNotes((prev) => [note, ...prev]);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2600);
      // Open the newly created note in modal for viewing/editing
      setSelected(note);
      setIsNoteModalOpen(true);
    } catch (err) {
      showErrorDialog(err, "Failed to create note");
    }
  };

  // Update note
  const saveNoteChanges = async (
    noteId: number,
    payload: {
      title: string;
      content: string;
      notebook_id: number | null;
      tags: string[];
      sendMetadata: boolean;
    }
  ) => {
    if (payload.sendMetadata) {
      const proceed =
        typeof window === "undefined" ||
        window.confirm("Send this edit as Cardano metadata?");
      if (!proceed) return;
    }
    try {
      setError(null);
      const txMeta = payload.sendMetadata
        ? await maybeSubmitNoteTx("update", payload.content)
        : null;
      const res = await fetch(`${API_BASE}/api/notes/${noteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
          notebook_id: payload.notebook_id,
          tags: payload.tags,
          ...(txMeta ? txMeta : {}),
        }),
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error("Update failed");
      const updated = (await res.json()) as ApiNoteResponse;
      const normalized = mapApiNote(updated);
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, ...normalized } : n))
      );
      setSelected((prev) =>
        prev && prev.id === noteId ? { ...prev, ...normalized } : prev
      );
    } catch (err) {
      showErrorDialog(err, "Failed to update note");
    }
  };

  // Delete note
  const deleteNote = async (id: number) => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error("Delete failed");
      const payload = (await res.json()) as { id: number; deleted_at?: string };
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setTrashNotes((prev) => [
        {
          ...(selected && selected.id === id ? selected : (prev.find((n) => n.id === id) as Note) || { id, title: "", content: "" }),
          deleted_at: payload.deleted_at || new Date().toISOString(),
        },
        ...prev.filter((n) => n.id !== id),
      ]);
      if (selected?.id === id) {
        setSelected(null);
        setIsNoteModalOpen(false);
      }
    } catch (err) {
      showErrorDialog(err, "Failed to delete note");
    }
  };

  // Select note
  const selectNote = (note: Note) => {
    setSelected(note);
    setIsNoteModalOpen(true);
  };

  // Listen for the custom event from the sidebar
  useEffect(() => {
    const handleOpenCreateModal = () => {
      setIsCreateModalOpen(true);
    };

    const handleOpenSettings = () => setIsSettingsOpen(true);
    document.addEventListener("openCreateNoteModal", handleOpenCreateModal);
    document.addEventListener("openSettingsModal", handleOpenSettings);
    const handleFilterNotebook = (event: Event) => {
      const customEvent = event as CustomEvent<NotebookFilterDetail>;
      const target = customEvent.detail?.notebookId as number | string | null;
      if (target === "trash") {
        setShowTrash(true);
        setActiveNotebook(null);
        fetchTrash();
      } else {
        setShowTrash(false);
        setActiveNotebook((target as number) ?? null);
      }
    };
    document.addEventListener("filterNotebook", handleFilterNotebook);

    return () => {
      document.removeEventListener(
        "openCreateNoteModal",
        handleOpenCreateModal
      );
      document.removeEventListener("openSettingsModal", handleOpenSettings);
      document.removeEventListener("filterNotebook", handleFilterNotebook);
    };
  }, []);

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday);
  const weekday = (startOfToday.getDay() + 6) % 7; // convert so Monday = 0
  startOfWeek.setDate(startOfWeek.getDate() - weekday);
  const startOfMonth = new Date(startOfToday);
  startOfMonth.setDate(1);

  const matchesTimeFilter = (note: Note) => {
    if (!note.createdAt) return true;
    const created = new Date(note.createdAt);
    if (Number.isNaN(created.getTime())) return true;

    switch (activeFilter) {
      case "Today":
        return created >= startOfToday && created <= now;
      case "This Week":
        return created >= startOfWeek && created <= now;
      case "This Month":
        return created >= startOfMonth && created <= now;
      default:
        return true;
    }
  };

  const matchesNotebookFilter = (note: Note) =>
    !activeNotebook || note.notebook_id === activeNotebook;

  const filteredNotes = showTrash
    ? trashNotes
    : notes.filter((note) => matchesNotebookFilter(note) && matchesTimeFilter(note));

  const restoreNote = async (id: number) => {
    try {
      if (!token) return redirectToLogin();
      const res = await fetch(`${API_BASE}/api/notes/${id}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return redirectToLogin();
      if (!res.ok) throw new Error("Restore failed");
      const data = (await res.json()) as ApiNoteResponse;
      const restored = mapApiNote(data);
      setTrashNotes((prev) => prev.filter((n) => n.id !== id));
      setNotes((prev) => [restored, ...prev]);
    } catch (err) {
      showErrorDialog(err, "Failed to restore note");
    }
  };

  const deletePermanently = async (note: Note) => {
    try {
      if (!token) return redirectToLogin();
      const res = await fetch(`${API_BASE}/api/notes/${note.id}/permanent`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return redirectToLogin();
      if (!res.ok) throw new Error("Permanent delete failed");
      setTrashNotes((prev) => prev.filter((n) => n.id !== note.id));
    } catch (err) {
      showErrorDialog(err, "Failed to permanently delete note");
    } finally {
      setPermanentDeleteTarget(null);
    }
  };

  const formatNoteDate = (iso?: string | null) => {
    if (!iso) return null;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status?: string | null) => {
    if (!status) return null;
    const normalized = status.toLowerCase();
    if (normalized === "confirmed") {
      return {
        label: "Confirmed",
        className:
          "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40",
      };
    }
    if (normalized === "pending") {
      return {
        label: "Pending",
        className:
          "bg-amber-500/15 text-amber-300 border border-amber-500/40",
      };
    }
    return {
      label: status,
      className: "bg-surface border border-default text-secondary",
    };
  };

  return (
    <div className="flex flex-col h-full bg-app p-4 md:p-8 transition-colors">
      {/* Create Note Modal */}
      <CreateNoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={addNote}
        notebooks={notebooks}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <ErrorDialog
        open={!!errorDialog}
        title={errorDialog?.title}
        message={errorDialog?.message}
        onClose={dismissError}
      />

      {/* Header with title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-primary tracking-tight bg-gradient-to-r from-[var(--github-text-primary)] to-[var(--github-text-secondary)] bg-clip-text">
            My Notes
          </h1>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-secondary">
              <div className="w-3 h-3 border-2 border-[var(--github-accent)] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--github-danger)] bg-[var(--github-danger)]/10 px-2.5 py-1 rounded-full">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {userProfile && (
            <div className="hidden md:flex items-center gap-3 bg-surface border border-default rounded-full px-3 py-1.5 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--github-accent)] to-[var(--github-accent-hover)] flex items-center justify-center text-white shadow-lg">
                <UserCircleIcon className="w-5 h-5" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="text-sm font-semibold text-primary truncate">
                  {userProfile.name || userProfile.email}
                </div>
                <div className="text-[11px] text-secondary truncate max-w-[180px]">
                  {userProfile.email}
                </div>
              </div>
            </div>
          )}
          {/* Filters + Logout */}
          <div className="flex items-center bg-surface border border-default rounded-full p-1 shadow-sm transition-smooth">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 md:px-5 py-1.5 rounded-full text-sm font-medium transition-smooth ${
                  activeFilter === filter
                    ? "bg-[var(--github-accent)] text-white shadow-lg shadow-[var(--github-accent)]/25"
                    : "text-secondary hover:text-primary hover:bg-[var(--github-border)]/30"
                }`}
              >
                {filter}
              </button>
            ))}
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user_id");
                localStorage.removeItem("user_name");
                localStorage.removeItem("user_email");
                window.location.href = "/login";
              }}
              className="ml-2 px-3 md:px-4 py-1.5 rounded-full text-sm font-medium text-secondary hover:text-[var(--github-danger)] hover:bg-[var(--github-danger)]/10 transition-smooth"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Quick view toggles ensure Trash/All are always reachable, even when wallet panels expand */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setShowTrash(false);
            setActiveNotebook(null);
            fetchNotes();
          }}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-smooth ${
            showTrash
              ? "text-secondary bg-surface border-default hover:text-primary"
              : "bg-[var(--github-accent)] text-white border-transparent shadow shadow-[var(--github-accent)]/30"
          }`}
        >
          All notes
        </button>
        <button
          onClick={() => {
            setShowTrash(true);
            setActiveNotebook(null);
            fetchTrash();
          }}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-smooth ${
            showTrash
              ? "bg-[var(--github-danger)] text-white border-transparent shadow shadow-[var(--github-danger)]/30"
              : "text-secondary bg-surface border-default hover:text-primary"
          }`}
        >
          Trash
        </button>
      </div>

      {walletEnabled && connectedWallet && walletAddress && (
        <div className="mb-6 card rounded-2xl border border-dashed border-default bg-[var(--github-bg-secondary)]/40 p-4 flex flex-col gap-2">
          <p className="text-sm font-semibold text-primary flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Wallet connected: {connectedWallet.label}
          </p>
          <p className="text-xs text-secondary">
            {walletAddress.slice(0, 12)}…{walletAddress.slice(-6)} ·{" "}
            {walletBalance === null ? "--" : `${walletBalance.toFixed(2)} ADA`}
          </p>
          {walletError && (
            <p className="text-xs text-[var(--github-danger)] mt-1">
              {walletError}
            </p>
          )}
        </div>
      )}

      {walletEnabled && (
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-[var(--github-accent)]/15 text-[var(--github-accent)] font-semibold">
              Manual wallet mode active
            </span>
            {browserMnemonic && (
              <span className="px-3 py-1 rounded-full font-semibold bg-emerald-500/15 text-emerald-300">
                Mnemonic detected in this browser
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-surface border border-dashed border-default text-secondary font-semibold">
              {manualAddress
                ? `Linked address: ${manualAddress.slice(
                    0,
                    10
                  )}…${manualAddress.slice(-6)}`
                : "No address on file"}
            </span>
          </div>
          <ManualWalletPanel />
        </div>
      )}

      {/* Notes Grid (always visible now) */}
      <>
        {(() => {
          if (loading && notes.length === 0) {
            return (
              <div className="mb-8">
                <div className="skeleton h-8 w-32 mb-5 rounded"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card rounded-lg p-5 shadow-sm">
                      <div className="skeleton h-6 w-3/4 mb-3 rounded"></div>
                      <div className="skeleton h-4 w-full mb-2 rounded"></div>
                      <div className="skeleton h-4 w-5/6 mb-2 rounded"></div>
                      <div className="skeleton h-4 w-4/6 mb-4 rounded"></div>
                      <div className="flex gap-2 mb-3">
                        <div className="skeleton h-5 w-16 rounded"></div>
                        <div className="skeleton h-5 w-16 rounded"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="skeleton h-4 w-12 rounded"></div>
                        <div className="flex gap-3">
                          <div className="skeleton h-4 w-4 rounded"></div>
                          <div className="skeleton h-4 w-4 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (showTrash) {
            return (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-semibold text-primary tracking-tight flex items-center gap-2">
                    Trash
                    <span className="text-[11px] px-2 py-1 rounded-full bg-[var(--github-danger)]/10 text-[var(--github-danger)] border border-[var(--github-danger)]/30">
                      Auto-purges after 30 days
                    </span>
                  </h2>
                  <div className="text-sm text-secondary">
                    {filteredNotes.length} trashed
                  </div>
                </div>
                {filteredNotes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredNotes.map((note, idx) => (
                      <div
                        key={note.id}
                        className="group relative card rounded-2xl p-5 shadow-lg overflow-hidden border border-dashed border-default anim-slide-up"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--github-danger)]/0 to-[var(--github-danger)]/0 opacity-0 group-hover:opacity-100 group-hover:from-[var(--github-danger)]/10 group-hover:to-transparent transition-all" />
                        <div className="relative z-10 flex flex-col gap-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-semibold text-lg text-primary truncate">
                                {note.title}
                              </h3>
                              <button
                                onClick={() => restoreNote(note.id)}
                                className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:shadow hover:-translate-y-[1px] transition-smooth"
                              >
                                Restore
                              </button>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-xs text-secondary">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--github-border)]/20 text-secondary border border-default">
                                Deleted {note.deleted_at ? new Date(note.deleted_at).toLocaleString() : "just now"}
                              </span>
                              <span className="text-[10px] uppercase tracking-wide text-[var(--github-danger)]/80 font-semibold">
                                Auto purge in 30 days
                              </span>
                            </div>
                            <button
                              onClick={() => setPermanentDeleteTarget(note)}
                              className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[11px] font-semibold text-[var(--github-danger)] bg-[var(--github-danger)]/10 border border-[var(--github-danger)]/30 hover:bg-[var(--github-danger)]/20 hover:-translate-y-[1px] transition-smooth"
                            >
                              Delete permanently
                            </button>
                          </div>
                          <p className="text-secondary line-clamp-3 text-sm leading-relaxed">
                            {note.content || "No content"}
                          </p>
                          <div className="text-[11px] text-secondary/80 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-[var(--github-danger)]/15 text-[var(--github-danger)] border border-[var(--github-danger)]/30">
                              Removed
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[var(--github-accent)]/10 text-[var(--github-accent)] border border-[var(--github-accent)]/30">
                              Trash
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card rounded-2xl p-8 text-center border border-dashed border-default text-secondary">
                    <p className="font-medium text-primary mb-2">Trash is empty</p>
                    <p className="text-sm">Deleted notes stay here for 30 days before permanent removal.</p>
                  </div>
                )}
              </div>
            );
          }

          if (notes.length > 0) {
            return (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-semibold text-primary tracking-tight">
                    All Notes
                  </h2>
                  <div className="text-sm text-secondary">
                    {filteredNotes.length} notes
                  </div>
                </div>
                {filteredNotes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredNotes.map((note, idx) => (
                      <div
                        key={note.id}
                        onClick={() => selectNote(note)}
                        className="group relative card rounded-2xl p-5 shadow-lg cursor-pointer anim-slide-up transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--github-accent)]/0 to-[var(--github-accent)]/0 opacity-0 group-hover:opacity-100 group-hover:from-[var(--github-accent)]/10 group-hover:to-transparent transition-all" />
                        <div className="relative z-10 flex flex-col gap-3">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-lg text-primary truncate transition-colors group-hover:text-[var(--github-accent)]">
                                {note.title}
                              </h3>
                              {(() => {
                                const badge = getStatusBadge(note.tx_status);
                                return badge ? (
                                  <span
                                    className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${badge.className}`}
                                  >
                                    {badge.label}
                                  </span>
                                ) : null;
                              })()}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNote(note.id);
                                }}
                                className="p-1 rounded-md text-secondary hover:text-[var(--github-danger)] hover:bg-[var(--github-danger)]/10 transition-smooth opacity-0 group-hover:opacity-100"
                                title="Delete note"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-secondary line-clamp-3 text-sm leading-relaxed">
                              {note.content || "No content"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {note.notebook_name && (
                              <span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--github-accent)]/15 text-[var(--github-accent)] font-medium">
                                {note.notebook_name}
                              </span>
                            )}
                            {note.tags?.slice(0, 4).map((t) => (
                              <span
                                key={t.name}
                                className="text-[10px] px-2.5 py-1 rounded-full bg-surface border border-default text-secondary hover:border-[var(--github-accent)] transition-colors"
                              >
                                {t.name}
                              </span>
                            ))}
                            {note.tags && note.tags.length > 4 && (
                              <span className="text-[10px] px-2.5 py-1 rounded-full bg-surface border border-dashed border-default text-secondary">
                                +{note.tags.length - 4}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-secondary/80 pt-2 border-t border-default/40 gap-2">
                            <div className="flex flex-wrap items-center gap-3">
                              {formatNoteDate(note.createdAt) && (
                                <span className="flex items-center gap-1.5">
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V5a3 3 0 016 0v2m5 4H5m14 0v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6"
                                    />
                                  </svg>
                                  <span>{formatNoteDate(note.createdAt)}</span>
                                </span>
                              )}
                              {note.time && (
                                <span className="flex items-center gap-1.5">
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span>{note.time}</span>
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewing(note);
                              }}
                              className="text-[11px] font-semibold text-[var(--github-accent)] hover:underline"
                            >
                              Quick preview
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card rounded-2xl p-8 text-center border border-dashed border-default text-secondary">
                    <p className="font-medium text-primary mb-2">
                      No notes match this filter
                    </p>
                    <p className="text-sm">
                      Try switching the timeframe or notebook selection to see
                      other notes.
                    </p>
                  </div>
                )}
              </div>
            );
          }

          // Empty state
          return (
            <div className="flex flex-col items-center justify-center py-24 anim-fade-in">
              <div className="w-24 h-24 bg-gradient-to-br from-surface to-[var(--github-border)]/30 border-2 border-default rounded-2xl flex items-center justify-center mb-6 text-secondary shadow-lg">
                <DocumentTextIcon className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-bold text-primary mb-3 tracking-tight">
                No notes yet
              </h3>
              <p className="text-secondary mb-8 text-center max-w-md leading-relaxed">
                Start capturing your ideas and thoughts with CyberiaTech's
                modern note-taking experience
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3 btn-primary font-semibold rounded-lg transition-smooth shadow-lg shadow-[var(--github-accent)]/25 hover:shadow-xl hover:shadow-[var(--github-accent)]/35"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Your First Note</span>
              </button>
            </div>
          );
        })()}

        {/* Create Note Button */}
        <div className="fixed bottom-6 right-6 z-50" ref={fabRef}>
          {/* Dropdown Container */}
          {isFabDropdownOpen && (
            <div className="absolute bottom-16 right-0 w-48 bg-surface border border-default rounded-lg shadow-2xl overflow-hidden transition-all duration-200 origin-bottom-right">
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-[var(--github-accent)]/10 text-primary transition-colors duration-150"
                onClick={() => {
                  setIsFabDropdownOpen(false);
                  setIsCreateModalOpen(true); // Action: Open Create Note Modal
                }}
              >
                <DocumentTextIcon className="w-5 h-5 text-[var(--github-accent)]" />
                Create Note
              </button>
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-[var(--github-accent)]/10 text-primary transition-colors duration-150"
                onClick={() => {
                  setIsFabDropdownOpen(false);
                  document.dispatchEvent(
                    new CustomEvent("openCreateNotebookModal")
                  ); // Action: Open Create Notebook Modal
                }}
                disabled={!token}
              >
                <PlusIcon className="w-5 h-5 text-[var(--github-accent)]" />
                Create Notebook
              </button>
            </div>
          )}

          {/* FAB Button */}
          <button
            onClick={() => setIsFabDropdownOpen((prev) => !prev)} // Action: Toggle the dropdown
            className={`w-16 h-16 rounded-full bg-[var(--github-accent)] text-white flex items-center justify-center shadow-2xl transition-all duration-300 ${
              isFabDropdownOpen ? "rotate-45 scale-110" : "hover:scale-110"
            }`}
            title="Create"
          >
            <PlusIcon className="w-7 h-7" />
          </button>
        </div>
      </>

      {/* Quick preview overlay */}
      {previewing && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setPreviewing(null)}
        >
          <div
            className="card relative max-w-2xl w-full rounded-3xl p-8 shadow-2xl anim-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-6 mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-secondary/70 mb-1">
                  Quick Preview
                </p>
                <h3 className="text-2xl font-semibold text-primary leading-tight">
                  {previewing.title || "Untitled note"}
                </h3>
              </div>
              <button
                onClick={() => setPreviewing(null)}
                className="text-sm text-secondary hover:text-primary px-3 py-1 rounded-full hover:bg-[var(--github-border)]/40 transition-smooth"
              >
                Close
              </button>
            </div>
            <p className="text-secondary leading-relaxed text-[15px] whitespace-pre-line mb-6 max-h-60 overflow-auto pr-1">
              {previewing.content || "No content"}
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {(() => {
                const badge = getStatusBadge(previewing.tx_status);
                return badge ? (
                  <span
                    className={`text-[11px] px-3 py-1 rounded-full font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                ) : null;
              })()}
              {previewing.tx_hash && (
                <span className="text-[11px] font-mono text-secondary truncate max-w-xs" title={previewing.tx_hash}>
                  Tx: {previewing.tx_hash.slice(0, 10)}…
                </span>
              )}
              {previewing.notebook_name && (
                <span className="text-[11px] px-3 py-1 rounded-full bg-[var(--github-accent)]/15 text-[var(--github-accent)] font-medium">
                  {previewing.notebook_name}
                </span>
              )}
              {previewing.tags?.map((tag) => (
                <span
                  key={tag.id ?? tag.name}
                  className="text-[11px] px-3 py-1 rounded-full bg-surface border border-default text-secondary"
                >
                  {tag.name}
                </span>
              ))}
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-xs text-secondary/80 flex flex-wrap items-center gap-3">
                {formatNoteDate(previewing.createdAt) && (
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V5a3 3 0 016 0v2m5 4H5m14 0v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6"
                      />
                    </svg>
                    <span>{formatNoteDate(previewing.createdAt)}</span>
                  </span>
                )}
                {previewing.time && (
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{previewing.time}</span>
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setPreviewing(null)}
                  className="px-4 py-2 rounded-lg border border-default text-sm font-medium text-secondary hover:text-primary"
                >
                  Keep browsing
                </button>
                <button
                  onClick={() => {
                    const noteToOpen = previewing;
                    setPreviewing(null);
                    if (noteToOpen) {
                      selectNote(noteToOpen);
                    }
                  }}
                  className="px-5 py-2 rounded-lg bg-[var(--github-accent)] text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-smooth"
                >
                  Open full note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-24 md:bottom-28 right-6 md:right-8 card px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2.5 anim-toast-in border-l-4 border-[var(--github-accent)] backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-[var(--github-accent)] animate-pulse" />
          <span className="text-sm font-medium text-primary">
            Note created successfully
          </span>
          <svg
            className="w-4 h-4 text-[var(--github-accent)]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      <NoteModal
        open={isNoteModalOpen && !!selected}
        note={selected}
        notebooks={notebooks}
        onClose={() => {
          setIsNoteModalOpen(false);
          setSelected(null);
        }}
        onSave={saveNoteChanges}
        onDelete={deleteNote}
      />
      <ConfirmModal
        isOpen={!!permanentDeleteTarget}
        message={`Permanently delete "${permanentDeleteTarget?.title || "this note"}"? This cannot be undone.`}
        onCancel={() => setPermanentDeleteTarget(null)}
        onConfirm={() => {
          if (permanentDeleteTarget) {
            deletePermanently(permanentDeleteTarget);
          }
        }}
      />
    </div>
  );
}
