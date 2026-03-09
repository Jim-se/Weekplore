import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import MessageDisplay from '../components/MessageDisplay';
import { PrivateEvent } from '../types';
import { eventService } from '../services/eventService';

const CREATE_YOUR_OWN_ENTRY: PrivateEvent = {
  id: 'create-your-own',
  created_at: '',
  name: 'Create your own',
  description: 'Tell us what you want to organize and we will shape a private experience around your group, timing, and vibe.',
  image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80'
};

const PrivateEventsView: React.FC = () => {
  const [privateEvents, setPrivateEvents] = useState<PrivateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchPrivateEvents = async () => {
      try {
        const data = await eventService.getPrivateEvents();
        setPrivateEvents(data);
      } catch (error) {
        console.error('Error fetching private events:', error);
        setMessage({ type: 'error', text: 'Could not load private events right now.' });
      } finally {
        setLoading(false);
      }
    };

    fetchPrivateEvents();
  }, []);

  const entries = useMemo(() => [CREATE_YOUR_OWN_ENTRY, ...privateEvents], [privateEvents]);

  return (
    <>
      <MessageDisplay message={message} setMessage={setMessage} />
      <div className="private-events-page mx-auto min-h-screen max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
        <header className="mb-12 text-center md:mb-20">
          <div className="mb-1 flex justify-center">
            <svg className="h-10 w-10 text-brand-gold" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
            </svg>
          </div>
          <h1 className="mb-6 text-5xl font-bold italic tracking-tight serif-font md:text-8xl">Private Events</h1>
          <p className="mx-auto max-w-2xl text-sm text-brand-text/60 sm:text-base">
            Browse private-event formats the same way you browse normal events. Start with a custom request or choose one of the admin-managed entries below.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-brand-gold"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 md:gap-10 lg:gap-12 min-[1200px]:grid-cols-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="group mx-auto flex h-full w-full max-w-[450px] flex-col overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-sm transition-all duration-500 hover:shadow-2xl sm:rounded-[40px]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={entry.image_url || CREATE_YOUR_OWN_ENTRY.image_url || ''}
                    alt={entry.name}
                    className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-4 right-4 rounded-2xl bg-brand-text px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-bg shadow-xl sm:bottom-6 sm:right-6 sm:px-5">
                    Private
                  </div>
                </div>

                <div className="flex flex-grow flex-col p-5 sm:p-6 md:p-8">
                  <div className="mb-4">
                    <h3 className="text-xl font-serif font-bold leading-tight text-brand-text transition-colors group-hover:text-brand-terracotta md:text-2xl">
                      {entry.name}
                    </h3>
                  </div>

                  <p className="mb-8 text-sm leading-relaxed text-brand-text/60">
                    {entry.description || 'Custom private event details will be added here by the admin.'}
                  </p>

                  <div className="mt-auto">
                    <a
                      href="mailto:events@weekplore.com?subject=Private%20Event%20Request"
                      className="flex min-h-11 items-center justify-center gap-3 rounded-full bg-brand-text px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-bg shadow-lg transition-all hover:bg-brand-gold"
                    >
                      Contact us <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <style>{`
          @media (max-width: 640px) {
            .private-events-page h1 {
              font-size: 2.75rem;
              line-height: 0.95;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default PrivateEventsView;
