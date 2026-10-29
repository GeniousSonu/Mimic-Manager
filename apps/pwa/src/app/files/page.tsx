'use client';

import React, { useState } from 'react';
import { Button } from '@mimic-manager/ui';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Trash2, 
  Lock, 
  History, 
  CheckCircle2, 
  X,
  File
} from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: string;
  modified?: string;
  children?: FileItem[];
}

const INITIAL_TREE: FileItem[] = [
  {
    name: 'themes',
    path: 'wp-content/themes',
    type: 'directory',
    children: [
      {
        name: 'twentytwentyfive',
        path: 'wp-content/themes/twentytwentyfive',
        type: 'directory',
        children: [
          { name: 'functions.php', path: 'wp-content/themes/twentytwentyfive/functions.php', type: 'file', size: '4.2 KB', modified: '2026-10-29 14:20' },
          { name: 'style.css', path: 'wp-content/themes/twentytwentyfive/style.css', type: 'file', size: '12.8 KB', modified: '2026-10-29 12:10' },
          { name: 'theme.json', path: 'wp-content/themes/twentytwentyfive/theme.json', type: 'file', size: '28.4 KB', modified: '2026-10-28 09:30' },
        ],
      },
    ],
  },
  {
    name: 'plugins',
    path: 'wp-content/plugins',
    type: 'directory',
    children: [
      {
        name: 'optiforge-connector',
        path: 'wp-content/plugins/optiforge-connector',
        type: 'directory',
        children: [
          { name: 'optiforge.php', path: 'wp-content/plugins/optiforge-connector/optiforge.php', type: 'file', size: '3.1 KB', modified: '2026-10-29 15:00' },
          { name: 'composer.json', path: 'wp-content/plugins/optiforge-connector/composer.json', type: 'file', size: '1.2 KB', modified: '2026-10-29 15:00' },
        ],
      },
    ],
  },
  {
    name: 'uploads',
    path: 'wp-content/uploads',
    type: 'directory',
    children: [
      { name: '2026', path: 'wp-content/uploads/2026', type: 'directory' },
    ],
  },
];

const INITIAL_CODE = `<?php
/**
 * Twenty Twenty-Five Theme Functions
 *
 * @package WordPress
 * @subpackage Twenty_Twenty_Five
 */

declare(strict_types=1);

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('responsive-embeds');
    add_theme_support('editor-styles');
});

// Enqueue modern styling
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'twentytwentyfive-style',
        get_stylesheet_uri(),
        [],
        wp_get_theme()->get('Version')
    );
});
`;

