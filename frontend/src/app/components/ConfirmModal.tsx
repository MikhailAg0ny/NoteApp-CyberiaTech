import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "info";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  message,
  title,
  confirmLabel,
  cancelLabel,
  tone = "danger",
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = tone === "danger";
  const confirmText = confirmLabel || (isDanger ? "Delete" : "Confirm");
  const cancelText = cancelLabel || "Cancel";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Confirmation dialog"}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.24s_ease]"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--github-bg-secondary)] to-[var(--github-bg)] shadow-2xl shadow-black/30 anim-scale-in">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--github-accent)] via-rose-500 to-[var(--github-accent)] opacity-70" />
        <div className="p-6 flex items-start gap-4">
          <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${isDanger ? "border-[var(--github-danger)]/40 bg-[var(--github-danger)]/10 text-[var(--github-danger)]" : "border-[var(--github-accent)]/40 bg-[var(--github-accent)]/10 text-[var(--github-accent)]"}`}>
            <ExclamationTriangleIcon className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-semibold text-primary">
                {title || (isDanger ? "Permanently delete?" : "Please confirm")}
              </p>
              <p className="mt-1 text-sm leading-6 text-secondary">
                {message}
              </p>
              {isDanger && (
                <p className="mt-2 text-[11px] uppercase tracking-wide text-[var(--github-danger)]/85 font-semibold">
                  This action cannot be undone.
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-default bg-[var(--github-bg-secondary)]/70 text-secondary hover:text-primary hover:border-[var(--github-accent)]/50 hover:shadow transition-smooth"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-semibold rounded-xl shadow transition-smooth ${isDanger ? "bg-[var(--github-danger)] text-white hover:bg-[var(--github-danger)]/90" : "bg-[var(--github-accent)] text-white hover:bg-[var(--github-accent)]/90"}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ConfirmModal;
