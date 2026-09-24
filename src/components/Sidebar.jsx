import React from 'react';
import { countWords } from '../utils/stats';

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

export default function Sidebar({
  isOpen,
  docs = [],
  activeDocId,
  onSelectDoc,
  onNewChat,
  onDeleteDoc
}) {
  return (
    <aside className={`sidebar-drawer ${isOpen ? 'open' : 'closed'}`} aria-label="Chats sidebar">
      <div className="sidebar-inner">
        <div className="sidebar-top">
          <button
            type="button"
            className="sidebar-new-chat-btn"
            onClick={onNewChat}
          >
            <PlusIcon />
            <span>New Chat</span>
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">HISTORY</div>
          <div className="sidebar-doc-list" role="list">
            {docs.map((doc) => {
              const isActive = doc.id === activeDocId;
              const title = doc.title && doc.title.trim() ? doc.title.trim() : 'Untitled';
              const words = countWords(doc.content || '');

              return (
                <div
                  key={doc.id}
                  role="listitem"
                  className={`sidebar-doc-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectDoc(doc.id)}
                >
                  <div className="sidebar-doc-info">
                    <span className="sidebar-doc-title">{title}</span>
                    <span className="sidebar-doc-meta">{words} {words === 1 ? 'word' : 'words'}</span>
                  </div>
                  {docs.length > 1 && (
                    <button
                      type="button"
                      className="sidebar-doc-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDoc(doc.id);
                      }}
                      title="Delete chat"
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
