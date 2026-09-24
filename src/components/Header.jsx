import React, { memo } from 'react';
import DownloadMenu from './DownloadMenu';

function Header({
  words = 0,
  selectedWords = 0,
  onDownloadMarkdown,
  onDownloadPDF,
  onDownloadText,
  onCopyClipboard,
  isExportingPDF
}) {
  return (
    <header className="app-header">
      <div className="header-left">
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
