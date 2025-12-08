"use client";
import { useEffect, useState } from 'react';
import { XMarkIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

export interface NoteRecord {
  id: number;
  title: string;
  content: string;
  notebook_id?: number | null;
  notebook_name?: string | null;
  tags?: { id?: number; name: string }[];
  createdAt?: string | null;
  created_at?: string;
  updatedAt?: string | null;
  updated_at?: string;
   tx_hash?: string | null;
   tx_status?: string | null;
   cardano_address?: string | null;
}

interface NoteModalProps {
  open: boolean;
  note: NoteRecord | null;
  notebooks: { id: number; name: string }[];
  onClose: () => void;
  onSave: (noteId: number, payload: { title: string; content: string; notebook_id: number | null; tags: string[]; sendMetadata: boolean }) => Promise<void> | void;
  onDelete: (noteId: number) => Promise<void> | void;
}

export default function NoteModal({ open, note, notebooks, onClose, onSave, onDelete }: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notebookId, setNotebookId] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [dirty, setDirty] = useState(false);
  const [sendMetadata, setSendMetadata] = useState(false);

  useEffect(() => {
    if (open && note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setNotebookId(note.notebook_id ?? null);
      setTags((note.tags || []).map(t => t.name));
      setTagInput('');
      setDirty(false);
      setSendMetadata(false);
    }
  }, [open, note]);

  if (!open || !note) return null;

  const createdDisplay = (() => {
    const source = note.createdAt ?? note.created_at ?? null;
    if (!source) return null;
    const parsed = new Date(source);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  })();

  const statusBadge = (() => {
    const status = note.tx_status;
    if (!status) return null;
    const normalized = status.toLowerCase();
    if (normalized === 'confirmed') {
      return {
        label: 'Confirmed',
        className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40',
      };
    }
    if (normalized === 'pending') {
      return {
        label: 'Pending',
        className: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
      };
    }
    return {
      label: status,
      className: 'bg-surface border border-default text-secondary',
    };
  })();

  const close = () => {
    if (dirty && !confirm('Discard unsaved changes?')) return;
    onClose();
  };

  const commitSave = () => {
    if (!title.trim()) return;
    onSave(note.id, { title, content, notebook_id: notebookId, tags, sendMetadata });
    setDirty(false);
  };

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(prev => prev.slice(0, -1));
      setDirty(true);
    }
  };

  const addTag = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (!tags.includes(v) && tags.length < 50) {
      setTags(prev => [...prev, v]);
      setDirty(true);
    }
    setTagInput('');
  };

  const removeTag = (t: string) => {
    setTags(prev => prev.filter(x => x !== t));
    setDirty(true);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-[var(--github-bg)]/95 backdrop-blur-md overflow-y-auto p-4 anim-fade-in"
      onClick={close}
    >
      <div 
        className="w-full max-w-3xl card rounded-2xl shadow-2xl anim-scale-in gpu-accelerate"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 20px 60px -15px rgba(0,0,0,0.6)"
        }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-default/60">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--github-accent)] to-[var(--github-accent-hover)] flex items-center justify-center shadow-lg flex-shrink-0">
              <PencilSquareIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-xl font-bold text-primary truncate">{note.title || 'Untitled Note'}</h2>
              {createdDisplay && (
                <p className="text-xs text-secondary mt-1">Created {createdDisplay}</p>
              )}
              {(statusBadge || note.tx_hash) && (
                <div className="flex items-center gap-2 mt-1">
                  {statusBadge && (
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  )}
                  {note.tx_hash && (
                    <span className="text-[10px] font-mono text-secondary truncate max-w-xs" title={note.tx_hash || undefined}>
                      Tx: {note.tx_hash.slice(0, 10)}…
                    </span>
                  )}
                </div>
              )}
            </div>
            {dirty && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--github-accent)]/15 text-[var(--github-accent)] font-medium flex-shrink-0">Unsaved</span>
            )}
          </div>
          <button onClick={close} className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-[var(--github-border)]/40 transition-smooth active:scale-95 ml-3">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setDirty(true); }}
              placeholder="Untitled Note"
              className="w-full text-3xl font-bold bg-transparent outline-none border-b-2 border-default focus:border-[var(--github-accent)] pb-3 transition-smooth text-primary placeholder:text-secondary/60"
            />
          </div>
          <div className="relative">
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); setDirty(true); }}
              placeholder="Start writing your thoughts..."
              className="w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed text-base text-primary placeholder:text-secondary/60"
              style={{
                backgroundImage: 'linear-gradient(rgba(99,110,123,0.08) 1px, transparent 1px)',
                backgroundSize: '100% 28px',
                lineHeight: '28px'
              }}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold tracking-wider text-secondary mb-2 uppercase">Notebook</label>
              <select
                value={notebookId ?? ''}
                onChange={e => { setNotebookId(e.target.value ? parseInt(e.target.value, 10) : null); setDirty(true); }}
                className="w-full bg-surface border-2 border-default rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--github-accent)] focus:ring-2 focus:ring-[var(--github-accent)]/20 transition-smooth cursor-pointer"
              >
                <option value="">📋 No notebook</option>
                {notebooks.map(nb => <option key={nb.id} value={nb.id}>📔 {nb.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-wider text-secondary mb-2 uppercase">Tags</label>
              <div className="min-h-[48px] p-3 bg-surface border-2 border-default rounded-lg focus-within:border-[var(--github-accent)] focus-within:ring-2 focus-within:ring-[var(--github-accent)]/20 transition-smooth">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[var(--github-accent)]/15 to-[var(--github-accent)]/10 text-[var(--github-accent)] text-[10px] font-medium flex items-center gap-1.5 border border-[var(--github-accent)]/20 hover:border-[var(--github-accent)]/40 transition-smooth">
                      <span>🏷️ {t}</span>
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-[var(--github-danger)] transition-colors">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  onBlur={() => addTag(tagInput)}
                  placeholder={tags.length ? 'Add another...' : 'Add tags'}
                  className="w-full bg-transparent outline-none text-xs text-primary placeholder:text-secondary/60"
                />
              </div>
            </div>
          </div>
          <div className="pt-4 flex flex-wrap gap-4 justify-between items-center border-t border-default/50">
            <div className="flex items-center gap-2">
              {dirty ? (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[var(--github-accent)] animate-pulse"></div>
                  <span className="text-[var(--github-accent)] font-medium">Unsaved changes</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">All changes saved</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 items-center flex-wrap justify-end">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-default bg-[var(--github-bg-secondary)]/50 text-xs text-secondary">
                <div className="w-8 h-8 rounded-full bg-[var(--github-accent)]/15 text-[var(--github-accent)] flex items-center justify-center text-sm font-bold">
                  ⓜ
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-primary text-[11px]">Cardano metadata</p>
                  <p className="text-[11px] text-secondary/80">Send this edit to chain when saving.</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-secondary cursor-pointer select-none ml-auto">
                  <input
                    type="checkbox"
                    checked={sendMetadata}
                    onChange={(e) => { setSendMetadata(e.target.checked); setDirty(true); }}
                    className="w-4 h-4 rounded border-default text-[var(--github-accent)] focus:ring-[var(--github-accent)]"
                  />
                  <span className="text-[11px]">Send on save</span>
                </label>
              </div>
              <button
                onClick={() => { if (confirm('Delete this note permanently?')) onDelete(note.id); }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 bg-[var(--github-danger)]/10 text-[var(--github-danger)] hover:bg-[var(--github-danger)]/20 transition-smooth active:scale-95"
              >
                <TrashIcon className="w-4 h-4" /> Delete
              </button>
              <button
                onClick={commitSave}
                disabled={!dirty || !title.trim()}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-smooth shadow-lg shadow-[var(--github-accent)]/25 hover:shadow-xl hover:shadow-[var(--github-accent)]/35 hover:scale-105 active:scale-95"
              >
                <PencilSquareIcon className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
