export function sanitizeFilename(name, defaultName, extension) {
  let cleanName = (name || '').trim();
  if (!cleanName) cleanName = defaultName;

  cleanName = cleanName.replace(/[<>:"/\\|?*]/g, '');

  if (cleanName.toLowerCase().endsWith('.' + extension.toLowerCase())) {
    return cleanName;
  }
  return `${cleanName}.${extension}`;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function exportAsMarkdown(content, filename = 'implementation.md') {
  const finalFilename = sanitizeFilename(filename, 'implementation', 'md');
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, finalFilename);
  return finalFilename;
}

export function exportAsPlainText(content, filename = 'implementation.txt') {
  const finalFilename = sanitizeFilename(filename, 'implementation', 'txt');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, finalFilename);
  return finalFilename;
}

export async function copyToClipboard(content) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(content);
    return true;
  }
  const textArea = document.createElement('textarea');
  textArea.value = content;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const successful = document.execCommand('copy');
  document.body.removeChild(textArea);
  return successful;
}

export async function exportAsPDF(rawText, filename = 'implementation.pdf') {
  const finalFilename = sanitizeFilename(filename, 'implementation', 'pdf');

  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]);

  const printWrapper = document.createElement('div');
  printWrapper.id = 'pdf-export-stage';
  printWrapper.style.position = 'absolute';
  printWrapper.style.top = '-99999px';
  printWrapper.style.left = '0';
  printWrapper.style.width = '794px';
  printWrapper.style.background = '#ffffff';
  printWrapper.style.color = '#1f2937';
  printWrapper.style.fontFamily = "'Figtree', -apple-system, BlinkMacSystemFont, sans-serif";
  printWrapper.style.padding = '48px 56px';
  printWrapper.style.lineHeight = '1.8';
  printWrapper.style.boxSizing = 'border-box';
  printWrapper.style.whiteSpace = 'pre-wrap';
  printWrapper.style.wordBreak = 'break-word';
  printWrapper.style.fontSize = '15px';

  printWrapper.innerHTML = escapeHtml(rawText || '');
  document.body.appendChild(printWrapper);

  let canvas = null;
  try {
    canvas = await html2canvas(printWrapper, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;
    let pageNum = 1;

    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
    heightLeft -= (pageHeight - margin * 2);

    while (heightLeft > 0) {
      position = -(pageHeight - margin * 2) * pageNum + margin;
      pdf.addPage();
      pageNum++;
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pageHeight - margin * 2);
    }

    pdf.save(finalFilename);
    return finalFilename;
  } finally {
    if (document.body.contains(printWrapper)) {
      document.body.removeChild(printWrapper);
    }
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
