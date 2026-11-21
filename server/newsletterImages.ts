import sanitizeHtml from 'sanitize-html';
export function sanitizeNewsletterHtml(html: string) {
    return sanitizeHtml(html, { allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'style', 'width'], span: ['style'] },
        allowedSchemes: ['https', 'mailto'], allowedSchemesByTag: { img: ['https'] }, allowProtocolRelative: false,
        transformTags: { img: (_tag, attrs) => ({ tagName: 'img', attribs: { src: attrs.src || '', alt: attrs.alt || '', ...(Number.isFinite(Number(attrs.width)) && Number(attrs.width) > 0 ? { width: String(Math.min(1200, Math.round(Number(attrs.width)))) } : {}), style: 'max-width:100%;height:auto;display:block;margin:16px auto' } }) },
        allowedStyles: { img: { 'max-width': [/^100%$/], height: [/^auto$/], display: [/^block$/], margin: [/^16px auto$/] } },
    });
}
export function imageExtension(bytes: Buffer, mime: string) {
    if (mime === 'image/png' && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
    if (mime === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg';
    if (mime === 'image/webp' && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') return 'webp';
    return null;
}
