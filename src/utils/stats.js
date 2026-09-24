export function countWords(text = '') {
  let count = 0;
  let inWord = false;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const isWhitespace = code === 32 || (code >= 9 && code <= 13);
    if (!isWhitespace) {
      if (!inWord) {
        count++;
        inWord = true;
      }
    } else {
      inWord = false;
    }
  }
  return count;
}

export function calculateStats(text = '') {
  return {
    words: countWords(text)
  };
}
