import React, { useEffect, useId, useRef, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import type { WeekploreEvent } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import { eventService } from '../services/eventService';

export default function NotifyMeModal({ event, onClose }: { event: WeekploreEvent; onClose: () => void }) {
  const { language, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [error, setError] = useState('');
  const headingId = useId();
  const emailId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const gr = language === 'gr';

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key !== 'Tab') return;
      const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]') || []);
      const first = items[0], last = items[items.length - 1];
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const result = await eventService.subscribeEventNotifications(event.id, email, gr ? 'el' : 'en');
      setAlreadySubscribed(result.alreadySubscribed === true);
      setSuccess(true);
    } catch {
      setError(gr ? 'Η εγγραφή δεν ολοκληρώθηκε. Δοκιμάστε ξανά σε λίγο.' : 'We couldn’t save your alert. Please try again shortly.');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-text/60 p-4 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={headingId} className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[28px] bg-brand-bg p-6 shadow-2xl sm:p-9">
        <button type="button" onClick={onClose} aria-label={gr ? 'Κλείσιμο' : 'Close'} className="absolute right-3 top-3 rounded-full p-3 text-brand-text/60 hover:bg-brand-text/5 focus-visible:outline-2"><X size={20} /></button>
        {success ? <Check className="mb-5 h-8 w-8 text-brand-gold" /> : <Bell className="mb-5 h-8 w-8 text-brand-gold" />}
        <h2 id={headingId} className="pr-6 text-3xl font-bold serif-font">{success ? (alreadySubscribed ? (gr ? 'Είστε ήδη στη λίστα!' : 'You’re already on the list!') : (gr ? 'Είστε στη λίστα!' : 'You’re on the list!')) : t('common.notifyMe')}</h2>
        <p className="mt-3 font-bold text-brand-text">{event.title}</p>
        {success ? <>
          <p role="status" className="mt-4 text-sm leading-relaxed text-brand-text/70">{gr ? 'Θα σας στείλουμε email όταν ελευθερωθούν θέσεις σε κάποια ώρα της εκδήλωσης. Οι θέσεις δεν δεσμεύονται.' : 'We’ll email you when places open up in any time slot for this event. Places aren’t reserved.'}</p>
          <button autoFocus type="button" onClick={onClose} className="mt-6 min-h-11 w-full rounded-full bg-brand-text py-3 font-bold text-brand-bg">{gr ? 'Έγινε' : 'Done'}</button>
        </> : <form onSubmit={submit} className="mt-4">
          <p className="mb-6 text-sm leading-relaxed text-brand-text/70">{gr ? 'Η εκδήλωση είναι πλήρης. Αφήστε το email σας για να ειδοποιηθείτε όταν ελευθερωθούν θέσεις.' : 'This event is sold out. Leave your email and we’ll let you know when places open up in any time slot.'}</p>
          <label htmlFor={emailId} className="mb-2 block text-sm font-bold">Email</label>
          <input id={emailId} name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className="min-h-12 w-full rounded-xl border border-brand-border bg-white px-4 text-base focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30" placeholder="you@example.com" />
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="mt-5 min-h-12 w-full rounded-full bg-brand-text px-4 py-3 text-sm font-bold text-brand-bg transition-colors hover:bg-brand-gold disabled:opacity-60">{busy ? (gr ? 'Εγγραφή…' : 'Saving…') : t('common.notifyMe')}</button>
          <p className="mt-4 text-xs leading-relaxed text-brand-text/60">{gr ? 'Θα λαμβάνετε ειδοποιήσεις μόνο για αυτή την εκδήλωση. Δεν γίνεται κράτηση. Μπορείτε να σταματήσετε τις ειδοποιήσεις από τον σύνδεσμο σε κάθε email.' : 'Alerts are only for this event and don’t reserve a place. You can stop alerts using the link in any email.'}</p>
        </form>}
      </div>
    </div>
  );
}
