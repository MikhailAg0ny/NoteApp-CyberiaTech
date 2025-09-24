"use client";

import {
  Cog6ToothIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import CreateNoteModal from "./CreateNoteModal";
import CreateNotebookModal from "./CreateNoteBookModal";

interface Notebook {
  id: number;
  name: string;
}

export default function Sidebar() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebook, setActiveNotebook] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
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

  // Listen to notebook modal event
  useEffect(() => {
    const handleOpen = () => setShowNotebookModal(true);
    document.addEventListener("openCreateNotebookModal", handleOpen);
    return () =>
      document.removeEventListener("openCreateNotebookModal", handleOpen);
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

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-surface border-r border-default shadow-sm transition-colors select-none">
      {/* Logo */}
      <div className="flex items-center justify-center border-b border-default/60 py-6 px-4">
        <div className="relative h-16 w-[200px] filter drop-shadow-sm">
          <Image
            src="/logo.svg"
            alt="CyberiaTech Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 mt-2">
        {/* Create Dropdown */}
        <div className="px-3 py-2 relative" ref={dropdownRef}>
          <button
            className="flex items-center justify-between w-full px-4 py-2 rounded-md bg-[var(--github-accent)] text-white hover:bg-[var(--github-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--github-accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--github-bg-secondary)] transition shadow-sm"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              <span className="font-medium">Create</span>
            </div>
            <ChevronDownIcon className="w-4 h-4" />
          </button>

          {dropdownOpen && (
            <div className="absolute mt-1 w-full bg-surface border border-default rounded-md shadow-lg z-50">
              <button
                className="w-full text-left px-4 py-2 hover:bg-[var(--github-accent)]/10 transition"
                onClick={() => {
                  setDropdownOpen(false);
                  handleCreateNoteClick();
                }}
              >
                Create Note
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-[var(--github-accent)]/10 transition"
                onClick={() => {
                  setDropdownOpen(false);
                  setShowNotebookModal(true);
                }}
              >
                Create Notebook
              </button>
            </div>
          )}
        </div>

        {/* Other Nav */}
        <nav className="mt-1">
          {[
            { icon: MagnifyingGlassIcon, label: "Search" },
            { icon: DocumentTextIcon, label: "All Notes" },
            { icon: TrashIcon, label: "Trash" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className="group flex w-full items-center px-3 py-2 rounded-md text-sm text-secondary hover:text-primary transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--github-accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--github-bg-secondary)]"
            >
              <Icon className="w-5 h-5 mr-2.5 text-secondary group-hover:text-primary transition-colors" />
              <span className="font-medium tracking-wide">{label}</span>
              <span className="absolute inset-0 rounded-md bg-[var(--github-border)]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </nav>

        {/* Notebooks */}
        {notebooks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-default/40">
            <div className="px-3 text-[10px] uppercase tracking-wide font-semibold text-secondary mb-2">
              Notebooks
            </div>
            <button
              onClick={() => selectNotebook(null)}
              className={`block w-full text-left px-3 py-1.5 text-sm rounded-md mb-1 transition-colors ${
                activeNotebook === null
                  ? "bg-[var(--github-accent)] text-white"
                  : "text-secondary hover:text-primary"
              }`}
            >
              All
            </button>
            {notebooks.map((nb) => (
              <button
                key={nb.id}
                onClick={() => selectNotebook(nb.id)}
                className={`block w-full text-left px-3 py-1.5 text-sm rounded-md mb-1 truncate transition-colors ${
                  activeNotebook === nb.id
                    ? "bg-[var(--github-accent)] text-white"
                    : "text-secondary hover:text-primary"
                }`}
                title={nb.name}
              >
                {nb.name}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Settings */}
      <div className="mt-auto p-4 border-t border-default/70 bg-[linear-gradient(var(--github-bg-secondary),var(--github-bg-secondary))]">
        <button
          onClick={openSettings}
          className="flex items-center gap-2.5 text-sm text-secondary hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--github-accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--github-bg-secondary)]"
        >
          <Cog6ToothIcon className="w-5 h-5" />
          <span>Settings</span>
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
              // Update notebooks live
              setNotebooks((prev) => [...prev, data]);
              // Dispatch event so CreateNoteModal can refresh its list
              document.dispatchEvent(
                new CustomEvent("notebooksUpdated", { detail: data })
              );
            });
        }}
      />
    </aside>
  );
}
