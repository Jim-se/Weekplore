const RICH_TEXT_TAG_PATTERN = /<(?:p|br|strong|em|span)\b/i;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const isRichTextHtml = (value: string) => RICH_TEXT_TAG_PATTERN.test(value);

export const plainTextToRichTextHtml = (value: string) => {
  if (!value) return '';

  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => `<p>${line ? escapeHtml(line) : '<br>'}</p>`)
    .join('');
};

const normalizeAllowedColor = (value: string) => {
  const normalized = value.replace(/\s+/g, '').toLowerCase();
  return normalized === '#111111' || normalized === 'rgb(17,17,17)' ? '#111111' : '';
};

const normalizeAllowedFont = (value: string) => {
  const normalized = value.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  return normalized === 'inter, sans-serif' || normalized === 'inter' ? 'Inter, sans-serif' : '';
};

const sanitizeRichTextNode = (node: Node, targetDocument: Document): Node => {
  if (node.nodeType === Node.TEXT_NODE) {
    return targetDocument.createTextNode(node.textContent || '');
  }

  if (!(node instanceof Element)) {
    return targetDocument.createDocumentFragment();
  }

  const tagName = node.tagName.toLowerCase();
  if (tagName === 'script' || tagName === 'style') {
    return targetDocument.createDocumentFragment();
  }

  const allowedTags = new Set(['p', 'br', 'strong', 'em', 'span']);
  if (!allowedTags.has(tagName)) {
    const fragment = targetDocument.createDocumentFragment();
    Array.from(node.childNodes).forEach((child) => {
      fragment.appendChild(sanitizeRichTextNode(child, targetDocument));
    });
    return fragment;
  }

  const cleanElement = targetDocument.createElement(tagName);

  if (tagName === 'span') {
    const color = normalizeAllowedColor((node as HTMLElement).style.color);
    const fontFamily = normalizeAllowedFont((node as HTMLElement).style.fontFamily);
    const safeStyles = [
      color ? `color: ${color}` : '',
      fontFamily ? `font-family: ${fontFamily}` : '',
    ].filter(Boolean);

    if (safeStyles.length > 0) {
      cleanElement.setAttribute('style', safeStyles.join('; '));
    }
  }

  Array.from(node.childNodes).forEach((child) => {
    cleanElement.appendChild(sanitizeRichTextNode(child, targetDocument));
  });

  return cleanElement;
};

export const sanitizeRichTextForDisplay = (value: string) => {
  if (!value) return '';
  if (!isRichTextHtml(value)) return plainTextToRichTextHtml(value);

  if (typeof DOMParser === 'undefined') {
    return plainTextToRichTextHtml(value);
  }

  const parsedDocument = new DOMParser().parseFromString(value, 'text/html');
  const cleanDocument = document.implementation.createHTMLDocument('');
  const container = cleanDocument.createElement('div');

  Array.from(parsedDocument.body.childNodes).forEach((node) => {
    container.appendChild(sanitizeRichTextNode(node, cleanDocument));
  });

  return container.innerHTML;
};

export const normalizeRichTextForEditor = (value: string) =>
  isRichTextHtml(value) ? sanitizeRichTextForDisplay(value) : plainTextToRichTextHtml(value);
