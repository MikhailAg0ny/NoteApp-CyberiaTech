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
  <div className="flex flex-col h-full bg-app p-4 md:p-8 transition-colors">
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-primary tracking-tight bg-gradient-to-r from-[var(--github-text-primary)] to-[var(--github-text-secondary)] bg-clip-text">My Notes</h1>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-secondary">
              <div className="w-3 h-3 border-2 border-[var(--github-accent)] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--github-danger)] bg-[var(--github-danger)]/10 px-2.5 py-1 rounded-full">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}
        </div>
        
        {/* Filters + Logout */}
  <div className="flex items-center bg-surface border border-default rounded-full p-1 shadow-sm transition-smooth">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 md:px-5 py-1.5 rounded-full text-sm font-medium transition-smooth ${
                activeFilter === filter
                  ? "bg-[var(--github-accent)] text-white shadow-lg shadow-[var(--github-accent)]/25"
                  : "text-secondary hover:text-primary hover:bg-[var(--github-border)]/30"
              }`}
            >
              {filter}
            </button>
          ))}
          <button
            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user_id'); window.location.href='/login'; }}
            className="ml-2 px-3 md:px-4 py-1.5 rounded-full text-sm font-medium text-secondary hover:text-[var(--github-danger)] hover:bg-[var(--github-danger)]/10 transition-smooth"
          >Logout</button>
        </div>
      </div>

      {/* Notes Grid (always visible now) */}
      <>
          {/* Notes Grid */}
          {loading && notes.length === 0 ? (
            <div className="mb-8">
              <div className="skeleton h-8 w-32 mb-5 rounded"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card rounded-lg p-5 shadow-sm">
                    <div className="skeleton h-6 w-3/4 mb-3 rounded"></div>
                    <div className="skeleton h-4 w-full mb-2 rounded"></div>
                    <div className="skeleton h-4 w-5/6 mb-2 rounded"></div>
                    <div className="skeleton h-4 w-4/6 mb-4 rounded"></div>
                    <div className="flex gap-2 mb-3">
                      <div className="skeleton h-5 w-16 rounded"></div>
                      <div className="skeleton h-5 w-16 rounded"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="skeleton h-4 w-12 rounded"></div>
                      <div className="flex gap-3">
                        <div className="skeleton h-4 w-4 rounded"></div>
                        <div className="skeleton h-4 w-4 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : notes.length > 0 ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-primary tracking-tight">All Notes</h2>
                <div className="text-sm text-secondary">{notes.filter(n => !activeNotebook || n.notebook_id === activeNotebook).length} notes</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {notes.filter(n => !activeNotebook || n.notebook_id === activeNotebook).map((note, idx) => (
                  <div
                    key={note.id}
                    className="card rounded-xl p-5 shadow-sm cursor-default group anim-slide-up card-hover gpu-accelerate relative overflow-hidden"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--github-accent)]/0 to-[var(--github-accent)]/0 group-hover:from-[var(--github-accent)]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded-xl"></div>
                    
                    <div className="relative z-10">
                      <h3 className="font-semibold text-lg mb-2 truncate text-primary group-hover:text-[var(--github-accent)] transition-colors">{note.title}</h3>
                      <p className="text-secondary line-clamp-3 mb-4 text-sm leading-relaxed">
                        {note.content || "No content"}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {note.notebook_name && (
                          <span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--github-accent)]/15 text-[var(--github-accent)] font-medium">{note.notebook_name}</span>
                        )}
                        {note.tags?.slice(0,4).map(t => (
                          <span key={t.name} className="text-[10px] px-2.5 py-1 rounded-full bg-surface border border-default text-secondary hover:border-[var(--github-accent)] transition-colors">{t.name}</span>
                        ))}
                        {note.tags && note.tags.length > 4 && (
                          <span className="text-[10px] px-2.5 py-1 rounded-full bg-surface border border-default text-secondary">+{note.tags.length - 4}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-default/50">
                        <div className="text-xs font-medium text-secondary flex items-center gap-1.5">
                          {note.time && (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{note.time}</span>
                            </>
                          )}
                        </div>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => selectNote(note)}
                            className="p-1.5 rounded-md text-secondary hover:text-[var(--github-accent)] hover:bg-[var(--github-accent)]/10 transition-smooth"
                            title="Edit note"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="p-1.5 rounded-md text-secondary hover:text-[var(--github-danger)] hover:bg-[var(--github-danger)]/10 transition-smooth"
                            title="Delete note"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center py-24 anim-fade-in">
              <div className="w-24 h-24 bg-gradient-to-br from-surface to-[var(--github-border)]/30 border-2 border-default rounded-2xl flex items-center justify-center mb-6 text-secondary shadow-lg">
                <DocumentTextIcon className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-bold text-primary mb-3 tracking-tight">No notes yet</h3>
              <p className="text-secondary mb-8 text-center max-w-md leading-relaxed">Start capturing your ideas and thoughts with CyberiaTech's modern note-taking experience</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3 btn-primary font-semibold rounded-lg transition-smooth shadow-lg shadow-[var(--github-accent)]/25 hover:shadow-xl hover:shadow-[var(--github-accent)]/35"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Your First Note</span>
              </button>
            </div>
          )}
          
          {/* Create Note Button */}
          {notes.length > 0 && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="fixed bottom-6 md:bottom-8 right-6 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full btn-primary text-white flex items-center justify-center shadow-2xl transition-smooth pulse-button hover:scale-110 active:scale-95 z-50"
              title="Create new note"
            >
              <PlusIcon className="w-6 h-6 md:w-7 md:h-7" />
            </button>
          )}
        </>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-24 md:bottom-28 right-6 md:right-8 card px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2.5 anim-toast-in border-l-4 border-[var(--github-accent)] backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-[var(--github-accent)] animate-pulse" />
          <span className="text-sm font-medium text-primary">Note created successfully</span>
          <svg className="w-4 h-4 text-[var(--github-accent)]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
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

