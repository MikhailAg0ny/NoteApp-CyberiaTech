"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

interface CreateNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function CreateNoteBookModal({
  isOpen,
  onClose,
  onSave,
}: CreateNotebookModalProps) {
  const [name, setName] = useState("");

  // Reset input when modal opens
  useEffect(() => {
    if (isOpen) setName("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    onClose();
  };

  return (
    <div
      className="colors fixed inset-0 bg-[var(--github-bg)]/90 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-notebook-title"
    >
      <div
        className="w-fit max-w-2xl card rounded-2xl shadow-2xl transform transition-all anim-scale-in ring-1 ring-default/60"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage:
            "linear-gradient(rgba(99, 110, 123, 0.05) 1px, transparent 1px)",
          backgroundSize: "100% 28px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div className="w-full max-w-md bg-[var(--github-bg)] rounded-2xl shadow-sm p-5 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 id="create-notebook-title" className="text-xl sm:text-2xl font-semibold text-primary tracking-tight">
              Create Notebook
            </h3>
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary p-2 rounded-lg hover:bg-[var(--github-border)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--github-accent)]/50"
              aria-label="Close dialog"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <label className="block text-[11px] font-semibold tracking-wider text-secondary mb-2 uppercase" htmlFor="notebook-name-input">
            Notebook name
          </label>
          <input
            id="notebook-name-input"
            type="text"
            placeholder="Notebook Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-default rounded-lg text-primary bg-surface focus:outline-none focus:border-[var(--github-accent)] focus:ring-2 focus:ring-[var(--github-accent)]/20 placeholder:text-secondary/60"
            autoFocus
            aria-label="Notebook name"
          />

          <div className="mt-2 text-xs text-secondary">Give your notebook a clear, short name</div>

          <div className="mt-5 sm:mt-6 flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-secondary">
              <kbd className="px-2 py-1 bg-[var(--github-bg-secondary)] border border-default rounded text-[10px] font-mono">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-[var(--github-bg-secondary)] border border-default rounded text-[10px] font-mono">Enter</kbd>
              <span>to save</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 btn-muted rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--github-accent)]/40"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 btn-primary rounded-md shadow-md shadow-[var(--github-accent)]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--github-accent)]/50 disabled:opacity-50"
                disabled={!name.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
