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
              <div className="group flex w-full max-w-[400px] flex-col overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-sm transition-all duration-500 hover:shadow-2xl sm:rounded-[40px]">
                <div className="relative aspect-[16/10] shrink-0 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80"
                    alt="Custom Event"
                    className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                  />
                </div>

                <div className="flex flex-grow flex-col p-5 sm:p-6 md:p-8">
                  <div className="mb-4">
                    <h3 className="text-xl font-serif font-bold leading-tight text-brand-text transition-colors group-hover:text-brand-terracotta md:text-2xl">
                      {createYourOwnEntry.name}
                    </h3>
                  </div>

                  <p className="mb-8 text-sm leading-relaxed text-brand-text/60">
                    {createYourOwnEntry.description}
                  </p>

                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedEventForInquiry({
                        eventName: createYourOwnEntry.name,
                        isCustom: true
                      })}
                      className="flex min-h-11 w-full items-center justify-center gap-3 rounded-full bg-brand-text px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-bg shadow-lg transition-all hover:bg-brand-gold"
                    >
                      {t('private.inquire', { stripAccents: true })} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Ready Set Up Events Card */}
              <div className="group flex w-full max-w-[400px] flex-col overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-sm transition-all duration-500 hover:shadow-2xl sm:rounded-[40px]">
                <div className="relative aspect-[16/10] shrink-0 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&q=80"
                    alt="Ready Events"
                    className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                  />
                  <div className="absolute bottom-4 right-4 rounded-2xl bg-brand-text px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-bg shadow-xl sm:bottom-6 sm:right-6 sm:px-5">
                    {t('private.existingLabel', { stripAccents: true })}
                  </div>
                </div>

                <div className="flex flex-grow flex-col p-5 sm:p-6 md:p-8">
                  <div className="mb-4">
                    <h3 className="text-xl font-serif font-bold leading-tight text-brand-text transition-colors group-hover:text-brand-terracotta md:text-2xl">
                      {t('private.existingLabel')}
                    </h3>
                  </div>

                  <p className="mb-8 text-sm leading-relaxed text-brand-text/60">
                    {t('private.existingDesc')}
                  </p>

                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      onClick={scrollToSetupEvents}
                      className="flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-brand-text bg-white px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text shadow-sm transition-all hover:bg-brand-text hover:text-white"
                    >
                      {t('private.seeExisting', { stripAccents: true })} <ArrowRight className="h-4 w-4 rotate-90" />
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
              <div className="flex flex-col w-full items-center justify-center gap-10 md:flex-row md:flex-wrap md:items-stretch lg:gap-12">
                {privateEvents.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex w-full max-w-[400px] flex-col overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-sm transition-all duration-500 hover:shadow-2xl sm:rounded-[40px]"
                  >
                    <div className="relative aspect-[16/10] shrink-0 overflow-hidden">
                      <img
                        src={entry.image_url || ''}
                        alt={entry.name}
                        className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-4 right-4 rounded-2xl bg-brand-text px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-bg shadow-xl sm:bottom-6 sm:right-6 sm:px-5">
                        {t('private.privateLabel', { stripAccents: true })}
                      </div>
                    </div>

                    <div className="flex flex-grow flex-col p-5 sm:p-6 md:p-8">
                      <div className="mb-4">
                        <h3 className="text-xl font-serif font-bold leading-tight text-brand-text transition-colors group-hover:text-brand-terracotta md:text-2xl">
                          {entry.name}
                        </h3>
                      </div>

                      <p className="mb-8 text-sm leading-relaxed text-brand-text/60">
                        {entry.description || t('private.placeholderDesc')}
                      </p>

                      <div className="mt-auto pt-4">
                        <button
                          type="button"
                          onClick={() => setSelectedEventForInquiry({
                            eventName: entry.name,
                            isCustom: false,
                            templateId: entry.id
                          })}
                          className="flex min-h-11 w-[150px] sm:w-[180px] items-center justify-center gap-3 rounded-full bg-brand-text px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-bg shadow-lg transition-all hover:bg-brand-gold"
                        >
                          {t('private.inquire', { stripAccents: true })} <ArrowRight className="h-4 w-4" />
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
