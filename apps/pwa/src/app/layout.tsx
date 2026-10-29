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
import { AnimatedLogo } from '../components/AnimatedLogo';

export const metadata: Metadata = {
  title: 'Mimic Manager Command Center',
  description: 'Free and Secure platform for image optimization, PageSpeed and SEO fixes, UI section replication, and visual file management.',
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  themeColor: '#0A0805',
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
      <body className="flex h-screen overflow-hidden bg-[#0A0805] text-[#FFF8EE]">
        {/* Left Navigation Rail (Desktop) */}
        <aside className="hidden lg:flex w-64 flex-col bg-[#120E09] border-r border-[#261C12] select-none">
          {/* Brand Header */}
          <div className="h-16 flex items-center gap-3 px-5 border-b border-[#261C12]">
            <AnimatedLogo size={34} animated interactive withGlow />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[#FFF8EE]">Mimic Manager</span>
              <span className="text-[10px] font-mono text-[#D4C4B0]/70">Command Center</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs font-medium">
            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#D4C4B0] hover:text-[#FFF8EE] hover:bg-[#1A140D] transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#FFB000]" />
              <span>Overview</span>
            </Link>
            <Link
              href="/sites"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#D4C4B0] hover:text-[#FFF8EE] hover:bg-[#1A140D] transition-colors"
            >
              <Globe className="w-4 h-4 text-[#FFC928]" />
              <span>Sites (Connected)</span>
            </Link>
            <div className="pt-2 pb-1 px-3 text-[10px] font-semibold tracking-wider text-[#9E8C78] uppercase">
              Core Engines
            </div>
            <Link
              href="/media"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#D4C4B0] hover:text-[#FFF8EE] hover:bg-[#1A140D] transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-[#28C76F]" />
              <span>Media Optimizer</span>
            </Link>
            <Link
              href="/media/alt-text"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#D4C4B0] hover:text-[#FFF8EE] hover:bg-[#1A140D] transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#FF9F43]" />
              <span>Alt-Text Queue</span>
            </Link>
            <Link
              href="/speed"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#D4C4B0] hover:text-[#FFF8EE] hover:bg-[#1A140D] transition-colors"
            >
              <Zap className="w-4 h-4 text-[#FFB000]" />
              <span>PageSpeed Engine</span>
            </Link>
            <Link
              href="/seo"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#D4C4B0] hover:text-[#FFF8EE] hover:bg-[#1A140D] transition-colors"
            >
              <Search className="w-4 h-4 text-[#00CFE8]" />
              <span>SEO Gap Fill</span>
            </Link>
            <Link
              href="/replicator"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#D4C4B0] hover:text-[#FFF8EE] hover:bg-[#1A140D] transition-colors"
            >
              <Copy className="w-4 h-4 text-[#FFB000]" />
              <span>UI Replicator</span>
            </Link>
            <Link
              href="/files"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#D4C4B0] hover:text-[#FFF8EE] hover:bg-[#1A140D] transition-colors"
            >
              <FolderTree className="w-4 h-4 text-[#FF8A00]" />
              <span>File Manager</span>
            </Link>
            <div className="pt-2 pb-1 px-3 text-[10px] font-semibold tracking-wider text-[#9E8C78] uppercase">
              Operations
            </div>
            <Link
              href="/jobs"
              className="flex items-center justify-between px-3 py-2 rounded-md text-[#D4C4B0] hover:text-[#FFF8EE] hover:bg-[#1A140D] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ListTodo className="w-4 h-4 text-[#FFC928]" />
                <span>Job Queues</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#1A140D] border border-[#3A2B1C] rounded text-[#28C76F]">
                Live
              </span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[#D4C4B0] hover:text-[#FFF8EE] hover:bg-[#1A140D] transition-colors"
            >
              <Settings className="w-4 h-4 text-[#D4C4B0]" />
              <span>Settings</span>
            </Link>
          </nav>

          {/* Footer Status */}
          <div className="p-3 border-t border-[#261C12] flex items-center justify-between text-xs text-[#9E8C78]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#28C76F]" />
              <span>Hub Online</span>
            </div>
            <span className="font-mono text-[10px] text-[#9E8C78]">v0.1.0-alpha</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Bar */}
          <header className="h-16 bg-[#120E09] border-b border-[#261C12] px-6 flex items-center justify-between select-none">
            {/* Site Scope Pill */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#28C76F] animate-pulse" />
              <span className="text-xs font-semibold text-[#FFF8EE]">Production Store</span>
              <span className="text-[10px] font-mono text-[#D4C4B0] bg-[#1A140D] px-2 py-0.5 rounded border border-[#3A2B1C]">
                https://store.local
              </span>
            </div>

            {/* Quick Actions & Command Palette Trigger */}
            <div className="flex items-center gap-3">
              <button
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1A140D] border border-[#3A2B1C] text-xs text-[#D4C4B0] hover:text-[#FFF8EE] hover:border-[#FFB000]/60 transition-colors"
                title="Global Command Palette (⌘K)"
              >
                <Command className="w-3.5 h-3.5 text-[#FFB000]" />
                <span>Search actions, sites, jobs...</span>
                <kbd className="font-mono text-[10px] bg-[#0A0805] px-1.5 py-0.5 rounded border border-[#3A2B1C] text-[#FFF8EE]">
                  ⌘K
                </kbd>
              </button>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 overflow-y-auto p-6 bg-[#0A0805]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
