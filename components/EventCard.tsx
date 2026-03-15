
import React from 'react';
import { WeekploreEvent } from '../types';
import { useLanguage } from '../lib/LanguageContext';

interface EventCardProps {
  event: WeekploreEvent;
  onBook: (event: WeekploreEvent) => void;
  onInfo?: (event: WeekploreEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onBook, onInfo }) => {
  const { language, t } = useLanguage();
  const bookableShifts = event.shifts?.filter(
    s => s.is_active !== false && s.status !== 'canceled' && s.status !== 'cancelled' && s.status !== 'archived'
  ) || [];
  const availableShifts = bookableShifts.filter(s => !s.is_full && s.booked_spots < s.capacity);
  const isSoldOut = event.is_sold_out || availableShifts.length === 0;
  
  const locale = language === 'gr' ? 'el-GR' : 'en-US';

  return (
    <div className="group mx-auto flex h-full w-full max-w-[450px] flex-col overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-sm transition-all duration-500 hover:shadow-2xl sm:rounded-[40px]">
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={event.cover_image_url}
          alt={event.title}
          className={`w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 ${event.is_sold_out ? 'grayscale opacity-60' : ''}`}
        />
        {event.is_sold_out && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-terracotta/20 backdrop-blur-[2px]">
            <div className="rotate-[-5deg] rounded-2xl border-2 border-white/20 bg-brand-terracotta px-5 py-2 text-xs font-bold uppercase tracking-[0.28em] text-white shadow-2xl sm:px-8 sm:py-3 sm:text-sm sm:tracking-[0.4em]">
              {t('common.soldOut', { stripAccents: true })}
            </div>
          </div>
        )}
        <div className="absolute bottom-4 right-4 rounded-2xl bg-brand-text px-4 py-2 text-sm font-bold text-brand-bg shadow-xl sm:bottom-6 sm:right-6 sm:px-5">
          €{event.price}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-grow flex-col p-5 sm:p-6 md:p-8">
        <div className="mb-4">
          <h3 className="text-xl font-serif font-bold leading-tight text-brand-text transition-colors group-hover:text-brand-terracotta md:text-2xl">
            {event.title}
          </h3>
        </div>

        <div className="flex flex-col gap-2 text-sm text-brand-text/60 mb-6">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">
              {(() => {
                const d = new Date(event.event_date);
                return isNaN(d.getTime()) ? t('common.invalidDate') : d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
              })()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-brand-terracotta font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[11px] uppercase tracking-wider">
              {t('common.deadline', { stripAccents: true })}: {(() => {
                const d = new Date(event.booking_deadline);
                return isNaN(d.getTime()) ? t('common.invalidDate') : d.toLocaleDateString(locale);
              })()}
            </span>
          </div>
        </div>

        {/* Shifts Section - Always Visible */}
        <div className="mb-6 sm:mb-8">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-text/40 mb-4">{t('common.availableShifts', { stripAccents: true })}</p>
          <div className="flex flex-wrap gap-2">
            {bookableShifts.map(shift => {
              const isFull = shift.is_full || shift.booked_spots >= shift.capacity;
              const timeStr = (() => {
                const start = new Date(shift.start_time);
                const end = new Date(shift.end_time);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) return t('common.invalidDate');
                return `${start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
              })();
              return (
                <div
                  key={shift.id}
                  className={`rounded-xl border px-3 py-2 text-[10px] transition-all sm:px-4 ${isFull
                    ? 'opacity-30 border-gray-200 bg-gray-50 line-through'
                    : 'border-brand-gold/20 bg-brand-bg text-brand-gold font-bold tracking-widest'
                    }`}
                >
                  {timeStr}
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-auto grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <button
            onClick={() => onInfo?.(event)}
            className="col-span-1 min-h-11 rounded-full border border-brand-text py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text transition-all duration-300 hover:bg-brand-text hover:text-brand-bg sm:py-4"
          >
            Info
          </button>
          <button
            disabled={isSoldOut}
            onClick={() => onBook(event)}
            className={`col-span-1 min-h-11 rounded-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 sm:col-span-2 sm:py-4 ${isSoldOut
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-brand-text text-brand-bg hover:bg-brand-gold hover:shadow-brand-gold/20'
              }`}
          >
            {isSoldOut ? t('common.soldOut', { stripAccents: true }) : t('common.bookNow', { stripAccents: true })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
