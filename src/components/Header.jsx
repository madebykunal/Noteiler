import React, { memo, useState } from 'react';
import DownloadMenu from './DownloadMenu';
import HarperPopover from './HarperPopover';

function SidebarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function Header({
  words = 0,
  selectedWords = 0,
  isSidebarOpen = false,
  onToggleSidebar,
  harperIssues = [],
  isCheckingHarper = false,
  onApplyHarperSuggestion,
  onDownloadMarkdown,
  onDownloadPDF,
  onDownloadText,
  onCopyClipboard,
  isExportingPDF
}) {
  const [isHarperOpen, setIsHarperOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          id="sidebar-toggle-btn"
          className={`sidebar-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          <SidebarIcon />
        </button>

        <DownloadMenu 
          onDownloadMarkdown={onDownloadMarkdown}
          onDownloadPDF={onDownloadPDF}
          onDownloadText={onDownloadText}
          onCopyClipboard={onCopyClipboard}
          isExportingPDF={isExportingPDF}
        />
      </div>

      <div className="header-right">
        <div className="harper-status-wrapper">
          <button
            type="button"
            className={`harper-status-btn ${harperIssues.length > 0 ? 'has-issues' : 'clean'}`}
            onClick={() => setIsHarperOpen(!isHarperOpen)}
            title="Grammar & Punctuation Suggestions (Harper)"
            aria-label="Grammar and punctuation suggestions"
          >
            <SparklesIcon />
            <span>
              {isCheckingHarper 
                ? 'Checking...' 
                : harperIssues.length > 0 
                  ? `${harperIssues.length} ${harperIssues.length === 1 ? 'suggestion' : 'suggestions'}` 
                  : 'Grammar OK'}
            </span>
          </button>

          <HarperPopover
            isOpen={isHarperOpen}
            onClose={() => setIsHarperOpen(false)}
            issues={harperIssues}
            isChecking={isCheckingHarper}
            onApply={(issue, suggestion) => {
              onApplyHarperSuggestion(issue, suggestion);
            }}
          />
        </div>

        {selectedWords > 0 && (
          <span className="header-selected-count">
            ({selectedWords} {selectedWords === 1 ? 'word is selected' : 'words are selected'})
          </span>
        )}

        <span className="header-word-count">
          {words} {words === 1 ? 'word' : 'words'}
        </span>
      </div>
    </header>
  );
}

export default memo(Header);
