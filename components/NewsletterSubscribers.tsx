import React, { useEffect, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '../lib/supabase';
import { buildApiUrl } from '../services/api';

interface Subscriber { id: string; email: string; source: string | null; created_at: string; consented_at: string | null; unsubscribed_at: string | null }
interface Result { subscribers: Subscriber[]; total: number; page: number; pageSize: number }

export default function NewsletterSubscribers() {
  const { language } = useLanguage();
  const gr = language === 'gr';
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false); setResult(null);
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');
        const response = await fetch(buildApiUrl(`/api/admin/newsletter/subscribers?page=${page}`), {
          headers: { Authorization: `Bearer ${session.access_token}` }, signal: controller.signal, cache: 'no-store',
        });
        if (!response.ok) throw new Error('Request failed');
        const data: Result = await response.json();
        if (!Array.isArray(data.subscribers)) throw new Error('Invalid response');
        if (!controller.signal.aborted) setResult(data);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [page, refresh]);
  const date = (value: string) => new Date(value).toLocaleDateString(gr ? 'el-GR' : 'en-GB', { timeZone: 'Europe/Athens' });
  const button = 'rounded-full border border-brand-border px-4 py-2 text-xs hover:bg-brand-bg disabled:opacity-40';
  return <div className="overflow-hidden rounded-3xl border border-brand-border bg-white" aria-busy={loading}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-6 py-5">
      <h2 className="font-semibold">{gr ? 'Συνδρομητές' : 'Subscribers'}{result ? ` (${result.total})` : ''}</h2>
      <button disabled={loading} className={button} onClick={() => setRefresh(n => n + 1)}>{gr ? 'Ανανέωση' : 'Refresh'}</button>
    </div>
    {loading ? <p role="status" className="p-10 text-center text-sm text-brand-text/60">{gr ? 'Φόρτωση συνδρομητών…' : 'Loading subscribers…'}</p>
      : error ? <div role="alert" className="space-y-4 p-10 text-center"><p className="text-sm">{gr ? 'Δεν ήταν δυνατή η φόρτωση των συνδρομητών.' : 'Could not load subscribers.'}</p><button className={button} onClick={() => setRefresh(n => n + 1)}>{gr ? 'Δοκίμασε ξανά' : 'Try again'}</button></div>
      : <><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm">
        <thead><tr>{['Email', gr ? 'Πηγή εγγραφής' : 'Signup source', gr ? 'Ημερομηνία εγγραφής' : 'Subscribed on', gr ? 'Κατάσταση' : 'Status'].map(label => <th key={label} className="px-6 py-4 text-xs font-medium text-brand-text/50">{label}</th>)}</tr></thead>
        <tbody>{result?.subscribers.length ? result.subscribers.map(row => <tr key={row.id} className="border-t border-brand-border/50">
          <td className="px-6 py-4">{row.email}</td>
          <td className="px-6 py-4 text-brand-text/65">{row.source === 'booking' ? (gr ? 'Κράτηση' : 'Booking') : row.source === 'website' ? (gr ? 'Ιστοσελίδα' : 'Website') : '—'}</td>
          <td className="px-6 py-4 text-brand-text/65">{date(row.consented_at || row.created_at)}</td>
          <td className="px-6 py-4"><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${row.unsubscribed_at ? 'bg-stone-100 text-stone-600' : 'bg-emerald-50 text-emerald-800'}`}>{row.unsubscribed_at ? (gr ? 'Έχει διαγραφεί' : 'Unsubscribed') : (gr ? 'Ενεργός' : 'Subscribed')}</span></td>
        </tr>) : <tr><td colSpan={4} className="p-12 text-center text-brand-text/60">{gr ? 'Δεν υπάρχουν συνδρομητές ακόμη.' : 'No subscribers yet.'}</td></tr>}</tbody>
      </table></div>
      {result && result.total > result.pageSize && <div className="flex items-center justify-between gap-4 border-t border-brand-border p-5"><button className={button} disabled={page === 1} onClick={() => setPage(p => p - 1)}>{gr ? 'Προηγούμενη' : 'Previous'}</button><span className="text-xs">{page} / {Math.ceil(result.total / result.pageSize)}</span><button className={button} disabled={page * result.pageSize >= result.total} onClick={() => setPage(p => p + 1)}>{gr ? 'Επόμενη' : 'Next'}</button></div>}
      </>}
  </div>;
}
