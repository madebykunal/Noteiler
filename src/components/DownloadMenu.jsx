import React, { useState, useRef, useEffect, useCallback } from 'react';

function CaretDownIcon({ className }) {
  return (
    <svg 
      width="13" 
      height="13" 
      viewBox="0 0 256 256" 
      fill="currentColor" 
      className={className}
      aria-hidden="true"
    >
      <path d="M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z" />
    </svg>
  );
}

export default function DownloadMenu({ 
  onDownloadMarkdown, 
  onDownloadPDF, 
  onDownloadText, 
  onCopyClipboard,
  isExportingPDF
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleAction = useCallback((callback) => {
    setIsOpen(false);
    callback();
  }, []);

  return (
    <div className="download-menu-wrapper" ref={menuRef}>
      <button 
        type="button"
        id="download-btn"
        className={`download-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="download-btn-text">
          {isExportingPDF ? 'Exporting...' : 'Download'}
        </span>
        <span className="download-btn-divider" />
        <span className="download-btn-arrow">
          <CaretDownIcon className={`chevron ${isOpen ? 'rotated' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div className="download-dropdown" role="menu">
          <button 
            type="button"
            className="dropdown-item"
            role="menuitem"
            disabled={isExportingPDF}
            onClick={() => handleAction(onDownloadPDF)}
          >
            PDF (.pdf)
          </button>

          <button 
            type="button"
            className="dropdown-item"
            role="menuitem"
            onClick={() => handleAction(onDownloadMarkdown)}
          >
            Markdown (.md)
          </button>

          <button 
            type="button"
            className="dropdown-item"
            role="menuitem"
            onClick={() => handleAction(onDownloadText)}
          >
            Plain text (.txt)
          </button>

          <div className="dropdown-divider" />

          <button 
            type="button"
            className="dropdown-item"
            role="menuitem"
            onClick={() => handleAction(onCopyClipboard)}
          >
            Copy text
          </button>
        </div>
      )}
    </div>
  );
}
