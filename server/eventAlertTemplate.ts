import sanitizeHtml from 'sanitize-html';

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export type AlertTemplate = {
    subject_eng?: string | null; body_eng?: string | null;
    subject_el?: string | null; body_el?: string | null;
};

export function validateEventAlertTemplate(template: AlertTemplate): string | null {
    for (const [language, body] of [['English', template.body_eng], ['Greek', template.body_el]]) {
        const content = sanitizeHtml(body || '', { allowedTags: ['a'], allowedAttributes: { a: ['href'] }, allowProtocolRelative: false });
        if (!content.includes('{booking_url}') || !content.includes('{unsubscribe_url}')) {
            return `${language} Notify Me message must include both {booking_url} and {unsubscribe_url}.`;
        }
    }
    return null;
}

export function renderEventAlert(template: AlertTemplate | null, values: {
    language: 'el' | 'en'; event: string; date: string; location: string;
    booking_url: string; unsubscribe_url: string;
}) {
    if (template) {
        const error = validateEventAlertTemplate(template);
        if (error) throw new Error(error);
    }
    const gr = values.language === 'el';
    const replace = (text: string, html = false) => text.replace(/\{(event|date|location|booking_url|unsubscribe_url)\}/g,
        (_, key: keyof typeof values) => html ? escape(values[key]) : values[key]);
    const subjectSource = (gr ? template?.subject_el || template?.subject_eng : template?.subject_eng || template?.subject_el)?.trim();
    const bodySource = (gr ? template?.body_el || template?.body_eng : template?.body_eng || template?.body_el)?.trim();
    const subject = replace(subjectSource || (gr ? 'Ελευθερώθηκαν θέσεις: {event}' : 'Places just opened up: {event}')).replace(/[\r\n]+/g, ' ');
    const fallbackBody = gr
        ? '<h1>Μόλις έγινε ακύρωση και ελευθερώθηκαν θέσεις!</h1><h2>{event}</h2><p>{date}</p><p>{booking_url}</p><p>{unsubscribe_url}</p>'
        : '<h1>A cancellation just opened up places!</h1><h2>{event}</h2><p>{date}</p><p>{booking_url}</p><p>{unsubscribe_url}</p>';
    const source = bodySource || fallbackBody;
    const safeBody = /<[a-z][\s\S]*>/i.test(source) ? sanitizeHtml(source, {
        allowedTags: ['p', 'br', 'div', 'span', 'h1', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a'],
        allowedAttributes: { a: ['href', 'title'], '*': ['style'] },
        allowedStyles: { '*': { color: [/^#[0-9a-f]{3,8}$/i], 'text-align': [/^(left|center|right)$/] } },
        allowedSchemes: ['https', 'http', 'mailto'], allowProtocolRelative: false,
    }) : escape(source).replace(/\n/g, '<br>');
    // URL tags in text become links; tags inside href attributes remain URL values.
    const body = safeBody.split(/(<[^>]*>)/g).map(part => part.startsWith('<') ? replace(part, true)
        : part.replace(/\{(event|date|location|booking_url|unsubscribe_url)\}/g, (_, key: keyof typeof values) => {
            if (key === 'booking_url' || key === 'unsubscribe_url') {
                const label = key === 'booking_url' ? (gr ? 'Κάντε κράτηση' : 'Book now') : (gr ? 'Διακοπή ειδοποιήσεων για αυτή την εκδήλωση' : 'Stop alerts for this event');
                return `<a href="${escape(values[key])}">${label}</a>`;
            }
            return escape(values[key]);
        })).join('');
    const note = gr
        ? 'Κάντε την κράτησή σας όσο υπάρχουν διαθέσιμες θέσεις. Οι θέσεις δεν δεσμεύονται και μπορεί να έχουν καλυφθεί μέχρι να ανοίξετε αυτό το email.'
        : 'Book while places are available. Places aren’t reserved and may be taken by the time you open this email.';
    const html = `<div style="max-width:560px;margin:auto;padding:32px;font:16px/1.6 Arial,sans-serif;color:#29251f"><p>WEEKPLORE</p>${body}<p>${escape(note)}</p></div>`;
    const plainBody = sanitizeHtml(body.replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)').replace(/<\/(?:p|div|h[1-3]|li)>|<br\s*\/?\s*>/gi, '\n'), { allowedTags: [], allowedAttributes: {} })
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    return { subject, html, text: `${plainBody}\n\n${note}` };
}
