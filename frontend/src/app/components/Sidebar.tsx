"use client";

import {
  Cog6ToothIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import CreateNotebookModal from "./CreateNoteBookModal";
import { useTheme } from "./ThemeProvider";
import WalletConnector from "./WalletConnector";

interface Notebook {
  id: number;
  name: string;
}

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const { theme } = useTheme();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebook, setActiveNotebook] = useState<number | null>(null);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");
  const [notebookDropdownOpen, setNotebookDropdownOpen] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    id: number | null;
  }>({
    open: false,
    id: null,
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Theme-aware colors
  const isDark = theme === 'dark';
  const bgSidebar = isDark ? 'bg-black' : 'bg-[#f6f8fc]';
  const borderColor = isDark ? 'border-gray-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-gray-300' : 'text-[#3c4043]';
  const textActive = isDark ? 'text-white' : 'text-[#d93025]';
  const bgHover = isDark ? 'hover:bg-gray-900' : 'hover:bg-[#fce8e6]';
  const bgActive = isDark ? 'bg-gray-800' : 'bg-[#fce8e6]';
  const bgDropdown = isDark ? 'bg-gray-900' : 'bg-white';
  const borderDropdown = isDark ? 'border-gray-700' : 'border-gray-200';
  const composeBtn = isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-white text-[#3c4043] hover:bg-gray-100';
  const inputBg = isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300';
  const focusRing = isDark ? 'focus:ring-gray-500' : 'focus:ring-[#d93025]';

  useEffect(() => {
    const handler = () => setShowNotebookModal(true);
    document.addEventListener("openCreateNotebookModal", handler);
    return () => document.removeEventListener("openCreateNotebookModal", handler);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCreateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  useEffect(() => {
    const handleNotebookCreated = (e: any) => {
      const newNotebook = e.detail;
      setNotebooks((prev) => [...prev, newNotebook]);
    };

    document.addEventListener("notebookCreated", handleNotebookCreated);
    return () => document.removeEventListener("notebookCreated", handleNotebookCreated);
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

  const openTrash = () => {
    document.dispatchEvent(
      new CustomEvent("filterNotebook", { detail: { notebookId: "trash" } })
    );
  };

  const handleUpdateClick = (notebook: Notebook) => {
    setEditingId(notebook.id);
    setTempName(notebook.name);
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
        body: JSON.stringify({ name: tempName }),
      });

      if (res.ok) {
        const updated = await res.json();
        setNotebooks((prev) => prev.map((nb) => (nb.id === id ? updated : nb)));
        setEditingId(null);
        setTempName("");
      }
    } catch (error) {
      console.error("Failed to update notebook:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;

    try {
      await fetch(`${API_BASE}/api/notebooks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotebooks((prev) => prev.filter((nb) => nb.id !== id));
      if (activeNotebook === id) selectNotebook(null);
    } catch (error) {
      console.error("Failed to delete notebook:", error);
    }
  };

  const navItems = [
    {
      icon: DocumentTextIcon,
      label: "All Notes",
      action: () => selectNotebook(null),
      count: null,
    },
    {
      icon: TrashIcon,
      label: "Trash",
      action: openTrash,
      count: null,
    },
  ];

  return (
    <aside 
      className={`flex flex-col w-64 ${bgSidebar} border-r ${borderColor} select-none transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
      }`}
      style={{ height: '100%' }}
    >
      {/* Compose Button */}
      <div className="p-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
            className={`flex items-center gap-4 px-6 py-3 ${composeBtn} shadow-md rounded-full font-medium text-[14px] transition-all w-full justify-center`}
          >
            <PencilIcon className="w-5 h-5" />
            <span>Compose</span>
          </button>

          {createDropdownOpen && (
            <div className={`absolute left-0 mt-2 w-full ${bgDropdown} border ${borderDropdown} rounded-lg shadow-xl z-50`}>
              <button
                className={`w-full text-left px-4 py-3 text-[14px] ${textPrimary} ${bgHover} transition`}
                onClick={() => {
                  setCreateDropdownOpen(false);
                  handleCreateNoteClick();
                }}
              >
                Create Note
              </button>
              <button
                className={`w-full text-left px-4 py-3 text-[14px] ${textPrimary} ${bgHover} transition`}
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, action, count }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className={`group flex w-full items-center gap-4 px-6 py-2 rounded-r-full text-[14px] ${textPrimary} ${bgHover} transition-colors`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
            {count && (
              <span className={`ml-auto ${textPrimary} text-[12px]`}>{count}</span>
            )}
          </button>
        ))}

        {/* Notebooks Section */}
        {notebooks.length > 0 && (
          <div className="mt-4 pt-4">
            <button
              onClick={() => selectNotebook(null)}
              className={`flex w-full items-center gap-4 px-6 py-2 rounded-r-full text-[14px] transition-colors ${
                activeNotebook === null
                  ? `${bgActive} ${textActive} font-bold`
                  : `${textPrimary} ${bgHover}`
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="font-medium">All Notebooks</span>
            </button>

            {notebooks.map((nb) => (
              <div key={nb.id} className="relative">
                <button
                  onClick={() => selectNotebook(nb.id)}
                  className={`flex w-full items-center gap-4 px-6 py-2 rounded-r-full text-[14px] transition-colors ${
                    activeNotebook === nb.id
                      ? `${bgActive} ${textActive} font-bold`
                      : `${textPrimary} ${bgHover}`
                  }`}
                >
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
                      className={`flex-1 px-2 py-1 text-sm rounded border ${inputBg} focus:outline-none focus:ring-2 ${focusRing}`}
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className="truncate flex-1 text-left">{nb.name}</span>
                      <EllipsisVerticalIcon
                        className="w-5 h-5 cursor-pointer opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotebookDropdownOpen(nb.id === notebookDropdownOpen ? null : nb.id);
                        }}
                      />
                    </>
                  )}
                </button>

                {notebookDropdownOpen === nb.id && (
                  <div className={`absolute right-4 mt-1 w-32 ${bgDropdown} border ${borderDropdown} rounded-lg shadow-xl z-50`}>
                    <button
                      className={`block w-full text-left px-4 py-2 text-[14px] ${bgHover} ${isDark ? 'text-red-400' : 'text-red-600'}`}
                      onClick={() => setConfirmDelete({ open: true, id: nb.id })}
                    >
                      Delete
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-[14px] ${textPrimary} ${bgHover}`}
                      onClick={() => handleUpdateClick(nb)}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Settings */}
      <div className={`mt-auto p-4 border-t ${borderColor} space-y-3`}>
        <WalletConnector />
        <button
          onClick={openSettings}
          className={`flex items-center gap-4 w-full px-6 py-2 rounded-r-full text-[14px] ${textPrimary} ${bgHover} transition-colors`}
        >
          <Cog6ToothIcon className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>

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