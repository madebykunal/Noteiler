import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import Editor from './components/Editor';
import Toast from './components/Toast';
import { useLocalStorage } from './hooks/useLocalStorage';
import { countWords } from './utils/stats';
import { 
  exportAsMarkdown, 
  exportAsPDF, 
  exportAsPlainText, 
  copyToClipboard 
} from './utils/export';
import './App.css';

const DEFAULT_CONTENT = `Hey, welcome to writer, here, we can type as much as we can and just paste that writing into a PDF or text, and since it is fast and smooth, I love typing in here.

What's new in these days?
Nothing at all, just vibing with the day's and been playing games a while out, being here in the present, helped me a lot.`;

export default function App() {
  const [content, setContent] = useLocalStorage('noteiler_content', DEFAULT_CONTENT);
  const [selectedWords, setSelectedWords] = useState(0);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [toast, setToast] = useState(null);

  const toastTimerRef = useRef(null);

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

  const words = useMemo(() => countWords(content), [content]);

  const handleDownloadMarkdown = useCallback(() => {
    try {
      const savedName = exportAsMarkdown(content, 'implementation.md');
      showToast(`Downloaded ${savedName}`);
    } catch {
      showToast('Error exporting Markdown');
    }
  }, [content, showToast]);

  const handleDownloadPDF = useCallback(async () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);
    showToast('Generating PDF...');

    try {
      const savedName = await exportAsPDF(content, 'implementation.pdf');
      showToast(`Downloaded ${savedName}`);
    } catch {
      showToast('Failed to generate PDF');
    } finally {
      setIsExportingPDF(false);
    }
  }, [isExportingPDF, content, showToast]);

  const handleDownloadText = useCallback(() => {
    try {
      const savedName = exportAsPlainText(content, 'implementation.txt');
      showToast(`Downloaded ${savedName}`);
    } catch {
      showToast('Error exporting text');
    }
  }, [content, showToast]);

  const handleCopyClipboard = useCallback(async () => {
    try {
      const ok = await copyToClipboard(content);
      if (ok) {
        showToast('Copied to clipboard');
        return true;
      }
    } catch {
      showToast('Failed to copy');
    }
    return false;
  }, [content, showToast]);

  return (
    <div className="app-container">
      <Header
        words={words}
        selectedWords={selectedWords}
        onDownloadMarkdown={handleDownloadMarkdown}
        onDownloadPDF={handleDownloadPDF}
        onDownloadText={handleDownloadText}
        onCopyClipboard={handleCopyClipboard}
        isExportingPDF={isExportingPDF}
      />

      <main className="main-workspace">
        <section className="editor-pane" aria-label="Writing Area">
          <Editor
            content={content}
            onChange={setContent}
            onSelectionChange={setSelectedWords}
          />
        </section>
      </main>

      {toast && (
        <aside className="toast-container">
          <Toast message={toast} />
        </aside>
      )}
    </div>
  );
}
