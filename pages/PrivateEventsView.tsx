import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import MessageDisplay from '../components/MessageDisplay';
import { PrivateEvent, PrivateEventInquiryFormData } from '../types';
import { eventService } from '../services/eventService';
import PrivateEventInquiryForm from '../components/PrivateEventInquiryForm';
import { useLanguage } from '../lib/LanguageContext';

const PrivateEventsView: React.FC = () => {
  const { t } = useLanguage();
  const [privateEvents, setPrivateEvents] = useState<PrivateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [selectedEventForInquiry, setSelectedEventForInquiry] = useState<{
    eventName: string;
    isCustom: boolean;
    templateId?: string | null;
  } | null>(null);

  const createYourOwnEntry: PrivateEvent = useMemo(() => ({
    id: 'create-your-own',
    created_at: '',
    name: t('private.createYourOwn'),
    description: t('private.createYourOwnDesc'),
    image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80'
  }), [t]);

  useEffect(() => {
    const fetchPrivateEvents = async () => {
      try {
        const data = await eventService.getPrivateEvents();
        setPrivateEvents(data);
      } catch (error) {
        console.error('Error fetching private events:', error);
        setMessage({ type: 'error', text: t('private.loadError') });
      } finally {
        setLoading(false);
      }
    };

    fetchPrivateEvents();
  }, [t]);

  const handleInquirySubmit = async (data: PrivateEventInquiryFormData) => {
    await eventService.submitPrivateEventInquiry(data);
    setSelectedEventForInquiry(null);
    setMessage({ type: 'success', text: t('private.success') });
  };

  const setupEventsRef = React.useRef<HTMLDivElement>(null);

  const scrollToSetupEvents = () => {
    setupEventsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <MessageDisplay message={message} setMessage={setMessage} />

      {selectedEventForInquiry && (
        <PrivateEventInquiryForm
          eventName={selectedEventForInquiry.eventName}
          isCustom={selectedEventForInquiry.isCustom}
          templateId={selectedEventForInquiry.templateId}
          onClose={() => setSelectedEventForInquiry(null)}
          onSubmit={handleInquirySubmit}
        />
      )}
      <div className="private-events-page mx-auto min-h-screen max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
        <header className="mb-12 text-center md:mb-20">
          <div className="mb-1 flex justify-center">
            <svg className="h-10 w-10 text-brand-gold" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
            </svg>
          </div>
          <h1 className="mb-6 text-5xl font-bold italic tracking-tight serif-font md:text-8xl">{t('private.title')}</h1>
          <div className="mx-auto max-w-2xl text-sm text-brand-text/80 sm:text-base space-y-4">
            <p>{t('private.desc1')}</p>
            <p>{t('private.desc2')}</p>
            <p>{t('private.desc3')}</p>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-brand-gold"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-16 w-full">
            {/* Lead Cards: Bespoke & Setup */}
            <div className="flex flex-col w-full items-center justify-center gap-10 md:flex-row md:items-stretch lg:gap-14">
              {/* Bespoke / Custom */}
              <div 
                className="group relative isolate flex w-full max-w-[500px] flex-col overflow-hidden rounded-[40px] border border-brand-border bg-brand-text shadow-sm transition-all duration-500 hover:shadow-2xl sm:rounded-[60px] min-h-[500px]"
              >
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80"
                    alt="Custom Event"
                    className="h-full w-full object-cover opacity-40 transition-transform duration-[1.5s] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-text via-brand-text/50 to-transparent"></div>
                </div>

                <div className="relative z-10 flex flex-grow flex-col p-8 sm:p-10 md:p-12">
                  <div className="mb-auto">
                    <div className="mb-8 inline-block rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                      • {t('private.bespokeLabel', { defaultValue: 'BESPOKE' })}
                    </div>
                    
                    <h3 className="mb-6 text-4xl font-serif font-bold italic leading-tight text-white transition-colors group-hover:text-brand-gold md:text-5xl">
                      {createYourOwnEntry.name.split(' ').map((word, i) => (
                        <span key={i} className={i === 1 ? 'text-brand-gold block mt-2' : ''}>
                          {word}{' '}
                        </span>
                      ))}
                    </h3>

                    <p className="text-base leading-relaxed text-white/70 max-w-sm">
                      {createYourOwnEntry.description}
                    </p>
                  </div>

                  <div className="mt-12">
                    <button
                      type="button"
                      onClick={() => setSelectedEventForInquiry({
                        eventName: createYourOwnEntry.name,
                        isCustom: true
                      })}
                      className="flex min-h-14 w-full items-center justify-between rounded-full bg-brand-gold px-10 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-text shadow-xl transition-all hover:bg-white hover:scale-[1.02]"
                    >
                      {t('private.inquire', { stripAccents: true })} 
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Ready Set Up Events Card */}
              <div 
                className="group relative isolate flex w-full max-w-[500px] flex-col overflow-hidden rounded-[40px] border border-brand-border bg-brand-text shadow-sm transition-all duration-500 hover:shadow-2xl sm:rounded-[60px] min-h-[500px]"
              >
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src="https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&q=80"
                    alt="Ready Events"
                    className="h-full w-full object-cover opacity-40 transition-transform duration-[1.5s] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-text via-brand-text/50 to-transparent"></div>
                </div>

                <div className="relative z-10 flex flex-grow flex-col p-8 sm:p-10 md:p-12">
                  <div className="mb-auto">
                    <div className="mb-8 inline-block rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                      • {t('private.curatedLabel', { defaultValue: 'CURATED' })}
                    </div>

                    <h3 className="mb-6 text-4xl font-serif font-bold italic leading-tight text-white transition-colors group-hover:text-brand-gold md:text-5xl">
                      {t('private.existingLabel')}
                    </h3>

                    <p className="text-base leading-relaxed text-white/70 max-w-sm">
                      {t('private.existingDesc')}
                    </p>
                  </div>

                  <div className="mt-12">
                    <button
                      type="button"
                      onClick={scrollToSetupEvents}
                      className="flex min-h-14 w-full items-center justify-between rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-10 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-sm transition-all hover:bg-white hover:text-brand-text hover:scale-[1.02]"
                    >
                      {t('private.seeExisting', { stripAccents: true })} 
                      <ArrowRight className="h-5 w-5 rotate-90" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div ref={setupEventsRef} className="flex w-full items-center justify-center py-4">
              <div className="h-px flex-1 bg-brand-border/30"></div>
              <div className="px-6 text-2xl text-brand-gold">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
                </svg>
              </div>
              <div className="h-px flex-1 bg-brand-border/30"></div>
            </div>

            {/* Other Admin-Managed Events */}
            {privateEvents.length > 0 ? (
              <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 justify-items-center">
                {privateEvents.map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative isolate flex w-full max-w-[400px] flex-col overflow-hidden rounded-[32px] border border-brand-border bg-brand-text shadow-sm transition-all duration-500 hover:shadow-2xl sm:rounded-[40px] min-h-[450px]"
                  >
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src={entry.image_url || ''}
                        alt={entry.name}
                        className="h-full w-full object-cover opacity-40 transition-transform duration-[1.5s] group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-text via-brand-text/60 to-transparent"></div>
                    </div>

                    <div className="relative z-10 flex flex-grow flex-col p-6 sm:p-8">
                      <div className="mb-auto">
                        <div className="mb-4 inline-block rounded-full bg-brand-gold/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-gold border border-brand-gold/20">
                          {t('private.privateLabel', { stripAccents: true })}
                        </div>
                        <h3 className="text-2xl font-serif font-bold italic leading-tight text-white transition-colors group-hover:text-brand-gold">
                          {entry.name}
                        </h3>
                        <p className="mt-4 text-sm leading-relaxed text-white/60 line-clamp-4">
                          {entry.description || t('private.placeholderDesc')}
                        </p>
                      </div>

                      <div className="mt-8">
                        <button
                          type="button"
                          onClick={() => setSelectedEventForInquiry({
                            eventName: entry.name,
                            isCustom: false,
                            templateId: entry.id
                          })}
                          className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text shadow-lg transition-all hover:bg-brand-gold"
                        >
                          {t('private.inquire', { stripAccents: true })} 
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center opacity-40">
                <p className="italic">{t('private.noExisting')}</p>
              </div>
            )}
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