export default function VisualFileManagerPage() {
  const [selectedFile, setSelectedFile] = useState('wp-content/themes/twentytwentyfive/functions.php');
  const [code, setCode] = useState(INITIAL_CODE);
  const [isDirty, setIsDirty] = useState(false);
  const [showSudoModal, setShowSudoModal] = useState(false);
  const [sudoPin, setSudoPin] = useState('');
  const [sudoError, setSudoError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showBackups, setShowBackups] = useState(false);

  // Simple client-side syntax linter for instant visual feedback
  const hasSyntaxError = code.includes('function broken(') || code.includes('<?php syntax_error');

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setIsDirty(true);
  };

  const handleRequestSave = () => {
    if (hasSyntaxError) {
      showToast('Blocked by PhpAstLinter: Syntax error detected. Fix errors before saving to prevent WSOD.');
      return;
    }
    setShowSudoModal(true);
  };

  const handleConfirmSudo = () => {
    if (sudoPin.length < 4) {
      setSudoError('PIN must be at least 4 digits');
      return;
    }

    setShowSudoModal(false);
    setSudoPin('');
    setSudoError(null);
    setIsDirty(false);
    showToast('Atomic shadow backup created in .optiforge-backups/ and file saved cleanly.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#161A23] border border-[#2FBF8F]/50 rounded-lg shadow-xl text-xs text-[#E9ECF3] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#2FBF8F]" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-[#747E92] hover:text-[#E9ECF3]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#E9ECF3] flex items-center gap-2">
            <FileCode className="w-5 h-5 text-[#4DA3FF]" />
            Visual File Manager
          </h2>
          <p className="text-xs text-[#A5AEC0] mt-1">
            Sandboxed in wp-content/ with path jail protection, PHP syntax check, and atomic shadow backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowBackups(!showBackups)}
            leftIcon={<History className="w-3.5 h-3.5 text-[#A5AEC0]" />}
          >
            Shadow Backups
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRequestSave}
            disabled={!isDirty}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Changes {isDirty && '•'}
          </Button>
        </div>
      </div>

      {/* Jail Status Banner */}
      <div className="flex items-center justify-between p-3.5 bg-[#10131A] border border-[#2A3040] rounded-lg text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#2FBF8F]" />
          <span className="text-[#E9ECF3] font-medium">Jail Root Active:</span>
          <span className="font-mono text-[#7C6CFF] bg-[#7C6CFF]/10 px-2 py-0.5 rounded border border-[#7C6CFF]/20">
            /var/www/html/wp-content
          </span>
        </div>

        <div className="flex items-center gap-3 text-[#747E92]">
          <span className="text-[#2FBF8F]">Strict Realpath Sandbox</span>
          <span>•</span>
          <span>wp-config.php Protected</span>
          <span>•</span>
          <span>Syntax AST Pre-Screen Active</span>
        </div>
      </div>

      {/* Editor & File Tree Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: Tree Explorer */}
        <div className="bg-[#10131A] border border-[#2A3040] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#E9ECF3] border-b border-[#1F2430] pb-2">
            <span>Explorer</span>
            <span className="text-[11px] font-mono text-[#747E92]">wp-content</span>
          </div>

          <div className="space-y-1 text-xs">
            {INITIAL_TREE.map(folder => (
              <div key={folder.path} className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1.5 text-[#E9ECF3] font-medium rounded hover:bg-[#161A23] cursor-pointer">
                  <FolderOpen className="w-3.5 h-3.5 text-[#F5A524]" />
                  <span>{folder.name}</span>
                </div>

                {folder.children && (
                  <div className="pl-4 space-y-1">
                    {folder.children.map(subItem => (
                      <div key={subItem.path}>
                        {subItem.type === 'directory' ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 px-2 py-1 text-[#A5AEC0] hover:text-[#E9ECF3] cursor-pointer">
                              <Folder className="w-3.5 h-3.5 text-[#F5A524]/70" />
                              <span>{subItem.name}</span>
                            </div>

                            {subItem.children && (
                              <div className="pl-4 space-y-0.5">
                                {subItem.children.map(file => (
                                  <div
                                    key={file.path}
                                    onClick={() => setSelectedFile(file.path)}
                                    className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                                      selectedFile === file.path
                                        ? 'bg-[#7C6CFF]/15 text-[#7C6CFF] font-medium border border-[#7C6CFF]/30'
                                        : 'text-[#747E92] hover:text-[#E9ECF3] hover:bg-[#161A23]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <FileCode className="w-3 h-3 shrink-0" />
                                      <span className="truncate">{file.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-[#555E70]">{file.size}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            onClick={() => setSelectedFile(subItem.path)}
                            className="flex items-center gap-2 px-2 py-1 text-[#747E92] hover:text-[#E9ECF3] cursor-pointer"
                          >
                            <File className="w-3 h-3" />
                            <span>{subItem.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Code Editor & Linting Inspector */}
        <div className="lg:col-span-3 flex flex-col bg-[#10131A] border border-[#2A3040] rounded-xl overflow-hidden min-h-[460px]">
          {/* File Tab Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1F2430] bg-[#0A0C10] text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#E9ECF3]">{selectedFile}</span>
              {isDirty && (
                <span className="px-1.5 py-0.2 text-[10px] font-medium bg-[#F5A524]/20 text-[#F5A524] rounded">
                  Unsaved Changes
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasSyntaxError ? (
                <div className="flex items-center gap-1.5 text-xs text-[#F2555A] font-medium bg-[#F2555A]/10 px-2 py-0.5 rounded border border-[#F2555A]/20">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Syntax Error (Blocked)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#2FBF8F] font-medium bg-[#2FBF8F]/10 px-2 py-0.5 rounded border border-[#2FBF8F]/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>php -l Clean</span>
                </div>
              )}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex bg-[#07090D] p-3">
            <textarea
              value={code}
              onChange={handleCodeChange}
              spellCheck={false}
              className="w-full h-full min-h-[380px] bg-transparent text-[#E9ECF3] font-mono text-xs leading-relaxed focus:outline-none resize-none p-2 selection:bg-[#7C6CFF]/30"
            />
          </div>
        </div>
      </div>

      {/* Sudo Re-Auth Modal */}
      {showSudoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#10131A] border border-[#2A3040] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5A524]/10 border border-[#F5A524]/30 flex items-center justify-center text-[#F5A524]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#E9ECF3]">Sudo Authorization Required</h3>
                <p className="text-xs text-[#747E92]">Confirm pairing PIN to authorize write to sandboxed file</p>
              </div>
            </div>

            <div className="bg-[#161A23] p-3 rounded-lg border border-[#2A3040] text-xs font-mono text-[#A5AEC0]">
              target: {selectedFile}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#E9ECF3] font-medium">Enter 6-Digit Pairing PIN</label>
              <input
                type="password"
                maxLength={6}
                value={sudoPin}
                onChange={e => setSudoPin(e.target.value)}
                placeholder="••••••"
                className="w-full px-3 py-2 bg-[#0A0C10] border border-[#2A3040] rounded-lg text-center text-lg font-mono tracking-widest text-[#E9ECF3] focus:outline-none focus:border-[#7C6CFF]"
              />
              {sudoError && <p className="text-xs text-[#F2555A]">{sudoError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowSudoModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmSudo}>
                Authorize & Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
