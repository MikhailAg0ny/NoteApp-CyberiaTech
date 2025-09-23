"use client";

import { DocumentTextIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from "react";
import CreateNoteModal from './components/CreateNoteModal';
import SettingsModal from './components/SettingsModal';
import NoteModal from './components/NoteModal';

type Note = {
  id: number;
  title: string;
  content: string;
  notebook_id?: number | null;
  notebook_name?: string | null;
  tags?: { id?: number; name: string }[];
  category?: string;
  date?: string;
  time?: string;
};

export default function Page() {
  // Starting with an empty notes array
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<{id:number; name:string}[]>([]);
  const [tags, setTags] = useState<{id:number; name:string}[]>([]);
  const [activeNotebook, setActiveNotebook] = useState<number | null>(null);
  const [selected, setSelected] = useState<Note | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeFilter, setActiveFilter] = useState("Today");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null; // retained for display if needed (not sent as param)
  
  const filters = ["Today", "This Week", "This Month"];

  // Fetch all notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const res = await fetch(`${API_BASE}/api/notes`, { headers: { 'Authorization': `Bearer ${token}` }});
  if (res.status === 401) { window.location.href = '/login'; return; }
  if (!res.ok) throw new Error(`Failed to load notes (${res.status})`);
      const data = await res.json();
      const mapped: Note[] = data.map((n: any) => ({
        id: n.id,
        title: n.title || '',
        content: n.content || '',
        notebook_id: n.notebook_id ?? null,
        notebook_name: n.notebook_name ?? null,
        tags: n.tags || [],
        category: 'Notes',
        date: 'Today',
        time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : undefined
      }));
      setNotes(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotebooks = async () => {
    try {
      if (!token) return; 
      const res = await fetch(`${API_BASE}/api/notebooks`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (res.status === 401) { window.location.href='/login'; return; }
      if (!res.ok) return;
      const data = await res.json();
      setNotebooks(data);
    } catch {}
  };

  const fetchTags = async () => {
    try {
      if (!token) return; 
      const res = await fetch(`${API_BASE}/api/tags`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (res.status === 401) { window.location.href='/login'; return; }
      if (!res.ok) return;
      const data = await res.json();
      setTags(data);
    } catch {}
  };

  useEffect(() => {
    fetchNotes();
    fetchNotebooks();
    fetchTags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create note (calls backend)
  const addNote = async (newTitle: string, newContent: string, notebookId: number | null, tagNames: string[]) => {
    if (!newTitle.trim()) return;
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, content: newContent, notebook_id: notebookId, tags: tagNames })
      });
      if (res.status === 401) { window.location.href='/login'; return; }
      if (!res.ok) throw new Error('Create failed');
      const created = await res.json();
      const note: Note = {
        id: created.id,
        title: created.title,
        content: created.content,
        notebook_id: created.notebook_id ?? null,
        notebook_name: created.notebook_name ?? null,
        tags: created.tags || [],
        category: 'Notes',
        date: 'Today',
        time: created.created_at ? new Date(created.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : undefined
      };
      setNotes(prev => [note, ...prev]);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2600);
      // Open the newly created note in modal for viewing/editing
      setSelected(note);
      setIsNoteModalOpen(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Update note
  const saveNoteChanges = async (noteId: number, payload: { title: string; content: string; notebook_id: number | null; tags: string[] }) => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: payload.title, content: payload.content, notebook_id: payload.notebook_id, tags: payload.tags })
      });
      if (res.status === 401) { window.location.href='/login'; return; }
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title: updated.title, content: updated.content, notebook_id: updated.notebook_id ?? null, notebook_name: updated.notebook_name ?? null, tags: updated.tags || [] } : n));
      setSelected(prev => prev && prev.id === noteId ? { ...prev, title: updated.title, content: updated.content, notebook_id: updated.notebook_id ?? null, notebook_name: updated.notebook_name ?? null, tags: updated.tags || [] } : prev);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Delete note
  const deleteNote = async (id: number) => {
    try {
      setError(null);
  const res = await fetch(`${API_BASE}/api/notes/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
  if (res.status === 401) { window.location.href='/login'; return; }
  if (!res.ok) throw new Error('Delete failed');
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selected?.id === id) {
        setSelected(null);
        setIsNoteModalOpen(false);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Select note
  const selectNote = (note: Note) => {
    setSelected(note);
    setIsNoteModalOpen(true);
  };

  // Listen for the custom event from the sidebar
  useEffect(() => {
    const handleOpenCreateModal = () => {
      setIsCreateModalOpen(true);
    };
    
  const handleOpenSettings = () => setIsSettingsOpen(true);
  document.addEventListener('openCreateNoteModal', handleOpenCreateModal);
  document.addEventListener('openSettingsModal', handleOpenSettings);
    const handleFilterNotebook = (e: any) => {
      setActiveNotebook(e.detail?.notebookId ?? null);
    };
    document.addEventListener('filterNotebook', handleFilterNotebook);
    
    return () => {
      document.removeEventListener('openCreateNoteModal', handleOpenCreateModal);
      document.removeEventListener('openSettingsModal', handleOpenSettings);
      document.removeEventListener('filterNotebook', handleFilterNotebook);
    };
  }, []);

  return (
  <div className="flex flex-col h-full bg-app p-8 transition-colors">
      {/* Create Note Modal */}
      <CreateNoteModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={addNote}
        notebooks={notebooks}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      
      {/* Header with title */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-primary tracking-tight">My Notes</h1>
          {loading && <span className="text-xs text-secondary">Loading...</span>}
          {error && <span className="text-xs text-[var(--github-danger)]">{error}</span>}
        </div>
        
        {/* Filters + Logout */}
  <div className="flex items-center bg-surface border border-default rounded-full p-1">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium ${
                activeFilter === filter
                  ? "bg-[var(--github-accent)] text-white"
                  : "text-secondary hover:text-primary"
              }`}
            >
              {filter}
            </button>
          ))}
          <button
            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user_id'); window.location.href='/login'; }}
            className="ml-2 px-4 py-1.5 rounded-full text-sm font-medium text-secondary hover:text-[var(--github-danger)]"
          >Logout</button>
        </div>
      </div>

      {/* Notes Grid (always visible now) */}
      <>
          {/* Notes Grid */}
          {notes.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-5 text-primary tracking-tight">All Notes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {notes.filter(n => !activeNotebook || n.notebook_id === activeNotebook).map((note, idx) => (
                  <div
                    key={note.id}
                    className="card rounded-lg p-5 shadow-sm cursor-default transition group anim-slide-up card-hover"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <h3 className="font-medium text-lg mb-2 truncate text-primary group-hover:text-primary transition-colors">{note.title}</h3>
                    <p className="text-secondary line-clamp-3 mb-4 text-sm leading-relaxed">
                      {note.content || "No content"}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.notebook_name && (
                        <span className="text-[10px] px-2 py-1 rounded bg-[var(--github-accent)]/15 text-[var(--github-accent)]">{note.notebook_name}</span>
                      )}
                      {note.tags?.slice(0,4).map(t => (
                        <span key={t.name} className="text-[10px] px-2 py-1 rounded bg-surface border border-default text-secondary">{t.name}</span>
                      ))}
                      {note.tags && note.tags.length > 4 && (
                        <span className="text-[10px] px-2 py-1 rounded bg-surface border border-default text-secondary">+{note.tags.length - 4}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-auto">
                      <div className="text-xs font-medium text-secondary">
                        {note.time && <span className="text-xs text-secondary">{note.time}</span>}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => selectNote(note)}
                          className="text-xs text-secondary hover:text-[var(--github-accent)] flex items-center opacity-70 hover:opacity-100 transition-colors"
                          title="Edit note"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-xs text-secondary hover:text-[var(--github-danger)] flex items-center opacity-70 hover:opacity-100 transition-colors"
                          title="Delete note"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 bg-surface border border-default rounded-full flex items-center justify-center mb-6 text-secondary">
                <DocumentTextIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-semibold text-primary mb-3 tracking-tight">No notes yet</h3>
              <p className="text-secondary mb-8 text-center max-w-sm">Create your first note to get started with CyberiaTech</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 btn-primary font-medium rounded-md transition"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Note</span>
              </button>
            </div>
          )}
          
          {/* Create Note Button */}
          {notes.length > 0 && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="fixed bottom-8 right-8 w-14 h-14 rounded-full btn-primary text-white flex items-center justify-center shadow-lg transition pulse-button"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          )}
        </>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-28 right-8 card px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 anim-toast-in">
          <div className="w-2 h-2 rounded-full bg-[var(--github-accent)] animate-pulse" />
          <span className="text-sm text-primary">Note created</span>
        </div>
      )}

      <NoteModal
        open={isNoteModalOpen && !!selected}
        note={selected}
        notebooks={notebooks}
        onClose={() => { setIsNoteModalOpen(false); setSelected(null); }}
        onSave={saveNoteChanges}
        onDelete={deleteNote}
      />
    </div>
  );
}

