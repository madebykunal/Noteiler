import React, { memo } from 'react';
import DownloadMenu from './DownloadMenu';

function SidebarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

function Header({
  words = 0,
  selectedWords = 0,
  isSidebarOpen = false,
  onToggleSidebar,
  onDownloadMarkdown,
  onDownloadPDF,
  onDownloadText,
  onCopyClipboard,
  isExportingPDF
}) {
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
