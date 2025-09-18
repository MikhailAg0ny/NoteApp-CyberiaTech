"use client";

import {
  DocumentTextIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from "react";
import CreateNoteModal from './components/CreateNoteModal';

type Note = {
  id: number;
  title: string;
  content: string;
  category?: string;
  date?: string;
  time?: string;
};

export default function Page() {
  // Starting with an empty notes array
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeFilter, setActiveFilter] = useState("Today");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const filters = ["Today", "This Week", "This Month"];

  // Add note
  const addNote = (newTitle: string, newContent: string) => {
    if (!newTitle.trim()) return;
    const newNote: Note = {
      id: Date.now(),
      title: newTitle,
      content: newContent,
      category: "Notes",
      date: "Today",
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    setNotes([newNote, ...notes]);
  };

  // Update note
  const updateNote = () => {
    if (!selected) return;
    setNotes(
      notes.map((n) => (n.id === selected.id ? { ...n, title, content } : n))
    );
    setSelected(null);
    setTitle("");
    setContent("");
  };

  // Delete note
  const deleteNote = (id: number) => {
    setNotes(notes.filter((n) => n.id !== id));
    if (selected?.id === id) {
      setSelected(null);
      setTitle("");
      setContent("");
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
    
    document.addEventListener('openCreateNoteModal', handleOpenCreateModal);
    
    return () => {
      document.removeEventListener('openCreateNoteModal', handleOpenCreateModal);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] p-8">
      {/* Create Note Modal */}
      <CreateNoteModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={addNote}
      />
      
      {/* Header with title */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[#c9d1d9] tracking-tight">My Notes</h1>
        </div>
        
        {/* Filters */}
        <div className="flex items-center bg-[#161b22] rounded-full p-1">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium ${
                activeFilter === filter
                  ? "bg-[#21262d] text-[#c9d1d9]"
                  : "text-[#8b949e] hover:text-[#c9d1d9]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {selected ? (
        /* Note Editor */
        <div className="bg-[#161b22] rounded-xl p-6 shadow-md border border-[#30363d]">
          <input
            type="text"
            placeholder="Title"
            className="w-full text-2xl font-semibold mb-4 bg-transparent outline-none border-b border-[#30363d] focus:border-[#388bfd] pb-3 text-[#c9d1d9] tracking-tight"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Start writing your note..."
            className="w-full min-h-[300px] text-[#8b949e] bg-transparent resize-none outline-none focus:ring-0 focus:border-0 leading-relaxed"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="mt-5 flex gap-3">
            <button
              onClick={updateNote}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1f6feb] text-white font-medium rounded-md hover:bg-[#388bfd] transition"
            >
              <PencilSquareIcon className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={() => {
                setSelected(null);
                setTitle("");
                setContent("");
              }}
              className="px-5 py-2.5 bg-[#21262d] text-[#8b949e] rounded-md hover:bg-[#30363d] hover:text-[#c9d1d9] transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Notes Grid */}
          {notes.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-5 text-[#c9d1d9] tracking-tight">All Notes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-[#161b22] rounded-lg p-5 shadow-sm hover:shadow-md cursor-default transition border border-[#30363d] group"
                  >
                    <h3 className="font-medium text-lg mb-2 truncate text-[#c9d1d9] group-hover:text-white transition-colors">{note.title}</h3>
                    <p className="text-[#8b949e] line-clamp-3 mb-4 text-sm leading-relaxed">
                      {note.content || "No content"}
                    </p>
                    <div className="flex justify-between items-center mt-auto">
                      <div className="text-xs font-medium text-[#8b949e]">
                        {note.time && (
                          <span className="text-xs text-[#8b949e]">{note.time}</span>
                        )}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => selectNote(note)}
                          className="text-xs text-[#8b949e] hover:text-[#388bfd] flex items-center opacity-70 hover:opacity-100 transition-opacity"
                          title="Edit note"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-xs text-[#8b949e] hover:text-[#f85149] flex items-center opacity-70 hover:opacity-100 transition-opacity"
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
              <div className="w-20 h-20 bg-[#21262d] rounded-full flex items-center justify-center mb-6 text-[#8b949e]">
                <DocumentTextIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-semibold text-[#c9d1d9] mb-3 tracking-tight">No notes yet</h3>
              <p className="text-[#8b949e] mb-8 text-center max-w-sm">Create your first note to get started with CyberiaTech</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1f6feb] text-white font-medium rounded-md hover:bg-[#388bfd] transition"
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
              className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#1f6feb] text-white flex items-center justify-center shadow-lg hover:bg-[#388bfd] transition"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          )}
        </>
      )}
    </div>
  );
}