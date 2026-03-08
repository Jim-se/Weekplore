
import React, { useState, useEffect } from 'react';
import { WeekploreEvent, BookingFormData } from '../types';
import BookingModal from '../components/BookingModal';
import MessageDisplay from '../components/MessageDisplay';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Calendar, Clock } from 'lucide-react';
import { eventService } from '../services/eventService';

interface EventDetailProps {
  slug: string;
  onNavigate: (page: string) => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ slug, onNavigate }) => {
  const [event, setEvent] = useState<WeekploreEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (message && message.type === 'success') {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000); // 5 sec to give them time to read the success message
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await eventService.getEventBySlug(slug);
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  const gallery = event?.images?.map(img => img.image_url) || [event?.cover_image_url || ''];

  useEffect(() => {
    if (gallery.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [gallery.length]);

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!event) return;
    try {
      await eventService.createBooking(event.id, data);
      setMessage({ type: 'success', text: `Thank you ${data.fullName}! Your reservation for ${event.title} is confirmed.` });
      setIsBookingModalOpen(false);
    } catch (error) {
      console.error('Booking error:', error);
      setMessage({ type: 'error', text: 'There was an error processing your booking. Please try again.' });
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Event not found</h2>
        <button onClick={() => onNavigate('events')} className="text-brand-gold font-bold uppercase tracking-widest">Back to Collection</button>
      </div>
    );
  }

  const availableShifts = event.shifts?.filter(s => !s.is_full && s.booked_spots < s.capacity) || [];
  const isSoldOut = event.is_sold_out || availableShifts.length === 0;

  return (
    <>
      <MessageDisplay message={message} setMessage={setMessage} />
      <div className="min-h-screen bg-brand-bg pb-20">
        {/* Hero Carousel Section */}
        <section className="relative h-[70vh] md:h-[85vh] w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <img
                src={gallery[currentImageIndex]}
                alt={`${event.title} - ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Dark Overlay for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-text/80 via-brand-text/20 to-transparent"></div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {gallery.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-4 md:px-10 z-20">
              <button
                onClick={prevImage}
                className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-20 z-10">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                {/* <span className="inline-block bg-brand-gold text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] rounded-full mb-6">
                {event.category || 'Experience'}
              </span> */}
                <h1 className="text-5xl md:text-8xl font-bold serif-font leading-[0.9] text-white tracking-tighter max-w-4xl">
                  {event.title}
                </h1>
                <div className="flex items-center gap-6 mt-8 text-white/80">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-gold" />
                    <span className="text-xs uppercase tracking-widest font-bold">{event.location_name}</span>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-gold" />
                    <span className="text-xs uppercase tracking-widest font-bold">
                      {(() => {
                        const d = new Date(event.event_date);
                        return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
                      })()}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Image Indicators */}
          {gallery.length > 1 && (
            <div className="absolute bottom-8 right-8 flex gap-2 z-20">
              {gallery.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`h-1 transition-all duration-500 rounded-full ${currentImageIndex === idx ? 'w-8 bg-brand-gold' : 'w-2 bg-white/30'
                    }`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-6 mt-16 md:mt-24">
          <div className="grid lg:grid-cols-12 gap-16 md:gap-24">
            {/* Left Column: Description & Details */}
            <div className="lg:col-span-7 space-y-16">
              <section>
                {/* <h2 className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-gold mb-6">The Experience</h2> */}
                <p className="text-2xl md:text-3xl font-light leading-relaxed text-brand-text/80 serif-font italic">
                  {event.full_description || event.short_description}
                </p>
              </section>

              <section className="grid md:grid-cols-2 gap-12 pt-12 border-t border-brand-border">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-brand-terracotta">
                    <Clock className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Booking Deadline</span>
                  </div>
                  <p className="text-xl font-medium text-brand-text">
                    {(() => {
                      const d = new Date(event.booking_deadline);
                      return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                    })()}
                  </p>
                  <p className="text-xs text-brand-text/40 leading-relaxed">
                    Reservations must be finalized by this date to ensure availability and logistical arrangements.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-brand-gold">
                    <MapPin className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Meeting Point</span>
                  </div>
                  <p className="text-xl font-medium text-brand-text">{event.location_name}</p>
                  <p className="text-xs text-brand-text/40 leading-relaxed">
                    {event.location_address || 'Detailed directions will be sent upon confirmation.'}
                  </p>
                </div>
              </section>
            </div>

            {/* Right Column: Booking Card */}
            <div className="lg:col-span-5">
              <div className="sticky top-32 bg-white rounded-[40px] p-10 shadow-2xl border border-brand-border">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-1">Price per person</p>
                    <div className="text-4xl font-bold serif-font text-brand-text">€{event.price}</div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-1">Availability</p>
                    <div className="text-xs font-bold text-brand-terracotta uppercase tracking-widest">
                      {isSoldOut ? 'Sold Out' : 'Limited Spots'}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 mb-10">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-4">Available Shifts</p>
                    <div className="grid grid-cols-1 gap-3">
                      {event.shifts?.map(shift => {
                        const isFull = shift.is_full || shift.booked_spots >= shift.capacity;
                        const timeStr = (() => {
                          const start = new Date(shift.start_time);
                          const end = new Date(shift.end_time);
                          if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid Time';
                          return `${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
                        })();
                        return (
                          <div
                            key={shift.id}
                            className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${isFull
                                ? 'opacity-30 border-gray-100 bg-gray-50 line-through'
                                : 'border-brand-border bg-brand-bg/30 text-brand-text'
                              }`}
                          >
                            <span className="text-xs font-bold tracking-widest uppercase">{timeStr}</span>
                            {!isFull && <span className="text-[9px] font-bold text-brand-gold uppercase tracking-widest">Available</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  disabled={isSoldOut}
                  onClick={() => setIsBookingModalOpen(true)}
                  className={`w-full py-6 rounded-full text-xs font-bold uppercase tracking-[0.4em] shadow-xl transition-all active:scale-[0.98] ${isSoldOut
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-brand-text text-brand-bg hover:bg-brand-gold hover:shadow-brand-gold/20'
                    }`}
                >
                  {isSoldOut ? 'Sold Out' : 'Reserve Now'}
                </button>

                <p className="text-center text-[9px] text-brand-text/30 uppercase tracking-widest mt-6 font-bold">
                  Secure checkout • Instant confirmation
                </p>
              </div>
            </div>
          </div>
        </div>

        {isBookingModalOpen && (
          <BookingModal
            event={event}
            onClose={() => setIsBookingModalOpen(false)}
            onSubmit={handleBookingSubmit}
          />
        )}
      </div>
    </>
  );
};

export default EventDetail;
