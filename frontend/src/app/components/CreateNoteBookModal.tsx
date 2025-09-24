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
    <div className="colors fixed inset-0 bg-[var(--github-bg)]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="w-fit max-w-2xl card rounded-lg shadow-2xl transform transition-all anim-scale-in"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99, 110, 123, 0.05) 1px, transparent 1px)",
          backgroundSize: "100% 28px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div className="w-full max-w-md bg-[var(--github-bg)] rounded-lg shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-primary">
              Create Notebook
            </h3>
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary p-1 rounded-md hover:bg-[var(--github-border)]/40"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Notebook Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-default rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-[var(--github-accent)]"
            autoFocus
          />
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 btn-primary rounded-md"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 btn-muted rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
