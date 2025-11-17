"use client";

import {
  DocumentTextIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from "react";
import CreateNoteModal from './CreateNoteModal';
import SettingsModal from './SettingsModal';

type Note = {
  id: number;
  title: string;
  content: string;
  category?: string;
  date?: string;
  time?: string;
  created_at?: string;
  updated_at?: string;
};

export default function Page() {
  // Starting with an empty notes array
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeFilter, setActiveFilter] = useState("Today");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const filters = ["Today", "This Week", "This Month"];

  const API_BASE = 'http://localhost:5000/api/notes';

  // Fetch notes from backend
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error('Failed to fetch notes');
        const data = await res.json();
        setNotes(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotes();
  }, []);

  // Add note (POST)
  const addNote = async (newTitle: string, newContent: string) => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent })
      });
      if (!res.ok) throw new Error('Failed to create note');
      const created = await res.json();
      setNotes(prev => [created, ...prev]);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2600);
    } catch (err) {
      console.error(err);
    }
  };

  // Update note (PUT)
  const updateNote = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`${API_BASE}/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      if (!res.ok) throw new Error('Failed to update note');
      const updated = await res.json();
      setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
      setSelected(null);
      setTitle("");
      setContent("");
    } catch (err) {
      console.error(err);
    }
  };

  // Delete note (DELETE)
  const deleteNote = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note');
      setNotes(prev => prev.filter((n) => n.id !== id));
      if (selected?.id === id) {
        setSelected(null);
        setTitle("");
        setContent("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Select note
  const selectNote = (note: Note) => {
    setSelected(note);
    setTitle(note.title);
    setContent(note.content);
  };

  // Listen for the custom event from the sidebar
  useEffect(() => {
    const handleOpenCreateModal = () => {
      setIsCreateModalOpen(true);
    };
    
  const handleOpenSettings = () => setIsSettingsOpen(true);
  document.addEventListener('openCreateNoteModal', handleOpenCreateModal);
  document.addEventListener('openSettingsModal', handleOpenSettings);
    
    return () => {
      document.removeEventListener('openCreateNoteModal', handleOpenCreateModal);
      document.removeEventListener('openSettingsModal', handleOpenSettings);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-app p-8 transition-colors">
      {/* Create Note Modal */}
      <CreateNoteModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={addNote}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      {/* rest of UI remains the same */}
      {/* ...existing JSX omitted here for brevity (keep the same markup) ... */}
    </div>
  );
}