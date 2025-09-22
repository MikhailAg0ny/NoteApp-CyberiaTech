'use client';

import { PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => void;
}

export default function CreateNoteModal({ isOpen, onClose, onSave }: CreateNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  // Calculate word and character count when content changes
  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharacterCount(content.length);
  }, [content]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (title.trim()) {
      onSave(title, content);
      setTitle('');
      setContent('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--github-bg)]/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm anim-fade-in transition-colors">
      <div
        className="w-full max-w-2xl card rounded-lg shadow-2xl transform transition-all anim-scale-in"
        style={{
          backgroundImage: "linear-gradient(rgba(99, 110, 123, 0.05) 1px, transparent 1px)",
          backgroundSize: "100% 28px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
        }}
      >
        <div className="p-5 border-b border-default rounded-t-lg transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-primary">Create New Note</h3>
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-[var(--github-border)]/40"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5">
          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-medium mb-4 bg-transparent outline-none border-b border-default focus:border-[var(--github-accent)] pb-2 text-primary placeholder:text-secondary transition-colors"
            autoFocus
          />

          <textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[250px] text-primary bg-transparent resize-none outline-none border-none focus:ring-0 leading-relaxed placeholder:text-secondary"
            style={{
              backgroundImage: "linear-gradient(rgba(99, 110, 123, 0.1) 1px, transparent 1px)",
              backgroundSize: "100% 28px",
              lineHeight: "28px"
            }}
          />
          
          {/* Word count */}
          <div className="mt-2 text-sm text-secondary flex justify-between items-center">
            <div>
              <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
              <span className="mx-2">•</span>
              <span>{characterCount} {characterCount === 1 ? 'character' : 'characters'}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-surface border-t border-default rounded-b-lg flex justify-between items-center transition-colors">
          <div className="text-xs text-secondary">
            <span>Press Ctrl+Enter to save</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 text-sm font-medium btn-primary border border-transparent rounded-md transition-colors"
            >
              <PencilSquareIcon className="w-4 h-4 mr-2" />
              Save Note
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium btn-muted rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}