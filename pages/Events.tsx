
import React, { useState, useEffect } from 'react';
import { WeekploreEvent, BookingFormData } from '../types';
import BookingModal from '../components/BookingModal';
import EventCard from '../components/EventCard';
import MessageDisplay from '../components/MessageDisplay';
import { eventService } from '../services/eventService';
import { useLanguage } from '../lib/LanguageContext';

const Events: React.FC = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<WeekploreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<WeekploreEvent | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const categories = ['All', 'Outdoor', 'Creative', 'Social'];

  useEffect(() => {
    if (message && message.type === 'success') {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000); // 5 sec to give them time to read the success message
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getEvents();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = filter === 'All'
    ? events
    : events.filter(e => e.category === filter);

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!selectedEvent) return;
    try {
      await eventService.createBooking(selectedEvent.id, data);
      setMessage({ type: 'success', text: t('common.success', { name: data.fullName, title: selectedEvent.title }) });
      setSelectedEvent(null);
    } catch (error) {
      console.error('Booking error:', error);
      setMessage({ type: 'error', text: t('common.error') });
    }
  };

  const handleInfo = (event: WeekploreEvent) => {
    window.location.hash = `event/${event.slug}`;
  };

  return (
    <>
      <MessageDisplay message={message} setMessage={setMessage} />
      <div className="events-page mx-auto min-h-screen max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
        <header className="mb-12 text-center md:mb-20">
          <h1 className="text-5xl md:text-8xl font-bold serif-font mb-6 italic tracking-tight flex items-center justify-center gap-4">
            {t('events.title')}
            <svg className="w-8 h-8 md:w-16 md:h-16 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
            </svg>
          </h1>

          {/*  <div className="flex overflow-x-auto md:justify-center gap-3 md:gap-4 mt-12 pb-4 px-2 scrollbar-hide snap-x">
        {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 md:px-8 py-2.5 md:py-3 rounded-full border text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap snap-center ${
                filter === cat 
                  ? 'bg-brand-text text-brand-bg border-brand-text' 
                  : 'border-brand-border hover:border-brand-gold hover:text-brand-gold'
              }`}
            >
              {cat}
            </button>
          ))} 
        </div>*/}
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-gold"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 md:gap-10 lg:gap-12 min-[1200px]:grid-cols-3">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onBook={setSelectedEvent}
                onInfo={handleInfo}
              />
            ))}
          </div>
        )}

        {selectedEvent && (
          <BookingModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onSubmit={handleBookingSubmit}
          />
        )}
        <style>{`
          @media (max-width: 640px) {
            .events-page h1 {
              font-size: 2.75rem;
              line-height: 0.95;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default Events;
