import React, { useRef, useEffect, useState, useCallback } from 'react';
import { countWords } from '../utils/stats';

function getRangeForOffsets(root, start, end) {
  try {
    const range = document.createRange();
    let currentPos = 0;
    let startSet = false;
    let endSet = false;

    function walk(node) {
      if (endSet) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const len = node.nodeValue.length;
        if (!startSet && currentPos + len >= start) {
          range.setStart(node, Math.max(0, start - currentPos));
          startSet = true;
        }
        if (startSet && currentPos + len >= end) {
          range.setEnd(node, Math.min(len, end - currentPos));
          endSet = true;
          return;
        }
        currentPos += len;
      } else if (node.nodeName === 'BR') {
        if (!startSet && currentPos >= start) {
          range.setStartBefore(node);
          startSet = true;
        }
        if (startSet && currentPos >= end) {
          range.setEndBefore(node);
          endSet = true;
          return;
        }
        currentPos += 1;
      } else {
        const children = node.childNodes;
        for (let i = 0; i < children.length; i++) {
          walk(children[i]);
          if (endSet) return;
        }
      }
    }

    walk(root);
    if (startSet && endSet) {
      return range;
    }
  } catch {}
  return null;
}

function getCharOffsetFromPoint(editorEl, x, y) {
  let node = null;
  let offset = 0;

  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    if (range) {
      node = range.startContainer;
      offset = range.startOffset;
    }
  } else if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    if (pos) {
      node = pos.offsetNode;
      offset = pos.offset;
    }
  }

  if (!node || !editorEl.contains(node)) return -1;

  let currentOffset = 0;
  let found = false;

  function walk(n) {
    if (found) return true;
    if (n === node) {
      currentOffset += offset;
      found = true;
      return true;
    }
    if (n.nodeType === Node.TEXT_NODE) {
      currentOffset += n.nodeValue.length;
    } else if (n.nodeName === 'BR') {
      currentOffset += 1;
    } else {
      for (let i = 0; i < n.childNodes.length; i++) {
        if (walk(n.childNodes[i])) return true;
      }
    }
    return false;
  }

  walk(editorEl);
  return found ? currentOffset : -1;
}

