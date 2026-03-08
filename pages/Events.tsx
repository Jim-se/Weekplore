
import React, { useState, useEffect } from 'react';
import { WeekploreEvent, BookingFormData } from '../types';
import BookingModal from '../components/BookingModal';
import EventCard from '../components/EventCard';
import MessageDisplay from '../components/MessageDisplay';
import { eventService } from '../services/eventService';

const Events: React.FC = () => {
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
      setMessage({ type: 'success', text: `Thank you ${data.fullName}! Your reservation for ${selectedEvent.title} is confirmed.` });
      setSelectedEvent(null);
    } catch (error) {
      console.error('Booking error:', error);
      setMessage({ type: 'error', text: 'There was an error processing your booking. Please try again.' });
    }
  };

  const handleInfo = (event: WeekploreEvent) => {
    window.location.hash = `event/${event.slug}`;
  };

  return (
    <>
      <MessageDisplay message={message} setMessage={setMessage} />
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-14 pb-20 min-h-screen">
        <header className="mb-13 md:mb-20 text-center">
          <div className="flex justify-center mb-1">
            <svg className="w-10 h-10 text-brand-gold" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-8xl font-bold serif-font mb-6 italic tracking-tight">Upcoming Events</h1>
          {/* <p className="text-xl opacity-60 font-light max-w-2xl mx-auto">Thoughtfully designed experiences for the discerning traveler. Limited availability per shift.</p> */}

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
          <div className="grid grid-cols-1 md:grid-cols-2 min-[1200px]:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
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
      </div>
    </>
  );
};

export default Events;
