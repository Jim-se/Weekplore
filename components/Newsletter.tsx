import { prepareImageForUpload } from '../services/imageCompression';
import React, { useState, useEffect } from 'react';
import { Mail, Plus, ArrowLeft, Save, Eye, Users, Send } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import RichTextEditor from './RichTextEditor';
import RichTextContent from './RichTextContent';
import NewsletterSubscribers from './NewsletterSubscribers';
import { supabase } from '../lib/supabase';
import { buildApiUrl, getErrorMessage } from '../services/api';

interface Draft { id: string; subject: string; preheader: string; body: string; updatedAt: string; scheduledAt?: string; status?: string; scheduledIso?: string; sentAt?: string }
const STORAGE_KEY = 'weekplore-newsletter-drafts-v1';
const copy = {
  en: {
    title: 'Newsletter', description: 'A little inspiration for their next adventure.', campaigns: 'Emails', subscribers: 'Subscribers',
    notice: 'Preview mode · Drafts are saved in this browser only. Sending and subscriber data are not connected yet.',
    new: 'New email', empty: 'Your next story starts here.', emptyBody: 'Create your first newsletter and give your community something to look forward to.',
    draft: 'Draft', untitled: 'Untitled newsletter', back: 'All emails', subject: 'Subject line', subjectPlaceholder: 'Something worth opening…',
    preheader: 'Preview text', preheaderPlaceholder: 'A short introduction for the inbox', body: 'Your message', bodyPlaceholder: 'Tell your community what is coming up…',
    save: 'Save draft', saved: 'Draft saved.', failed: 'Could not save the draft. Please try again.',
    preview: 'Preview', edit: 'Edit', audience: 'Audience', audienceBody: 'Weekplore Newsletter · All subscribed contacts',
    test: 'Send test', send: 'Send now', schedule: 'Schedule for later', scheduleDate: 'Send date and time', timezone: 'Athens time (Europe/Athens)', scheduleAction: 'Schedule email', unavailable: 'Available once sending is connected.',
    noSubscribers: 'Your community will appear here', noSubscribersBody: 'Live subscribers will be loaded from Supabase when this section is connected. No subscriber data is shown in this preview.',
    email: 'Email', source: 'Signup source', date: 'Subscribed on', status: 'Status', unknown: 'Not connected',
    footer: 'You received this email because you subscribed to Weekplore.', unsubscribe: 'Unsubscribe', required: 'Add a subject and a message before saving.',
    previewLabel: 'Email preview', updated: 'Updated',
  },
  gr: {
    title: 'Newsletter', description: 'Λίγη έμπνευση για την επόμενη εξόρμησή τους.', campaigns: 'Email', subscribers: 'Συνδρομητές',
    notice: 'Προεπισκόπηση · Τα πρόχειρα αποθηκεύονται μόνο σε αυτόν τον browser. Η αποστολή και τα στοιχεία συνδρομητών δεν έχουν συνδεθεί ακόμη.',
    new: 'Νέο email', empty: 'Η επόμενη ιστορία σου ξεκινά εδώ.', emptyBody: 'Δημιούργησε το πρώτο σου newsletter και δώσε στην παρέα σου κάτι να περιμένει.',
    draft: 'Πρόχειρο', untitled: 'Newsletter χωρίς τίτλο', back: 'Όλα τα email', subject: 'Θέμα email', subjectPlaceholder: 'Κάτι που αξίζει να ανοίξεις…',
    preheader: 'Κείμενο προεπισκόπησης', preheaderPlaceholder: 'Μια σύντομη εισαγωγή για τα εισερχόμενα', body: 'Το μήνυμά σου', bodyPlaceholder: 'Πες στην παρέα σου τι έρχεται…',
    save: 'Αποθήκευση', saved: 'Το πρόχειρο αποθηκεύτηκε.', failed: 'Η αποθήκευση απέτυχε. Δοκίμασε ξανά.',
    preview: 'Προεπισκόπηση', edit: 'Επεξεργασία', audience: 'Παραλήπτες', audienceBody: 'Weekplore Newsletter · Όλοι οι ενεργοί συνδρομητές',
    test: 'Δοκιμαστική αποστολή', send: 'Αποστολή τώρα', schedule: 'Προγραμματισμός αποστολής', scheduleDate: 'Ημερομηνία και ώρα αποστολής', timezone: 'Ώρα Αθήνας (Europe/Athens)', scheduleAction: 'Προγραμματισμός email', unavailable: 'Θα είναι διαθέσιμο όταν συνδεθεί η αποστολή.',
    noSubscribers: 'Η παρέα σου θα εμφανιστεί εδώ', noSubscribersBody: 'Οι συνδρομητές θα φορτώνονται από το Supabase όταν συνδεθεί αυτή η ενότητα. Δεν εμφανίζονται στοιχεία συνδρομητών στην προεπισκόπηση.',
    email: 'Email', source: 'Πηγή εγγραφής', date: 'Ημερομηνία εγγραφής', status: 'Κατάσταση', unknown: 'Δεν έχει συνδεθεί',
    footer: 'Λαμβάνεις αυτό το email επειδή γράφτηκες στο newsletter της Weekplore.', unsubscribe: 'Διαγραφή', required: 'Πρόσθεσε θέμα και μήνυμα πριν την αποθήκευση.',
    previewLabel: 'Προεπισκόπηση email', updated: 'Ενημερώθηκε',
  },
};

