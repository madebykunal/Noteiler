import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import { countWords } from './utils/stats';
import { 
  exportAsMarkdown, 
  exportAsPDF, 
  exportAsPlainText, 
  copyToClipboard 
} from './utils/export';
import { lintText, applySuggestion } from './utils/harper';
import './App.css';

const DEFAULT_CONTENT = `Hey, welcome to writer, here, we can type as much as we can and just paste that writing into a PDF or text, and since it is fast and smooth, I love typing in here.

What's new in these days?
Nothing at all, just vibing with the day's and been playing games a while out, being here in the present, helped me a lot.`;

export default function App() {
  const [docs, setDocs] = useState(() => {
    try {
      const savedDocs = window.localStorage.getItem('noteiler_docs');
      if (savedDocs) {
        const parsed = JSON.parse(savedDocs);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const legacyContent = window.localStorage.getItem('noteiler_content');
      return [{
        id: 'doc_' + Date.now(),
        title: 'Welcome Note',
        content: legacyContent !== null ? JSON.parse(legacyContent) : DEFAULT_CONTENT,
        createdAt: Date.now()
      }];
    } catch {
      return [{
        id: 'doc_' + Date.now(),
        title: 'Welcome Note',
        content: DEFAULT_CONTENT,
        createdAt: Date.now()
      }];
    }
  });

  const [activeDocId, setActiveDocId] = useState(() => {
    try {
      const savedId = window.localStorage.getItem('noteiler_active_doc_id');
      if (savedId) return savedId;
    } catch {}
    return docs[0]?.id || 'doc_default';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      return window.localStorage.getItem('noteiler_sidebar_open') === 'true';
    } catch {
      return false;
    }
  });

  const [selectedWords, setSelectedWords] = useState(0);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [toast, setToast] = useState(null);

  const [harperIssues, setHarperIssues] = useState([]);
  const [isCheckingHarper, setIsCheckingHarper] = useState(false);

  const toastTimerRef = useRef(null);
  const docsRef = useRef(docs);
  const harperTimerRef = useRef(null);

  useEffect(() => {
    docsRef.current = docs;
  }, [docs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem('noteiler_docs', JSON.stringify(docs));
      } catch {}
    }, 300);

    return () => clearTimeout(timer);
  }, [docs]);

  useEffect(() => {
    try {
      window.localStorage.setItem('noteiler_active_doc_id', activeDocId);
    } catch {}
  }, [activeDocId]);

  useEffect(() => {
    try {
      window.localStorage.setItem('noteiler_sidebar_open', isSidebarOpen ? 'true' : 'false');
    } catch {}
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        window.localStorage.setItem('noteiler_docs', JSON.stringify(docsRef.current));
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  const activeDoc = useMemo(() => {
    return docs.find((d) => d.id === activeDocId) || docs[0] || {
      id: 'doc_empty',
      title: 'Untitled',
      content: ''
    };
  }, [docs, activeDocId]);

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast(message);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleTitleChange = useCallback((newTitle) => {
    setDocs((prevDocs) =>
      prevDocs.map((doc) =>
        doc.id === activeDocId ? { ...doc, title: newTitle, updatedAt: Date.now() } : doc
      )
    );
  }, [activeDocId]);

  const handleContentChange = useCallback((newContent) => {
    setDocs((prevDocs) =>
      prevDocs.map((doc) =>
        doc.id === activeDocId ? { ...doc, content: newContent, updatedAt: Date.now() } : doc
      )
    );
  }, [activeDocId]);

  const handleNewChat = useCallback(() => {
    const newDoc = {
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: '',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setDocs((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    showToast('Created new chat');
  }, [showToast]);

  const handleDeleteDoc = useCallback((docIdToDelete) => {
    setDocs((prevDocs) => {
      const filtered = prevDocs.filter((d) => d.id !== docIdToDelete);
      if (filtered.length === 0) {
        const fallbackDoc = {
          id: 'doc_' + Date.now(),
          title: '',
          content: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        setActiveDocId(fallbackDoc.id);
        return [fallbackDoc];
      }
      if (activeDocId === docIdToDelete) {
        setActiveDocId(filtered[0].id);
      }
      return filtered;
    });
    showToast('Deleted chat');
  }, [activeDocId, showToast]);

  useEffect(() => {
    if (harperTimerRef.current) {
      clearTimeout(harperTimerRef.current);
    }

    harperTimerRef.current = setTimeout(async () => {
      const currentText = activeDoc.content;
      if (!currentText || !currentText.trim()) {
        setHarperIssues([]);
        setIsCheckingHarper(false);
        return;
      }

      setIsCheckingHarper(true);
      try {
        const issues = await lintText(currentText);
        setHarperIssues(issues);
      } catch {
        setHarperIssues([]);
      } finally {
        setIsCheckingHarper(false);
      }
    }, 600);

    return () => {
      if (harperTimerRef.current) {
        clearTimeout(harperTimerRef.current);
      }
    };
  }, [activeDoc.content]);

  const handleApplyHarperSuggestion = useCallback((issue, suggestion) => {
    const updated = applySuggestion(activeDoc.content, issue, suggestion);
    handleContentChange(updated);
    showToast(`Applied: ${suggestion || '(removed)'}`);
  }, [activeDoc.content, handleContentChange, showToast]);

  const words = useMemo(() => countWords(activeDoc.content || ''), [activeDoc.content]);
  const docFilename = (activeDoc.title && activeDoc.title.trim()) || 'Untitled';

  const handleDownloadMarkdown = useCallback(() => {
    try {
      const savedName = exportAsMarkdown(activeDoc.content, `${docFilename}.md`);
      showToast(`Downloaded ${savedName}`);
    } catch {
      showToast('Error exporting Markdown');
    }
  }, [activeDoc.content, docFilename, showToast]);

  const handleDownloadPDF = useCallback(async () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);
    showToast('Generating PDF...');

    try {
      const savedName = await exportAsPDF(activeDoc.content, `${docFilename}.pdf`);
      showToast(`Downloaded ${savedName}`);
    } catch {
      showToast('Failed to generate PDF');
    } finally {
      setIsExportingPDF(false);
    }
  }, [isExportingPDF, activeDoc.content, docFilename, showToast]);

  const handleDownloadText = useCallback(() => {
    try {
      const savedName = exportAsPlainText(activeDoc.content, `${docFilename}.txt`);
      showToast(`Downloaded ${savedName}`);
    } catch {
      showToast('Error exporting text');
    }
  }, [activeDoc.content, docFilename, showToast]);

  const handleCopyClipboard = useCallback(async () => {
    try {
      const ok = await copyToClipboard(activeDoc.content);
      if (ok) {
        showToast('Copied to clipboard');
        return true;
      }
    } catch {
      showToast('Failed to copy');
    }
    return false;
  }, [activeDoc.content, showToast]);

  return (
    <div className="app-container">
      <Header
        words={words}
        selectedWords={selectedWords}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        harperIssues={harperIssues}
        isCheckingHarper={isCheckingHarper}
        onApplyHarperSuggestion={handleApplyHarperSuggestion}
        onDownloadMarkdown={handleDownloadMarkdown}
        onDownloadPDF={handleDownloadPDF}
        onDownloadText={handleDownloadText}
        onCopyClipboard={handleCopyClipboard}
        isExportingPDF={isExportingPDF}
      />

      <div className="app-body">
        <Sidebar
          isOpen={isSidebarOpen}
          docs={docs}
          activeDocId={activeDoc.id}
          onSelectDoc={(id) => setActiveDocId(id)}
          onNewChat={handleNewChat}
          onDeleteDoc={handleDeleteDoc}
        />

        <main className="main-workspace">
          <section className="editor-pane" aria-label="Writing Area">
            <Editor
              docId={activeDoc.id}
              title={activeDoc.title}
              onTitleChange={handleTitleChange}
              content={activeDoc.content}
              onChange={handleContentChange}
              onSelectionChange={setSelectedWords}
            />
          </section>
        </main>
      </div>

      {toast && (
        <aside className="toast-container">
          <Toast message={toast} />
        </aside>
      )}
    </div>
  );
}
