export const TARGET_HOST = 'alcohub-msk.com';

// Only direct results for the intended host (or Google's normal redirect URLs) qualify.
export function targetFromResult(href, base = 'https://www.google.com/') {
  try {
    let url = new URL(href, base);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.hostname === 'www.google.com' && url.pathname === '/url') {
      const destination = url.searchParams.get('q') || url.searchParams.get('url');
      if (!destination) return null;
      url = new URL(destination);
    }
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== TARGET_HOST) return null;
    return url;
  } catch { return null; }
}

export function validateQuery(query) {
  const text = String(query || '').trim();
  if (!text || text.length > 200 || /[\r\n]/.test(text)) throw new Error('Нужен один непустой поисковый запрос длиной до 200 символов.');
  return text;
}
