"use client";

import {
    Cog6ToothIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

export default function Sidebar() {
  const handleCreateNoteClick = () => {
    const event = new CustomEvent('openCreateNoteModal');
    document.dispatchEvent(event);
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-[#161b22] border-r border-[#30363d] shadow-sm">
      {/* Logo container with more padding and no border */}
      <div className="py-6 px-4 flex items-center justify-center">
        <div className="h-10 relative">
          <Image
            src="/logo.svg" 
            alt="CyberiaTech Logo" 
            width={100}
            height={40}
            className="object-contain"
            priority
          />
        </div>
      </div>
      
      {/* Navigation with increased top margin */}
      <nav className="flex-1 p-2 space-y-1 mt-2">
        <div className="px-3 py-2">
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 bg-[#21262d] text-[#c9d1d9] rounded-md hover:bg-[#30363d] transition"
            onClick={handleCreateNoteClick}
          >
            <PlusIcon className="w-4 h-4" />
            <span className="font-medium">Create Note</span>
          </button>
        </div>

        <a
          className="flex items-center px-3 py-2 rounded hover:bg-[#21262d]"
          href="#"
        >
          <MagnifyingGlassIcon className="w-5 h-5 mr-2.5" />
          <span>Search</span>
        </a>
        <a
          className="flex items-center px-3 py-2 rounded hover:bg-[#21262d]"
          href="#"
        >
          <DocumentTextIcon className="w-5 h-5 mr-2.5" />
          <span>All Notes</span>
        </a>
        <a
          className="flex items-center px-3 py-2 rounded hover:bg-[#21262d]"
          href="#"
        >
          <TrashIcon className="w-5 h-5 mr-2.5" />
          <span>Trash</span>
        </a>
      </nav>

      <div className="p-4 border-t border-[#30363d]">
        <button className="flex items-center gap-2.5 text-sm text-[#8b949e] hover:text-[#c9d1d9]">
          <Cog6ToothIcon className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}