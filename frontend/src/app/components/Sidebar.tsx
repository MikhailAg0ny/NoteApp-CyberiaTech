"use client";

import {
  Cog6ToothIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import CreateNotebookModal from "./CreateNoteBookModal";
import ConfirmModal from "./ConfirmModal";

interface Notebook {
  id: number;
  name: string;
}

export default function Sidebar() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebook, setActiveNotebook] = useState<number | null>(null);

  // Separate state variables
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [notebookDropdownOpen, setNotebookDropdownOpen] = useState<
    number | null
  >(null);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    id: number | null;
  }>({
    open: false,
    id: null,
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const handler = () => setShowNotebookModal(true);
    document.addEventListener("openCreateNotebookModal", handler);
    return () =>
      document.removeEventListener("openCreateNotebookModal", handler);
  }, []);

  // Close outside clicks for Create dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setCreateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch notebooks
  useEffect(() => {
    const fetchNotebooks = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/notebooks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotebooks(data);
        }
      } catch {}
    };
    fetchNotebooks();
  }, [token, API_BASE]);

  // Listen for notebookCreated events from anywhere
  useEffect(() => {
    const handleNotebookCreated = (e: any) => {
      const newNotebook = e.detail;
      setNotebooks((prev) => [...prev, newNotebook]);
    };

    document.addEventListener("notebookCreated", handleNotebookCreated);
    return () =>
      document.removeEventListener("notebookCreated", handleNotebookCreated);
  }, []);

  const openSettings = () => {
    document.dispatchEvent(new CustomEvent("openSettingsModal"));
  };

  const selectNotebook = (id: number | null) => {
    setActiveNotebook(id);
    document.dispatchEvent(
      new CustomEvent("filterNotebook", { detail: { notebookId: id } })
    );
  };

  const handleCreateNoteClick = () => {
    document.dispatchEvent(new CustomEvent("openCreateNoteModal"));
  };

  const handleUpdateClick = (nb: Notebook) => {
    setEditingId(nb.id);
    setTempName(nb.name);
    setNotebookDropdownOpen(null);
  };

  const handleSave = async (id: number) => {
    if (!tempName.trim() || !token) return;

    try {
      const res = await fetch(`${API_BASE}/api/notebooks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: tempName.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNotebooks((prev) => prev.map((nb) => (nb.id === id ? updated : nb)));
        setEditingId(null);
        setTempName("");
      }
    } catch (err) {
      console.error("Failed to update notebook:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/notebooks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotebooks((prev) => prev.filter((nb) => nb.id !== id));
        if (activeNotebook === id) setActiveNotebook(null);
      }
    } catch (err) {
      console.error("Failed to delete notebook:", err);
    }
  };

  return (
    <aside className="hidden md:flex md:flex-col w-72 bg-surface border-r border-default shadow-lg transition-colors select-none relative">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--github-accent)]/5 via-transparent to-transparent z-0 pointer-events-none"></div>

      {/* Logo */}
      <div className="relative z-10 border-b border-default/60">
        <div className="py-8 px-6 flex items-center justify-center">
          <Image
            src="/logo.svg"
            alt="CyberiaTech Logo"
            width={120}
            height={60}
            className="object-contain transition-opacity hover:opacity-90"
            priority
          />
        </div>
      </div>

      {/* Navigation & Notebooks */}
      <nav className="flex-1 p-4 space-y-2 mt-2 relative z-10">
        {/* Quick Navigation */}
        <div className="space-y-1">
          {[
            { icon: MagnifyingGlassIcon, label: "Search" },
            { icon: DocumentTextIcon, label: "All Notes" },
            { icon: TrashIcon, label: "Trash" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className="group flex w-full items-center justify-between px-4 py-3 rounded-lg text-sm text-secondary hover:text-primary hover:bg-[var(--github-border)]/30 transition-smooth relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--github-accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--github-bg-secondary)] overflow-hidden"
            >
              <div className="flex items-center gap-3 relative z-10">
                <Icon className="w-5 h-5 text-secondary group-hover:text-[var(--github-accent)] transition-colors" />
                <span className="font-medium">{label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Notebooks Section */}
        {notebooks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-default/40">
            <div className="px-4 mb-3 flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider font-bold text-secondary">
                Notebooks
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface text-secondary font-medium">
                {notebooks.length}
              </span>
            </div>

            {/* Scrollable Notebook List */}
            <div className="space-y-1 h-96 overflow-y-auto pr-2">
              <button
                onClick={() => selectNotebook(null)}
                className={`block w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all relative overflow-hidden group ${
                  activeNotebook === null
                    ? "bg-gradient-to-r from-[var(--github-accent)] to-[var(--github-accent-hover)] text-white font-semibold shadow-lg shadow-[var(--github-accent)]/20"
                    : "text-secondary hover:text-primary hover:bg-[var(--github-border)]/30"
                }`}
              >
                <div className="flex items-center gap-2.5 relative z-10">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <span>All Notebooks</span>
                </div>
                {activeNotebook === null && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
                )}
              </button>

              {notebooks.map((nb) => (
                <div key={nb.id} className="relative">
                  <button
                    onClick={() => selectNotebook(nb.id)}
                    className={`block w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all truncate relative overflow-hidden group ${
                      activeNotebook === nb.id
                        ? "bg-gradient-to-r from-[var(--github-accent)] to-[var(--github-accent-hover)] text-white font-semibold shadow-lg shadow-[var(--github-accent)]/20"
                        : "text-secondary hover:text-primary hover:bg-[var(--github-border)]/30"
                    }`}
                    title={nb.name}
                  >
                    <div className="flex items-center justify-between gap-2.5 relative z-10">
                      {editingId === nb.id ? (
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onBlur={() => handleSave(nb.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave(nb.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="w-full px-1 py-0.5 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--github-accent)]"
                          autoFocus
                        />
                      ) : (
                        <span className="truncate">{nb.name}</span>
                      )}
                      <EllipsisVerticalIcon
                        className="w-4 h-4 cursor-pointer text-secondary hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotebookDropdownOpen(
                            nb.id === notebookDropdownOpen ? null : nb.id
                          );
                        }}
                      />
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {notebookDropdownOpen === nb.id && (
                    <div className="absolute right-0 mt-1 w-32 bg-surface border border-default rounded-lg shadow-lg z-50">
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-red-100 text-red-600"
                        onClick={() =>
                          setConfirmDelete({ open: true, id: nb.id })
                        }
                      >
                        Delete
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => handleUpdateClick(nb)}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Settings */}
      <div className="mt-auto p-4 border-t border-default/60 bg-[var(--github-bg-secondary)]/50 backdrop-blur-sm relative z-10">
        <button
          onClick={openSettings}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-secondary hover:text-primary hover:bg-[var(--github-border)]/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--github-accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--github-bg-secondary)] group hover:scale-105"
        >
          <Cog6ToothIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          <span className="font-medium">Settings</span>
        </button>
      </div>

      {/* Create Notebook Modal */}
      <CreateNotebookModal
        isOpen={showNotebookModal}
        onClose={() => setShowNotebookModal(false)}
        onSave={(name) => {
          fetch(`${API_BASE}/api/notebooks`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name }),
          })
            .then((res) => res.json())
            .then((data) => {
              setNotebooks((prev) => [...prev, data]);
              document.dispatchEvent(
                new CustomEvent("notebooksUpdated", { detail: data })
              );
            });
        }}
      />

      <ConfirmModal
        isOpen={confirmDelete.open}
        message="Are you sure you want to delete this notebook? This action cannot be undone."
        onCancel={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => {
          if (confirmDelete.id !== null) handleDelete(confirmDelete.id);
          setConfirmDelete({ open: false, id: null });
        }}
      />
    </aside>
  );
}
