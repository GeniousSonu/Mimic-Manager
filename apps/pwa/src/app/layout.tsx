import type { Metadata, Viewport } from 'next';
import './globals.css';
import Link from 'next/link';
import {
  LayoutDashboard,
  Globe,
  Image as ImageIcon,
  Sparkles,
  Zap,
  Search,
  Copy,
  FolderTree,
  ListTodo,
  Settings,
  ShieldCheck,
  Command
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'OptiForge Command Center',
  description: 'Headless site optimization, media compression, performance audits, and CMS command center.',
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  themeColor: '#10131A',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="flex h-screen overflow-hidden bg-[#0A0C10] text-[#E9ECF3]">
        {/* Left Navigation Rail (Desktop) */}
        <aside className="hidden lg:flex w-60 flex-col bg-[#10131A] border-r border-[#2A3040] select-none">
          {/* Brand Header */}
          <div className="h-14 flex items-center gap-3 px-5 border-b border-[#1F2430]">
            <svg
              className="w-6 h-6 stroke-[#7C6CFF]"
              viewBox="0 0 32 32"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 10 L16 3 L28 10 L28 22 L16 29 L4 22 Z" />
              <path d="M16 3 L16 29" />
              <path d="M4 10 L28 22" />
              <path d="M28 10 L4 22" />
            </svg>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-[#E9ECF3]">OptiForge</span>
              <span className="text-[10px] font-mono text-[#747E92]">Command Center</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs font-medium">
            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#A5AEC0] hover:text-[#E9ECF3] hover:bg-[#161A23] transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#7C6CFF]" />
              <span>Overview</span>
            </Link>
            <Link
              href="/sites"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#A5AEC0] hover:text-[#E9ECF3] hover:bg-[#161A23] transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Sites (Connected)</span>
            </Link>
            <div className="pt-2 pb-1 px-3 text-[10px] font-semibold tracking-wider text-[#747E92] uppercase">
              Core Engines
            </div>
            <Link
              href="/media"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#A5AEC0] hover:text-[#E9ECF3] hover:bg-[#161A23] transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-[#2FBF8F]" />
              <span>Media Optimizer</span>
            </Link>
            <Link
              href="/media/alt-text"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#A5AEC0] hover:text-[#E9ECF3] hover:bg-[#161A23] transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#F5A524]" />
              <span>Alt-Text Queue</span>
            </Link>
            <Link
              href="/speed"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#A5AEC0] hover:text-[#E9ECF3] hover:bg-[#161A23] transition-colors"
            >
              <Zap className="w-4 h-4 text-[#4DA3FF]" />
              <span>PageSpeed Engine</span>
            </Link>
            <Link
              href="/seo"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#A5AEC0] hover:text-[#E9ECF3] hover:bg-[#161A23] transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>SEO Gap Fill</span>
            </Link>
            <Link
              href="/replicator"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#A5AEC0] hover:text-[#E9ECF3] hover:bg-[#161A23] transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>UI Replicator</span>
            </Link>
            <Link
              href="/files"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#A5AEC0] hover:text-[#E9ECF3] hover:bg-[#161A23] transition-colors"
            >
              <FolderTree className="w-4 h-4" />
              <span>File Manager</span>
            </Link>
            <div className="pt-2 pb-1 px-3 text-[10px] font-semibold tracking-wider text-[#747E92] uppercase">
              Operations
            </div>
            <Link
              href="/jobs"
              className="flex items-center justify-between px-3 py-2 rounded-md text-[#A5AEC0] hover:text-[#E9ECF3] hover:bg-[#161A23] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ListTodo className="w-4 h-4" />
                <span>Job Queues</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#161A23] border border-[#2A3040] rounded text-[#2FBF8F]">
                Live
              </span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#A5AEC0] hover:text-[#E9ECF3] hover:bg-[#161A23] transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </nav>

          {/* Footer Status */}
          <div className="p-3 border-t border-[#1F2430] flex items-center justify-between text-xs text-[#747E92]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2FBF8F]" />
              <span>Hub Online</span>
            </div>
            <span className="font-mono text-[10px]">v0.1.0-alpha</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Bar */}
          <header className="h-14 bg-[#10131A] border-b border-[#2A3040] px-6 flex items-center justify-between select-none">
            {/* Site Scope Pill */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2FBF8F] animate-pulse" />
              <span className="text-xs font-semibold text-[#E9ECF3]">Production Store</span>
              <span className="text-[10px] font-mono text-[#A5AEC0] bg-[#161A23] px-2 py-0.5 rounded border border-[#2A3040]">
                https://store.local
              </span>
            </div>

            {/* Quick Actions & Command Palette Trigger */}
            <div className="flex items-center gap-3">
              <button
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#161A23] border border-[#2A3040] text-xs text-[#A5AEC0] hover:text-[#E9ECF3] hover:border-[#626D85] transition-colors"
                title="Global Command Palette (⌘K)"
              >
                <Command className="w-3.5 h-3.5 text-[#7C6CFF]" />
                <span>Search actions, sites, jobs...</span>
                <kbd className="font-mono text-[10px] bg-[#0A0C10] px-1.5 py-0.5 rounded border border-[#2A3040]">
                  ⌘K
                </kbd>
              </button>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 overflow-y-auto p-6 bg-[#0A0C10]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