export default function Newsletter() {
  const { language } = useLanguage();
  const c = copy[language === 'gr' ? 'gr' : 'en'];
  const [imageUploading, setImageUploading] = useState(false);
  const uploadNewsletterImage = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error(language === 'gr' ? 'Επίλεξε JPG, PNG ή WebP.' : 'Choose a JPG, PNG, or WebP image.');
    setImageUploading(true);
    try {
    const prepared = await prepareImageForUpload(file);
    if (prepared.file.size > 5 * 1024 * 1024) throw new Error(language === 'gr' ? 'Η εικόνα πρέπει να είναι κάτω από 5 MB.' : 'Image must be under 5 MB after resizing.');
    const headers = await authHeaders();
    const response = await fetch(buildApiUrl('/api/admin/newsletter/images'), { method: 'POST', headers: { Authorization: headers.Authorization, 'Content-Type': prepared.file.type }, body: prepared.file });
    if (!response.ok) {
      if (response.status === 404) throw new Error(language === 'gr' ? 'Η μεταφόρτωση δεν είναι διαθέσιμη σε αυτή την έκδοση του server. Κάνε επανεκκίνηση του τοπικού backend ή ενημέρωσε το deployment.' : 'Image uploads are unavailable on this server version. Restart the local backend or update the deployment.');
      throw new Error(await getErrorMessage(response, language === 'gr' ? 'Η μεταφόρτωση εικόνας απέτυχε.' : 'Image upload failed.'));
    }
    return (await response.json()).url as string;
    } finally { setImageUploading(false); }
  };
  const [tab, setTab] = useState<'campaigns' | 'subscribers'>('campaigns');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [sendNotice, setSendNotice] = useState('');
  const [emailFilter, setEmailFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [canceling, setCanceling] = useState(false);
  const filters = [
    { id: 'all', label: language === 'gr' ? 'Όλα' : 'All' },
    { id: 'draft', label: language === 'gr' ? 'Πρόχειρα' : 'Drafts' },
    { id: 'scheduled', label: language === 'gr' ? 'Προγραμματισμένα' : 'Scheduled' },
    { id: 'pending', label: language === 'gr' ? 'Σε αναμονή' : 'Pending' },
    { id: 'sent', label: language === 'gr' ? 'Απεσταλμένα' : 'Sent' },
    { id: 'canceled', label: language === 'gr' ? 'Ακυρωμένα' : 'Canceled' },
    { id: 'failed', label: language === 'gr' ? 'Αποτυχίες' : 'Failed' },
  ];
  const inFilter = (item: Draft, filter: string) => filter === 'all' || (filter === 'pending' ? ['queued', 'sending'].includes(item.status || '') : (item.status || 'draft') === filter);
  const filteredDrafts = drafts.filter(item => inFilter(item, emailFilter) && item.subject.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const formatAthens = (iso: string) => new Date(iso).toLocaleString(language === 'gr' ? 'el-GR' : 'en-GB', { timeZone: 'Europe/Athens', dateStyle: 'medium', timeStyle: 'short' });
  const statusLabel = (status = 'draft') => language === 'gr' ? ({ draft: 'Πρόχειρο', scheduled: 'Προγραμματισμένο', queued: 'Σε αναμονή', sending: 'Σε επεξεργασία', sent: 'Στάλθηκε', canceled: 'Ακυρώθηκε', failed: 'Απέτυχε' } as Record<string, string>)[status] || status : status.charAt(0).toUpperCase() + status.slice(1);
  const cancelSchedule = async () => {
    if (!draft || canceling || !window.confirm(language === 'gr' ? `Να ακυρωθεί η προγραμματισμένη αποστολή «${draft.subject}»;` : `Cancel scheduled sending of “${draft.subject}”?`)) return;
    setCanceling(true); setSendNotice('');
    try {
      const response = await fetch(buildApiUrl(`/api/admin/newsletter/drafts/${draft.id}/cancel`), { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ confirmed: true }) });
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Cancellation failed'));
      const updated = fromRow(await response.json());
      setDraft(updated); setDrafts(prev => prev.map(item => item.id === updated.id ? updated : item));
      setSendNotice(language === 'gr' ? 'Η προγραμματισμένη αποστολή ακυρώθηκε.' : 'Scheduled sending canceled.');
    } catch (error) { setSendNotice(error instanceof Error ? error.message : 'Cancellation failed'); }
    finally { setCanceling(false); }
  };
  const [testRecipient, setTestRecipient] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testNotice, setTestNotice] = useState('');
  const sendTest = async () => {
    if (!draft || testSending) return;
    setTestSending(true); setTestNotice('');
    try {
      const response = await fetch(buildApiUrl('/api/admin/newsletter/send-test'), {
        method: 'POST', headers: await authHeaders(),
        body: JSON.stringify({ recipient: testRecipient, subject: draft.subject, preview_text: draft.preheader, body_html: draft.body }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response, language === 'gr' ? 'Η αποστολή απέτυχε.' : 'Test sending failed.'));
      setTestNotice(language === 'gr' ? 'Η υπηρεσία email δέχτηκε τη δοκιμαστική αποστολή. Έλεγξε τα εισερχόμενα και τα ανεπιθύμητα.' : 'The email service accepted the test email. Check your inbox and spam folder.');
    } catch (error) { setTestNotice(error instanceof Error ? error.message : 'Test sending failed.'); }
    finally { setTestSending(false); }
  };
  const fromRow = (row: any): Draft => ({ id: row.id, subject: row.subject || '', preheader: row.preview_text || '', body: row.body_html || '', updatedAt: row.updated_at, status: row.status || 'draft', scheduledIso: row.scheudled_at || undefined, sentAt: row.sent_at || undefined });
  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Admin login required');
    return { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' };
  };
  useEffect(() => {
    const controller = new AbortController();
    setLoadingDrafts(true); setLoadError(false);
    (async () => {
      try {
        const response = await fetch(buildApiUrl('/api/admin/newsletter/drafts'), { headers: await authHeaders(), signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Load failed');
        const rows = await response.json();
        if (!Array.isArray(rows)) throw new Error('Invalid drafts');
        if (!controller.signal.aborted) setDrafts(rows.map(fromRow));
      } catch { if (!controller.signal.aborted) setLoadError(true); }
      finally { if (!controller.signal.aborted) setLoadingDrafts(false); }
    })();
    return () => controller.abort();
  }, [reload]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [preview, setPreview] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<'now' | 'later'>('now');
  const [notice, setNotice] = useState<'saved' | 'failed' | 'required' | ''>('');


  const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-text px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold';
  const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-border bg-white px-5 py-3 text-sm text-brand-text hover:bg-brand-bg';
  const input = 'mt-2 w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20';
  const open = (value: Draft) => { setDraft(value); setNotice(''); setPreview(false); setTestNotice(''); setSendNotice(''); setDeliveryMode(value.scheduledAt ? 'later' : 'now'); };
  const save = async () => {
    if (!draft || saving) return;
    if (!draft.subject.trim() || (!draft.body.replace(/<[^>]*>/g, '').trim() && !/<img\b/i.test(draft.body))) { setNotice('required'); return; }
    setSaving(true); setNotice('');
    try {
      const response = await fetch(buildApiUrl(`/api/admin/newsletter/drafts/${draft.id}`), {
        method: 'PUT', headers: await authHeaders(),
        body: JSON.stringify({ subject: draft.subject, preview_text: draft.preheader, body_html: draft.body }),
      });
      if (!response.ok) throw new Error('Save failed');
      const updated = fromRow(await response.json());
      setDrafts(prev => [updated, ...prev.filter(d => d.id !== updated.id)]);
      setDraft(prev => prev?.id === updated.id ? { ...updated, scheduledAt: prev.scheduledAt } : prev);
      setNotice('saved');
      return updated;
    } catch { setNotice('failed'); }
    finally { setSaving(false); }
  };
  const dispatch = async () => {
    if (!draft || dispatching || saving) return;
    const when = deliveryMode === 'later' ? `${draft.scheduledAt || ''} (Europe/Athens)` : (language === 'gr' ? 'τώρα' : 'now');
    if (!window.confirm(language === 'gr' ? `Αποστολή «${draft.subject}» σε όλους τους ενεργούς συνδρομητές του Weekplore Newsletter ${when};` : `Send “${draft.subject}” to all subscribed contacts in Weekplore Newsletter ${when}?`)) return;
    setDispatching(true); setSendNotice('');
    try {
      const saved = await save();
      if (!saved) return;
      const response = await fetch(buildApiUrl(`/api/admin/newsletter/drafts/${draft.id}/send`), {
        method: 'POST', headers: await authHeaders(), body: JSON.stringify({ confirmed: true, scheduledAt: deliveryMode === 'later' ? draft.scheduledAt : null }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Check Resend before retrying.'));
      const row = await response.json();
      setDraft(fromRow(row)); setPreview(true); setReload(n => n + 1);
      setSendNotice(language === 'gr' ? 'Το email υποβλήθηκε στο Resend.' : 'Email submitted to Resend.');
    } catch (error) { setSendNotice(error instanceof Error ? error.message : 'Sending failed'); setReload(n => n + 1); }
    finally { setDispatching(false); }
  };


  return <section className="mx-auto w-full max-w-6xl text-brand-text">
    <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
      <div><h1 className="serif-font text-4xl font-bold sm:text-5xl">{c.title}</h1></div>
      {!draft && tab === 'campaigns' && <button className={primary} onClick={() => open({ id: crypto.randomUUID(), subject: '', preheader: '', body: '', updatedAt: '' })}><Plus size={17} />{c.new}</button>}
    </header>
    <nav aria-label={c.title} className="mb-8 flex gap-6 border-b border-brand-border">
      {(['campaigns', 'subscribers'] as const).map(value => <button key={value} aria-current={tab === value ? 'page' : undefined} onClick={() => setTab(value)} className={`min-h-12 border-b-2 px-1 pb-3 text-sm transition-colors ${tab === value ? 'border-brand-gold font-bold text-brand-text' : 'border-transparent text-brand-text/50 hover:text-brand-text'}`}>{c[value]}</button>)}
    </nav>
    {tab === 'campaigns' && !draft && <div className="mb-6 space-y-4">
      <div className="flex flex-wrap gap-2" aria-label={language === 'gr' ? 'Κατάσταση email' : 'Email status'}>{filters.map(filter => <button key={filter.id} aria-pressed={emailFilter === filter.id} onClick={() => setEmailFilter(filter.id)} className={`min-h-10 rounded-full border px-4 py-2 text-xs transition-colors ${emailFilter === filter.id ? 'border-brand-text bg-brand-text text-white' : 'border-brand-border bg-white text-brand-text/70 hover:border-brand-gold'}`}>{filter.label} <span className="ml-1 opacity-60">{drafts.filter(item => inFilter(item, filter.id)).length}</span></button>)}</div>
      <div className="flex flex-wrap items-center gap-3"><input type="search" value={search} onChange={e => setSearch(e.target.value)} aria-label={language === 'gr' ? 'Αναζήτηση email' : 'Search emails'} placeholder={language === 'gr' ? 'Αναζήτηση θέματος…' : 'Search by subject…'} className="min-w-0 flex-1 rounded-xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:border-brand-gold" /><button className={secondary} disabled={loadingDrafts} onClick={() => setReload(n => n + 1)}>{language === 'gr' ? 'Ανανέωση' : 'Refresh'}</button></div>
    </div>}
    {tab === 'subscribers' ? <NewsletterSubscribers /> : draft ? <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><button className="flex min-h-11 items-center gap-2 text-sm text-brand-text/60" onClick={() => { setDraft(null); setNotice(''); }}><ArrowLeft size={16} />{c.back}</button><div className="flex flex-wrap gap-2"><button className={secondary} onClick={() => setPreview(!preview)}><Eye size={16} />{preview ? c.edit : c.preview}</button><button className={`${primary} disabled:opacity-50`} disabled={imageUploading || saving || dispatching || (!!draft.status && draft.status !== 'draft')} onClick={save}><Save size={16} />{c.save}</button></div></div>
      <p role="status" className="mb-3 text-sm">{notice ? c[notice] : ''}</p>{draft.status && draft.status !== 'draft' && <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-border bg-white p-5"><div><span className="text-sm font-semibold">{statusLabel(draft.status)}</span>{draft.scheduledIso && <p className="mt-2 text-sm text-brand-text/65">{formatAthens(draft.scheduledIso)} · {language === 'gr' ? 'Ώρα Αθήνας' : 'Athens time'}</p>}</div>{draft.status === 'scheduled' && <button disabled={canceling} onClick={cancelSchedule} className={`${secondary} disabled:opacity-40`}>{canceling ? '…' : language === 'gr' ? 'Ακύρωση αποστολής' : 'Cancel scheduled send'}</button>}</div>}
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_280px]">
        {(preview || (!!draft.status && draft.status !== 'draft')) ? <div aria-label={c.previewLabel} className="overflow-hidden rounded-3xl border border-brand-border bg-white">
          <div className="border-b border-brand-border px-6 py-4"><p className="font-semibold">{draft.subject || c.untitled}</p><p className="mt-1 text-xs text-brand-text/50">{draft.preheader}</p></div>
          <div className="px-6 py-10 sm:px-10"><p className="serif-font mb-8 text-3xl italic">Weekplore.</p><RichTextContent value={draft.body} /><div className="mt-12 border-t border-brand-border pt-5 text-center text-[11px] text-brand-text/50"><p>{c.footer}</p><span className="mt-2 inline-block underline">{c.unsubscribe}</span></div></div>
        </div> : <div className="space-y-6 rounded-3xl border border-brand-border bg-white p-6 sm:p-8">
          <label className="block text-sm font-medium">{c.subject}<input className={input} maxLength={200} value={draft.subject} onChange={e => { setDraft({ ...draft, subject: e.target.value }); setNotice(''); }} /></label>
          <label className="block text-sm font-medium">{c.preheader}<input className={input} maxLength={250} value={draft.preheader} onChange={e => { setDraft({ ...draft, preheader: e.target.value }); setNotice(''); }} /></label>
          <div><p className="mb-3 text-sm font-medium">{c.body}</p><RichTextEditor onImageUpload={uploadNewsletterImage} imageLabel={language === 'gr' ? 'Εισαγωγή εικόνας' : 'Insert image'} value={draft.body} onChange={body => { setDraft({ ...draft, body }); setNotice(''); }} placeholder="" minHeight={300} /></div>
        </div>}
        <aside className="space-y-5"><div className="space-y-3 rounded-3xl border border-brand-border bg-white p-6"><h2 className="mb-4 text-base font-semibold">{language === 'gr' ? 'Δοκιμαστική αποστολή' : 'Test send'}</h2><label className="block text-xs font-medium">{language === 'gr' ? 'Email δοκιμαστικής αποστολής' : 'Test recipient'}<input type="email" className={input} value={testRecipient} onChange={e => setTestRecipient(e.target.value)} placeholder="you@example.com" maxLength={254} /></label><button onClick={sendTest} disabled={imageUploading || testSending || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testRecipient.trim()) || !draft.subject.trim() || (!draft.body.replace(/<[^>]*>/g, '').trim() && !/<img\b/i.test(draft.body))} className={`${secondary} w-full disabled:opacity-40 disabled:cursor-not-allowed`}><Mail size={16} />{testSending ? (language === 'gr' ? 'Αποστολή…' : 'Sending…') : c.test}</button><p role="status" className="text-xs leading-relaxed">{testNotice}</p></div><div className="rounded-3xl border border-brand-gold/30 bg-brand-gold/5 p-6"><h2 className="mb-5 text-base font-semibold">{language === 'gr' ? 'Κανονική αποστολή' : 'Newsletter send'}</h2><h3 className="mb-3 text-sm font-semibold">{c.audience}</h3><p className="mb-6 text-sm leading-relaxed text-brand-text/60">{c.audienceBody}</p><div className="space-y-3"><fieldset disabled={dispatching || (!!draft.status && draft.status !== 'draft')} className="space-y-3 border-t border-brand-border pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="newsletter-delivery" checked={deliveryMode === 'now'} onChange={() => { setDeliveryMode('now'); setDraft({ ...draft, scheduledAt: '' }); }} className="accent-[#4b3d2e]" />{c.send}</label>
          <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="newsletter-delivery" checked={deliveryMode === 'later'} onChange={() => setDeliveryMode('later')} className="accent-[#4b3d2e]" />{c.schedule}</label>
          {deliveryMode === 'later' && <label className="block text-xs font-medium">{c.scheduleDate}<input type="datetime-local" className={`${input} min-w-0`} value={draft.scheduledAt || ''} onChange={e => { setDraft({ ...draft, scheduledAt: e.target.value }); setNotice(''); }} /><span className="mt-2 block text-xs font-normal text-brand-text/60">{c.timezone}</span></label>}
        </fieldset>
        <button onClick={dispatch} disabled={imageUploading || dispatching || saving || (!!draft.status && draft.status !== 'draft') || !draft.subject.trim() || !draft.body.trim() || (deliveryMode === 'later' && !draft.scheduledAt)} className={`${primary} w-full disabled:opacity-40 disabled:cursor-not-allowed`}><Send size={16} />{deliveryMode === 'later' ? c.scheduleAction : c.send}</button><p role="status" className="text-xs leading-relaxed text-brand-text/70">{sendNotice}</p></div></div></aside>
      </div>
    </> : loadingDrafts ? <p role="status">{language === 'gr' ? 'Φόρτωση…' : 'Loading…'}</p> : loadError ? <div role="alert"><p>{language === 'gr' ? 'Η φόρτωση απέτυχε.' : 'Could not load drafts.'}</p><button className={secondary} onClick={() => setReload(n => n + 1)}>{language === 'gr' ? 'Δοκίμασε ξανά' : 'Try again'}</button></div> : filteredDrafts.length ? <div className="space-y-3">{filteredDrafts.map(item => <button key={item.id} onClick={() => open(item)} className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-border bg-white p-6 text-left transition-colors hover:border-brand-gold"><div><h2 className="font-semibold">{item.subject || c.untitled}</h2><p className="mt-2 text-xs text-brand-text/50">{(item.status === 'sent' && item.sentAt) ? `${formatAthens(item.sentAt)} · ${language === 'gr' ? 'Ώρα Αθήνας' : 'Athens time'}` : item.scheduledIso ? `${formatAthens(item.scheduledIso)} · ${language === 'gr' ? 'Ώρα Αθήνας' : 'Athens time'}` : `${c.updated} ${formatAthens(item.updatedAt)}`}</p></div><span className="rounded-full bg-brand-gold/10 px-3 py-1 text-xs text-brand-text">{statusLabel(item.status)}</span></button>)}</div> : <div className="rounded-3xl border border-brand-border bg-white px-6 py-16 text-center">{drafts.length > 0 && <p className="mb-5 text-sm text-brand-text/60">{language === 'gr' ? 'Δεν υπάρχουν email σε αυτή την προβολή.' : 'No emails match this view.'}</p>}<button className={primary} onClick={() => open({ id: crypto.randomUUID(), subject: '', preheader: '', body: '', updatedAt: '' })}><Plus size={16} />{c.new}</button></div>}
  </section>;
}
