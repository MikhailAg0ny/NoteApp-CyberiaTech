"use client";

import { PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    title: string,
    content: string,
    notebookId: number | null,
    tags: string[],
    sendMetadata: boolean
  ) => void;
  notebooks: { id: number; name: string }[];
  defaultNotebookId?: number | null;
}

export default function CreateNoteModal({
  isOpen,
  onClose,
  onSave,
  notebooks,
  defaultNotebookId,
}: CreateNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [notebookId, setNotebookId] = useState<number | null>(
    defaultNotebookId ?? null
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [sendMetadata, setSendMetadata] = useState(false);

  // Word & character count
  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharacterCount(content.length);
  }, [content]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setContent("");
      setNotebookId(defaultNotebookId ?? null);
      setTags([]);
      setTagInput("");
      setSendMetadata(false);
    }
  }, [isOpen, defaultNotebookId]);

  if (!isOpen) return null;

  const addTag = (value: string) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    if (!tags.includes(cleaned) && tags.length < 50) {
      setTags((prev) => [...prev, cleaned]);
    }
  };

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const handleSave = () => {
    if (!title.trim()) return;

    onSave(title, content, notebookId, tags, sendMetadata);

    setTitle("");
    setContent("");
    setNotebookId(defaultNotebookId ?? null);
    setTags([]);
    setTagInput("");
    setSendMetadata(false);

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-[var(--github-bg)]/95 flex items-center justify-center z-50 p-4 backdrop-blur-md anim-fade-in transition-colors overflow-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl sm:max-w-2xl rounded-2xl shadow-2xl transform transition-all anim-scale-in gpu-accelerate flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage:
            "linear-gradient(rgba(99, 110, 123, 0.05) 1px, transparent 1px)",
          backgroundSize: "100% 28px",
          boxShadow: "0 20px 60px -15px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 sm:py-6 border-b border-default rounded-t-2xl bg-transparent flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--github-accent)] to-[var(--github-accent-hover)] flex items-center justify-center shadow-lg flex-shrink-0">
                <PencilSquareIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
                Create New Note
              </h3>
            </div>

            <button
              onClick={onClose}
              className="text-secondary hover:text-primary transition-smooth p-2 rounded-lg hover:bg-[var(--github-border)]/40 active:scale-95"
              aria-label="Close dialog"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div>
            <input
              type="text"
              placeholder="Untitled Note"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl sm:text-[1.35rem] font-bold mb-1 bg-transparent outline-none border-b-2 border-default focus:border-[var(--github-accent)] pb-3 text-primary placeholder:text-secondary/60 transition-smooth"
              autoFocus
            />
            <p className="text-xs text-secondary mt-2">
              Give your note a memorable title
            </p>
          </div>

          {/* Editor */}
          <div className="relative rounded-2xl bg-surface/40 border border-default/60 px-3 sm:px-4 py-3 shadow-inner">
            <textarea
              placeholder="Start writing your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[120px] sm:min-h-[220px] md:min-h-[280px] text-primary bg-transparent resize-none outline-none border-none leading-relaxed placeholder:text-secondary/60 text-base"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(99, 110, 123, 0.1) 1px, transparent 1px)",
                backgroundSize: "100% 28px",
                lineHeight: "28px",
              }}
            />

            {!content && (
              <div className="mt-3 p-3 bg-[var(--github-bg-secondary)]/35 border border-default/60 rounded-md text-sm text-secondary">
                <p className="font-semibold mb-1">✨ Tips</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>
                    Use <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to save quickly
                  </li>
                  <li>Add tags for better organization</li>
                </ul>
              </div>
            )}
          </div>

          {/* Notebook selector */}
          {notebooks.length > 0 && (
            <div>
              <label className="block text-xs font-bold tracking-wider text-secondary mb-2 uppercase">
                Notebook
              </label>
              <select
                value={notebookId ?? ""}
                onChange={(e) =>
                  setNotebookId(
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                className="w-full bg-surface border-2 border-default rounded-lg px-3 py-2 text-sm sm:px-4 sm:py-3 focus:outline-none focus:border-[var(--github-accent)] focus:ring-2 focus:ring-[var(--github-accent)]/20 transition-smooth cursor-pointer"
              >
                <option value="">📋 No notebook</option>
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id}>
                    📔 {nb.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Tags */}
            <div>
              <label className="block text-xs font-bold tracking-wider text-secondary mb-2 uppercase">
                Tags
              </label>

              <div className="min-h-[48px] p-2 sm:p-3 bg-surface border-2 border-default rounded-lg focus-within:border-[var(--github-accent)] focus-within:ring-2 focus-within:ring-[var(--github-accent)]/20 transition-smooth">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[var(--github-accent)]/15 to-[var(--github-accent)]/10 text-[var(--github-accent)] text-xs font-medium flex items-center gap-2 border border-[var(--github-accent)]/20 hover:border-[var(--github-accent)]/40 transition-smooth"
                    >
                      <span>🏷️ {t}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="hover:text-[var(--github-danger)] transition-colors"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>

                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  placeholder={
                    tags.length
                      ? "Add another tag..."
                      : "Add tags (press Enter or comma)"
                  }
                  className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-secondary/60"
                />
              </div>
            </div>

            {/* Word & character count */}
            <div className="p-3 sm:p-4 bg-surface/60 rounded-lg border border-default/60 shadow-inner flex flex-col gap-3">
              <span className="text-xs font-bold tracking-wider text-secondary uppercase">
                Live stats
              </span>

              <div className="flex items-center justify-between text-sm text-primary">
                <div className="flex items-center gap-2">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-lg font-semibold leading-tight">
                      {wordCount}
                    </p>
                    <p className="text-xs text-secondary">
                      {wordCount === 1 ? "word" : "words"}
                    </p>
                  </div>
                </div>

                <div className="w-px h-10 bg-default/70" />

                <div className="flex items-center gap-2">
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
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  <div>
                    <p className="text-lg font-semibold leading-tight">
                      {characterCount}
                    </p>
                    <p className="text-xs text-secondary">
                      {characterCount === 1 ? "character" : "characters"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 sm:px-6 sm:py-6 bg-surface/30 border-t border-default rounded-b-2xl flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <kbd className="px-2 py-1 bg-[var(--github-bg-secondary)] border border-default rounded text-[10px] font-mono">
              Ctrl
            </kbd>
            <span>+</span>
            <kbd className="px-2 py-1 bg-[var(--github-bg-secondary)] border border-default rounded text-[10px] font-mono">
              Enter
            </kbd>
            <span>to save</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-default bg-[var(--github-bg-secondary)]/50 text-xs text-secondary">
              <div className="w-8 h-8 rounded-full bg-[var(--github-accent)]/15 text-[var(--github-accent)] flex items-center justify-center text-sm font-bold">
                ⓜ
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-primary text-[11px]">Cardano metadata</p>
                <p className="text-[11px] text-secondary/80">Opt in to write this note to chain when saving.</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-secondary cursor-pointer select-none ml-auto">
                <input
                  type="checkbox"
                  checked={sendMetadata}
                  onChange={(e) => setSendMetadata(e.target.checked)}
                  className="w-4 h-4 rounded border-default text-[var(--github-accent)] focus:ring-[var(--github-accent)]"
                />
                <span className="text-[11px]">Send on create</span>
              </label>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium btn-muted rounded-lg transition-smooth"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold btn-primary rounded-lg transition-smooth shadow-lg shadow-[var(--github-accent)]/25 disabled:opacity-50"
            >
              <PencilSquareIcon className="w-4 h-4" />
              Create Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
