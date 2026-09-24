import React from 'react';
import { countWords } from '../utils/stats';

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

export default function Sidebar({
  isOpen,
  docs = [],
  activeDocId,
  onSelectDoc,
  onNewChat,
  onDeleteDoc
}) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const shortcutLabel = isMac ? '⌘N' : 'Ctrl+N';

  return (
    <aside className={`sidebar-drawer ${isOpen ? 'open' : 'closed'}`} aria-label="Notes sidebar">
      <div className="sidebar-inner">
        <div className="sidebar-top">
          <div className="sidebar-brand-row">
            <span className="sidebar-brand-title">Noteiler</span>
            <span className="sidebar-count-badge">{docs.length}</span>
          </div>

          <button
            type="button"
            className="sidebar-new-note-btn"
            onClick={onNewChat}
            title={`Create new note (${shortcutLabel})`}
          >
            <div className="new-note-btn-left">
              <PlusIcon />
              <span>New Note</span>
            </div>
            <kbd className="sidebar-shortcut-kbd">{shortcutLabel}</kbd>
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">NOTES</div>
          <div className="sidebar-doc-list" role="list">
            {docs.map((doc) => {
              const isActive = doc.id === activeDocId;
              const title = doc.title && doc.title.trim() ? doc.title.trim() : 'Untitled';
              const words = countWords(doc.content || '');
              const previewText = doc.content && doc.content.trim() 
                ? doc.content.trim().slice(0, 42).replace(/\s+/g, ' ') 
                : 'Empty document';

              return (
                <div
                  key={doc.id}
                  role="listitem"
                  className={`sidebar-doc-card ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectDoc(doc.id)}
                >
                  <div className="sidebar-doc-content">
                    <div className="sidebar-doc-header">
                      <NoteIcon />
                      <span className="sidebar-doc-title">{title}</span>
                    </div>
                    <span className="sidebar-doc-snippet">{previewText}</span>
                    <div className="sidebar-doc-footer">
                      <span className="sidebar-doc-meta">{words} {words === 1 ? 'word' : 'words'}</span>
                    </div>
                  </div>

                  {docs.length > 1 && (
                    <button
                      type="button"
                      className="sidebar-doc-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDoc(doc.id);
                      }}
                      title="Delete note"
                      aria-label={`Delete ${title}`}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
