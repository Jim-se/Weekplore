
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
      setMessage({ type: 'success', text: `Ευχαριστούμε ${data.fullName}! Η κράτησή σας για το ${event.title} επιβεβαιώθηκε.` });
      setIsBookingModalOpen(false);
    } catch (error) {
      console.error('Booking error:', error);
      setMessage({ type: 'error', text: 'Υπήρξε ένα σφάλμα κατά την επεξεργασία της κράτησής σας. Παρακαλώ δοκιμάστε ξανά.' });
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
        <h2 className="text-2xl font-bold mb-4">Η εκδήλωση δεν βρέθηκε</h2>
        <button onClick={() => onNavigate('events')} className="text-brand-gold font-bold uppercase tracking-widest">Επιστροφή στη Συλλογή</button>
      </div>
    );
  }

  const availableShifts = event.shifts?.filter(s => !s.is_full && s.booked_spots < s.capacity) || [];
  const isSoldOut = event.is_sold_out || availableShifts.length === 0;

  return (
    <>
      <MessageDisplay message={message} setMessage={setMessage} />
      <div className="event-detail-page min-h-screen bg-brand-bg pb-16 sm:pb-20">
        {/* Hero Carousel Section */}
        <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden sm:h-[70vh] md:h-[85vh]">
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
            <div className="absolute inset-0 z-20 flex items-center justify-between px-3 sm:px-4 md:px-10">
              <button
                onClick={prevImage}
                className="rounded-full border border-white/20 bg-white/10 p-2.5 text-white transition-all hover:bg-white/20 sm:p-3"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="rounded-full border border-white/20 bg-white/10 p-2.5 text-white transition-all hover:bg-white/20 sm:p-3"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 z-10 w-full p-4 sm:p-6 md:p-20">
            <div className="mx-auto max-w-7xl">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                {/* <span className="inline-block bg-brand-gold text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] rounded-full mb-6">
                {event.category || 'Experience'}
              </span> */}
                <h1 className="max-w-4xl text-4xl font-bold leading-[0.95] tracking-tight text-white serif-font sm:text-5xl md:text-8xl md:tracking-tighter">
                  {event.title}
                </h1>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-white/80 sm:mt-8 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-gold" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] sm:text-xs sm:tracking-widest">{event.location_name}</span>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-gold" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] sm:text-xs sm:tracking-widest">
                      {(() => {
                        const d = new Date(event.event_date);
                        return isNaN(d.getTime()) ? 'Μη έγκυρη ημερομηνία' : d.toLocaleDateString('el-GR', { day: 'numeric', month: 'long' });
                      })()}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Image Indicators */}
          {gallery.length > 1 && (
            <div className="absolute bottom-4 right-4 z-20 flex gap-2 sm:bottom-8 sm:right-8">
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
        <div className="mx-auto mt-12 max-w-7xl px-4 sm:mt-16 sm:px-6 md:mt-24">
          <div className="grid gap-10 md:gap-24 lg:grid-cols-12 lg:gap-16">
            {/* Left Column: Description & Details */}
            <div className="space-y-10 sm:space-y-16 lg:col-span-7">
              <section>
                {/* <h2 className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-gold mb-6">The Experience</h2> */}
                <p className="text-xl font-light leading-relaxed text-brand-text/80 serif-font italic sm:text-2xl md:text-3xl">
                  {event.full_description || event.short_description}
                </p>
              </section>

              <section className="grid gap-8 border-t border-brand-border pt-8 sm:gap-12 sm:pt-12 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-brand-terracotta">
                    <Clock className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Προθεσμία Κράτησης</span>
                  </div>
                  <p className="text-xl font-medium text-brand-text">
                    {(() => {
                      const d = new Date(event.booking_deadline);
                      return isNaN(d.getTime()) ? 'Μη έγκυρη ημερομηνία' : d.toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });
                    })()}
                  </p>
                  <p className="text-xs text-brand-text/40 leading-relaxed">
                    Οι κρατήσεις πρέπει να ολοκληρωθούν μέχρι αυτή την ημερομηνία για να διασφαλιστεί η διαθεσιμότητα.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-brand-gold">
                    <MapPin className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Σημείο Συνάντησης</span>
                  </div>
                  <p className="text-xl font-medium text-brand-text">{event.location_name}</p>
                  <p className="text-xs text-brand-text/40 leading-relaxed">
                    {event.location_address || 'Λεπτομερείς οδηγίες θα σταλούν μετά την επιβεβαίωση.'}
                  </p>
                </div>
              </section>
            </div>

            {/* Right Column: Booking Card */}
            <div className="lg:col-span-5">
              <div className="rounded-[28px] border border-brand-border bg-white p-6 shadow-2xl sm:rounded-[40px] sm:p-8 lg:sticky lg:top-32 lg:p-10">
                <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8 sm:items-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-1">Τιμή ανά άτομο</p>
                    <div className="text-4xl font-bold serif-font text-brand-text">€{event.price}</div>
                  </div>
                  <div>
                    {/* Availability line removed */}
                  </div>
                </div>

                <div className="mb-8 space-y-6 sm:mb-10">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-4">Διαθέσιμες Ώρες</p>
                    <div className="grid grid-cols-1 gap-3">
                      {event.shifts?.map(shift => {
                        const isFull = shift.is_full || shift.booked_spots >= shift.capacity;
                        const timeStr = (() => {
                          const start = new Date(shift.start_time);
                          const end = new Date(shift.end_time);
                          if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Μη έγκυρη ώρα';
                          return `${start.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}`;
                        })();
                        return (
                          <div
                            key={shift.id}
                            className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${isFull
                              ? 'opacity-30 border-gray-100 bg-gray-50 line-through'
                              : 'border-brand-border bg-brand-bg/30 text-brand-text'
                              }`}
                          >
                            <span className="text-[11px] font-bold uppercase tracking-[0.22em] sm:text-xs sm:tracking-widest">{timeStr}</span>
                            {!isFull && <span className="text-[9px] font-bold text-brand-gold uppercase tracking-widest">Διαθέσιμο</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  disabled={isSoldOut}
                  onClick={() => setIsBookingModalOpen(true)}
                  className={`w-full min-h-11 rounded-full py-4 text-[11px] font-bold uppercase tracking-[0.28em] shadow-xl transition-all active:scale-[0.98] sm:py-6 sm:text-xs sm:tracking-[0.4em] ${isSoldOut
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-brand-text text-brand-bg hover:bg-brand-gold hover:shadow-brand-gold/20'
                    }`}
                >
                  {isSoldOut ? 'Εξαντλήθηκε' : 'Κάνε Κράτηση'}
                </button>

                <p className="mt-5 text-center text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text/30 sm:mt-6 sm:tracking-widest">
                  Ασφαλής πληρωμή • Άμεση επιβεβαίωση
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
