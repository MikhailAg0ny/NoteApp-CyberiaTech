"use client";
import { XMarkIcon } from "@heroicons/react/24/outline";
import React from "react";

type ErrorDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
};

export default function ErrorDialog({ open, title, message, onClose }: ErrorDialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-message"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--github-danger)]/40 bg-[var(--github-bg)] shadow-2xl anim-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-5 py-4 border-b border-[var(--github-danger)]/30 bg-[var(--github-danger)]/10">
          <div className="mt-1 text-[var(--github-danger)]">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.5a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0v-1.5zm0-6a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0V6.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="error-dialog-title" className="text-sm font-semibold text-[var(--github-danger)]">
              {title || "Something went wrong"}
            </h2>
            <p id="error-dialog-message" className="mt-1 text-sm text-secondary leading-relaxed break-words">
              {message || "An unexpected error occurred. Please try again."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-[var(--github-border)]/40 transition-smooth"
            aria-label="Close error dialog"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-end px-5 py-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--github-danger)] text-white shadow-md hover:shadow-lg transition-smooth"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
