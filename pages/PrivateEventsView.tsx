import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import MessageDisplay from '../components/MessageDisplay';
import { PrivateEvent, PrivateEventInquiryFormData } from '../types';
import { eventService } from '../services/eventService';
import PrivateEventInquiryForm from '../components/PrivateEventInquiryForm';

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

  const [selectedEventForInquiry, setSelectedEventForInquiry] = useState<{
    eventName: string;
    isCustom: boolean;
    templateId?: string | null;
  } | null>(null);

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

  const handleInquirySubmit = async (data: PrivateEventInquiryFormData) => {
    await eventService.submitPrivateEventInquiry(data);
    setSelectedEventForInquiry(null);
    setMessage({ type: 'success', text: 'Thank you for your inquiry! We will contact you very soon with the price.' });
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
          <h1 className="mb-6 text-5xl font-bold italic tracking-tight serif-font md:text-8xl">Private Events</h1>
          <p className="mx-auto max-w-2xl text-sm text-brand-text/80 sm:text-base space-y-2">
            <span>Θέλεις να διοργανώσεις ένα ιδιωτικό event; Δημιούργησε το δικό σου ή εμπνεύσου από κάποια από τις ιδέες μας.</span><br /><br />
            <span>Η ομάδα μας θα εξετάσει προσεκτικά όλα τα στοιχεία που θα μας δώσεις και θα επανέλθει με προτάσεις ειδικά για εσένα, τις οποίες θα σου παρουσιάσουμε μέσω κλήσης.</span><br /><br />
            <span>Στόχος μας είναι να σχεδιάσουμε μαζί τη μέρα σου ακριβώς όπως τη φαντάστηκες – με κάθε λεπτομέρεια να αποτυπώνει την προσωπική σου αισθητική και όσα έχεις ονειρευτεί.</span>
          </p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-brand-gold"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-10 lg:gap-12 w-full">
            {/* Other Admin-Managed Events */}
            {privateEvents.length > 0 && (
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
                          Inquire <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Separator "OR" */}
            {privateEvents.length > 0 && (
              <div className="flex w-full shrink-0 items-center justify-center py-2 md:py-4 px-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-text/40 italic">or</span>
              </div>
            )}

            {/* Create Your Own Entry */}
            <div className="group flex w-full max-w-[400px] flex-col overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-sm transition-all duration-500 hover:shadow-2xl sm:rounded-[40px]">
              {/* Image successfully removed for Bespoke event */}
              <div className="flex flex-grow flex-col p-5 sm:p-6 md:p-8 justify-center">
                <div className="mb-4">
                  <span className="mb-6 inline-block rounded-full bg-brand-gold/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                    Custom
                  </span>
                  <h3 className="text-2xl font-serif font-bold leading-tight text-brand-text transition-colors md:text-3xl">
                    {CREATE_YOUR_OWN_ENTRY.name}
                  </h3>
                </div>

                <p className="mb-8 text-sm leading-relaxed text-brand-text/80 shrink-0">
                  {CREATE_YOUR_OWN_ENTRY.description}
                </p>

                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedEventForInquiry({
                      eventName: CREATE_YOUR_OWN_ENTRY.name,
                      isCustom: true
                    })}
                    className="flex min-h-11 w-[150px] sm:w-[180px] items-center justify-center gap-3 rounded-full bg-brand-text px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-all hover:bg-brand-gold"
                  >
                    Inquire <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
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
