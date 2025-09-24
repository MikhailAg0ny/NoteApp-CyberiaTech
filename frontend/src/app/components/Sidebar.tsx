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

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
            onClick={() => setCreateDropdownOpen((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              <span className="font-medium">Create</span>
            </div>
            <ChevronDownIcon className="w-4 h-4" />
          </button>

          {createDropdownOpen && (
            <div className="absolute mt-1 w-full bg-surface border border-default rounded-md shadow-lg z-50">
              <button
                className="w-full text-left px-4 py-2 hover:bg-[var(--github-accent)]/10 transition"
                onClick={() => {
                  setCreateDropdownOpen(false);
                  handleCreateNoteClick();
                }}
              >
                Create Note
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-[var(--github-accent)]/10 transition"
                onClick={() => {
                  if (!token) return;
                  setCreateDropdownOpen(false);
                  setShowNotebookModal(true);
                }}
                disabled={!token}
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
        <div className="mt-4 pt-4 border-t border-default/40">
          <div className="px-3 text-[10px] uppercase tracking-wide font-semibold text-secondary mb-2">
            Notebooks
          </div>

          {/* Render message only if there are no notebooks */}
          {notebooks.length === 0 && (
            <div className="px-3 py-1.5 text-sm text-gray-500 italic">
              No Notebooks Yet
            </div>
          )}

          {notebooks.length > 0 && (
            <div>
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
                <div
                  key={nb.id}
                  className={`flex items-center justify-between w-full px-3 py-1.5 mb-1 rounded-md transition-colors ${
                    activeNotebook === nb.id
                      ? "bg-[var(--github-accent)] text-white"
                      : "text-secondary hover:text-primary"
                  }`}
                  title={nb.name}
                >
                  {editingId === nb.id ? (
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={() => handleSave(nb.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleSave(nb.id)}
                      className="flex-1 text-sm px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="truncate cursor-pointer flex-1"
                      onClick={() => selectNotebook(nb.id)}
                    >
                      {nb.name}
                    </span>
                  )}

                  {/* Vertical triple-dots dropdown */}
                  <div className="relative">
                    <button
                      className="p-1 hover:bg-gray-200 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotebookDropdownOpen((prev) =>
                          prev === nb.id ? null : nb.id
                        );
                      }}
                    >
                      <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
                    </button>

                    {notebookDropdownOpen === nb.id && (
                      <div className="absolute right-0 mt-1 w-24 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateClick(nb);
                          }}
                          className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
                        >
                          Update
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(nb.id);
                            setNotebookDropdownOpen(null);
                          }}
                          className="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
              setNotebooks((prev) => [...prev, data]);
              document.dispatchEvent(
                new CustomEvent("notebooksUpdated", { detail: data })
              );
            });
        }}
      />
    </aside>
  );
}