export default function Editor({
  docId,
  title = '',
  onTitleChange,
  content,
  onChange,
  onSelectionChange,
  harperIssues = [],
  onApplyHarperSuggestion,
  isSidebarOpen = false
}) {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const measureSpanRef = useRef(null);

  const [caretPos, setCaretPos] = useState({ x: 0, y: 0, height: 32 });
  const [isVisible, setIsVisible] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(100);

  const [markers, setMarkers] = useState([]);
  const [hoveredData, setHoveredData] = useState(null);

  const prevPosRef = useRef(null);
  const idleTimerRef = useRef(null);
  const rafRef = useRef(null);
  const currentDocIdRef = useRef(docId);
  const hoverTimeoutRef = useRef(null);
  const isOverTooltipRef = useRef(false);

  const resetIdle = useCallback(() => {
    setIsIdle(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 500);
  }, []);

  const updateCaretPosition = useCallback((motionHint = 'type') => {
    if (!editorRef.current || !containerRef.current) return;

    if (document.activeElement !== editorRef.current) {
      setIsVisible(false);
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setIsVisible(false);
      return;
    }

    const range = sel.getRangeAt(0);

    if (!editorRef.current.contains(range.startContainer)) {
      setIsVisible(false);
      return;
    }

    if (!range.collapsed) {
      setIsVisible(false);
      if (onSelectionChange) {
        onSelectionChange(countWords(sel.toString()));
      }
      return;
    }

    if (onSelectionChange) {
      onSelectionChange(0);
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    let rect = range.getBoundingClientRect();

    if (!rect || (rect.width === 0 && rect.height === 0) || (rect.top === 0 && rect.bottom === 0)) {
      if (!measureSpanRef.current) {
        const span = document.createElement('span');
        span.textContent = '\u200b';
        span.style.display = 'inline';
        span.style.padding = '0';
        span.style.margin = '0';
        span.style.border = 'none';
        measureSpanRef.current = span;
      }

      const span = measureSpanRef.current;
      const startContainer = range.startContainer;
      const startOffset = range.startOffset;

      try {
        const cloneRange = range.cloneRange();
        cloneRange.insertNode(span);
        rect = span.getBoundingClientRect();

        if (span.parentNode) {
          span.parentNode.removeChild(span);
        }

        const restoredRange = document.createRange();
        const maxOffset = startContainer.nodeType === Node.TEXT_NODE 
          ? startContainer.length 
          : startContainer.childNodes.length;
        restoredRange.setStart(startContainer, Math.min(startOffset, maxOffset));
        restoredRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(restoredRange);
      } catch {}
    }

    const computed = window.getComputedStyle(editorRef.current);
    const fontSize = parseFloat(computed.fontSize) || 18.5;

    let x = 0;
    let y = 0;
    let height = fontSize * 1.35;

    if (rect && (rect.top !== 0 || rect.bottom !== 0)) {
      x = rect.left - containerRect.left;
      y = rect.top - containerRect.top;
      height = rect.height > 0 ? rect.height : fontSize * 1.35;
    } else {
      const paddingTop = parseFloat(computed.paddingTop) || 0;
      const paddingLeft = parseFloat(computed.paddingLeft) || 0;
      x = paddingLeft;
      y = paddingTop;
    }

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || !prevPosRef.current) {
      setTransitionDuration(0);
    } else {
      const dx = Math.abs(x - prevPosRef.current.x);
      const dy = Math.abs(y - prevPosRef.current.y);
      const isBigJump = motionHint === 'big' || dy > 6 || dx > 40;
      setTransitionDuration(isBigJump ? 200 : 100);
    }

    prevPosRef.current = { x, y };
    setCaretPos({ x, y, height });
    setIsVisible(true);
  }, [onSelectionChange]);

  const updateCaretRef = useRef(updateCaretPosition);
  useEffect(() => {
    updateCaretRef.current = updateCaretPosition;
  });

  const triggerCaretUpdate = useCallback((motionHint = 'type') => {
    resetIdle();
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updateCaretRef.current(motionHint);
    });
  }, [resetIdle]);

  const computeMarkers = useCallback(() => {
    if (!editorRef.current || !containerRef.current || !harperIssues || harperIssues.length === 0) {
      setMarkers([]);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const list = [];

    for (const issue of harperIssues) {
      const range = getRangeForOffsets(editorRef.current, issue.start, issue.end);
      if (!range) continue;

      const rects = range.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (r.width === 0 || r.height === 0) continue;
        list.push({
          id: `${issue.id}-${i}`,
          issue,
          x: r.left - containerRect.left,
          y: r.top - containerRect.top,
          width: r.width,
          height: r.height,
          viewportRect: r
        });
      }
    }

    setMarkers(list);
  }, [harperIssues]);

  useEffect(() => {
    computeMarkers();
  }, [computeMarkers, content]);

  const computeMarkersRef = useRef(computeMarkers);
  useEffect(() => {
    computeMarkersRef.current = computeMarkers;
  });

  const triggerCaretRef = useRef(triggerCaretUpdate);
  useEffect(() => {
    triggerCaretRef.current = triggerCaretUpdate;
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      computeMarkersRef.current();
      triggerCaretRef.current('type');
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      computeMarkersRef.current();
      triggerCaretRef.current('big');
    }, 240);
    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      if (currentDocIdRef.current !== docId) {
        currentDocIdRef.current = docId;
        editorRef.current.innerText = content || '';
        setIsVisible(false);
        setHoveredData(null);
      } else if (document.activeElement !== editorRef.current && editorRef.current.innerText !== content) {
        editorRef.current.innerText = content || '';
        triggerCaretRef.current('big');
      }
    }
  }, [docId, content]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
      if (editorRef.current.contains(sel.anchorNode)) {
        triggerCaretRef.current('type');
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  useEffect(() => {
    const scrollContainer = containerRef.current?.closest('.editor-pane') || window;
    const handleScrollOrResize = () => {
      triggerCaretRef.current('type');
      computeMarkersRef.current();
      setHoveredData(null);
    };

    scrollContainer.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!harperIssues || harperIssues.length === 0 || !editorRef.current || !containerRef.current) {
      if (hoveredData && !isOverTooltipRef.current) {
        setHoveredData(null);
      }
      return;
    }

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    let targetIssue = null;
    let targetRange = null;

    const charIndex = getCharOffsetFromPoint(editorRef.current, mouseX, mouseY);
    if (charIndex >= 0) {
      targetIssue = harperIssues.find((issue) => charIndex >= issue.start && charIndex <= issue.end);
      if (targetIssue) {
        targetRange = getRangeForOffsets(editorRef.current, targetIssue.start, targetIssue.end);
      }
    }

    if (!targetIssue && markers.length > 0) {
      const hit = markers.find(
        (m) =>
          mouseX >= m.viewportRect.left - 4 &&
          mouseX <= m.viewportRect.right + 4 &&
          mouseY >= m.viewportRect.top - 4 &&
          mouseY <= m.viewportRect.bottom + 6
      );
      if (hit) {
        targetIssue = hit.issue;
        targetRange = getRangeForOffsets(editorRef.current, hit.issue.start, hit.issue.end);
      }
    }

    if (targetIssue && targetRange) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      const rect = targetRange.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      setHoveredData({
        issue: targetIssue,
        x: Math.max(10, rect.left - containerRect.left),
        y: rect.bottom - containerRect.top + 3,
        width: rect.width
      });
    } else if (!isOverTooltipRef.current) {
      if (!hoverTimeoutRef.current) {
        hoverTimeoutRef.current = setTimeout(() => {
          if (!isOverTooltipRef.current) {
            setHoveredData(null);
          }
          hoverTimeoutRef.current = null;
        }, 180);
      }
    }
  };

  const handleMouseLeave = () => {
    if (!isOverTooltipRef.current) {
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isOverTooltipRef.current) {
          setHoveredData(null);
        }
      }, 180);
    }
  };

  const handleKeyDown = (e) => {
    resetIdle();
    setHoveredData(null);

    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
      if (onChange && editorRef.current) {
        onChange(editorRef.current.innerText);
      }
      triggerCaretUpdate('type');
      return;
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Home' || e.key === 'End' || e.key === 'Enter') {
      triggerCaretUpdate('big');
    } else {
      triggerCaretUpdate('type');
    }
  };

  const handleInput = (e) => {
    setHoveredData(null);
    if (onChange) {
      onChange(e.currentTarget.innerText);
    }
    triggerCaretUpdate('type');
  };

  const handlePaste = (e) => {
    setHoveredData(null);
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerText);
    }
    triggerCaretUpdate('big');
  };

  const handleFocus = () => {
    resetIdle();
    triggerCaretUpdate('big');
  };

  const handleBlur = () => {
    setIsVisible(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const handleContainerClick = (e) => {
    if (e.target === containerRef.current && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      triggerCaretUpdate('big');
    }
  };

  return (
    <div
      className="editor-container"
      ref={containerRef}
      onClick={handleContainerClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <input
        type="text"
        className="document-title-input"
        value={title || ''}
        onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
        onFocus={() => {
          setIsVisible(false);
          setHoveredData(null);
        }}
        placeholder="Untitled"
        aria-label="Document Title"
        spellCheck="false"
      />

      <div className="harper-markers-layer" aria-hidden="true">
        {markers.map((marker) => (
          <span
            key={marker.id}
            className={`harper-underline-wavy kind-${marker.issue.kind.toLowerCase()}`}
            style={{
              left: `${marker.x}px`,
              top: `${marker.y}px`,
              width: `${marker.width}px`,
              height: `${marker.height}px`
            }}
          />
        ))}
      </div>

      {hoveredData && (
        <div
          className="harper-word-tooltip"
          style={{
            left: `${hoveredData.x}px`,
            top: `${hoveredData.y}px`
          }}
          onMouseEnter={() => {
            isOverTooltipRef.current = true;
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => {
            isOverTooltipRef.current = false;
            setHoveredData(null);
          }}
        >
          <div className="harper-tooltip-header">
            <span className="harper-tooltip-word">"{hoveredData.issue.problemText}"</span>
            <span className="harper-tooltip-kind">{hoveredData.issue.kind}</span>
          </div>

          {hoveredData.issue.suggestions && hoveredData.issue.suggestions.length > 0 ? (
            <div className="harper-tooltip-suggestions">
              {hoveredData.issue.suggestions.slice(0, 3).map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="harper-tooltip-chip"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onApplyHarperSuggestion) {
                      onApplyHarperSuggestion(hoveredData.issue, suggestion);
                    }
                    setHoveredData(null);
                    isOverTooltipRef.current = false;
                  }}
                >
                  {suggestion === '' ? '(remove)' : suggestion}
                </button>
              ))}
            </div>
          ) : (
            <span className="harper-tooltip-message">{hoveredData.issue.message}</span>
          )}
        </div>
      )}

      <div 
        className={`custom-caret ${isIdle ? 'caret-idle' : ''} ${!isVisible ? 'caret-hidden' : ''}`}
        style={{
          height: `${caretPos.height}px`,
          transform: `translate3d(${caretPos.x}px, ${caretPos.y}px, 0)`,
          transition: transitionDuration > 0 
            ? `transform ${transitionDuration}ms ease-out, height 100ms ease-out` 
            : 'none'
        }}
        aria-hidden="true"
      />

      <div
        ref={editorRef}
        id="noteiler-editor-textarea"
        className="writing-textarea"
        contentEditable="plaintext-only"
        suppressContentEditableWarning={true}
        data-placeholder="Start typing..."
        spellCheck="false"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={() => triggerCaretUpdate('type')}
        onMouseDown={resetIdle}
        onMouseUp={() => triggerCaretUpdate('big')}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
      />
    </div>
  );
}
