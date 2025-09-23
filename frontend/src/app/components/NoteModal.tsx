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
  created_at?: string;
  updated_at?: string;
}

interface NoteModalProps {
  open: boolean;
  note: NoteRecord | null;
  notebooks: { id: number; name: string }[];
  onClose: () => void;
  onSave: (noteId: number, payload: { title: string; content: string; notebook_id: number | null; tags: string[] }) => Promise<void> | void;
  onDelete: (noteId: number) => Promise<void> | void;
}

export default function NoteModal({ open, note, notebooks, onClose, onSave, onDelete }: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notebookId, setNotebookId] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (open && note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setNotebookId(note.notebook_id ?? null);
      setTags((note.tags || []).map(t => t.name));
      setTagInput('');
      setDirty(false);
    }
  }, [open, note]);

  if (!open || !note) return null;

  const close = () => {
    if (dirty && !confirm('Discard unsaved changes?')) return;
    onClose();
  };

  const commitSave = () => {
    if (!title.trim()) return;
    onSave(note.id, { title, content, notebook_id: notebookId, tags });
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
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-[var(--github-bg)]/90 backdrop-blur-sm overflow-y-auto p-4 animate-fade-in">
      <div className="w-full max-w-3xl card rounded-xl shadow-2xl anim-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-default/60">
          <h2 className="text-lg font-semibold text-primary truncate">{note.title || 'Untitled Note'}</h2>
          <button onClick={close} className="p-1 rounded-md text-secondary hover:text-primary hover:bg-[var(--github-border)]/40 transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setDirty(true); }}
              placeholder="Title"
              className="w-full text-2xl font-semibold bg-transparent outline-none border-b border-default focus:border-[var(--github-accent)] pb-2 transition-colors"
            />
          </div>
          <div>
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); setDirty(true); }}
              placeholder="Start writing..."
              className="w-full min-h-[260px] bg-transparent outline-none resize-none leading-relaxed"
              style={{
                backgroundImage: 'linear-gradient(rgba(99,110,123,0.08) 1px, transparent 1px)',
                backgroundSize: '100% 28px',
                lineHeight: '28px'
              }}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Notebook</label>
              <select
                value={notebookId ?? ''}
                onChange={e => { setNotebookId(e.target.value ? parseInt(e.target.value, 10) : null); setDirty(true); }}
                className="w-full bg-surface border border-default rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--github-accent)]/50"
              >
                <option value="">No notebook</option>
                {notebooks.map(nb => <option key={nb.id} value={nb.id}>{nb.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(t => (
                  <span key={t} className="px-2 py-1 rounded-md bg-[var(--github-accent)]/15 text-[var(--github-accent)] text-[10px] flex items-center gap-1">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-[var(--github-danger)]">×</button>
                  </span>
                ))}
              </div>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                onBlur={() => addTag(tagInput)}
                placeholder={tags.length ? '' : 'Add tags'}
                className="w-full bg-transparent outline-none border-b border-default focus:border-[var(--github-accent)] text-xs py-1"
              />
            </div>
          </div>
          <div className="pt-2 flex flex-wrap gap-3 justify-between">
            <div className="text-xs text-secondary">
              {dirty ? <span className="text-[var(--github-accent)]">Unsaved changes</span> : <span>Saved</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { if (confirm('Delete this note?')) onDelete(note.id); }}
                className="px-3 py-2 rounded-md text-xs font-medium flex items-center gap-1 bg-[var(--github-danger)]/10 text-[var(--github-danger)] hover:bg-[var(--github-danger)]/20"
              >
                <TrashIcon className="w-4 h-4" /> Delete
              </button>
              <button
                onClick={commitSave}
                disabled={!dirty || !title.trim()}
                className="px-4 py-2 rounded-md text-xs font-medium flex items-center gap-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PencilSquareIcon className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
