import React, { useRef, useEffect } from 'react';

function CheckCircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

export default function HarperPopover({
  isOpen,
  onClose,
  issues = [],
  isChecking = false,
  onApply
}) {
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="harper-popover" ref={popoverRef} role="dialog" aria-label="Harper suggestions">
      <div className="harper-popover-header">
        <div className="harper-popover-title">
          <SparklesIcon />
          <span>Harper Grammar & Punctuation</span>
        </div>
        <span className="harper-offline-tag">Offline</span>
      </div>

      <div className="harper-popover-content">
        {isChecking && issues.length === 0 ? (
          <div className="harper-empty-state">
            <span>Analyzing document...</span>
          </div>
        ) : issues.length === 0 ? (
          <div className="harper-empty-state">
            <CheckCircleIcon />
            <span>No spelling or punctuation issues found.</span>
          </div>
        ) : (
          <div className="harper-issues-list">
            {issues.map((issue) => (
              <div key={issue.id} className="harper-issue-card">
                <div className="harper-issue-meta">
                  <span className={`harper-kind-badge kind-${issue.kind.toLowerCase()}`}>
                    {issue.kind}
                  </span>
                  <span className="harper-problem-word">"{issue.problemText}"</span>
                </div>
                <p className="harper-issue-message">{issue.message}</p>
                {issue.suggestions && issue.suggestions.length > 0 && (
                  <div className="harper-suggestions-row">
                    <span className="harper-suggestions-label">Suggestions:</span>
                    <div className="harper-suggestion-chips">
                      {issue.suggestions.slice(0, 3).map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="harper-chip-btn"
                          onClick={() => onApply(issue, suggestion)}
                          title={`Apply "${suggestion}"`}
                        >
                          {suggestion === '' ? '(remove)' : suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
