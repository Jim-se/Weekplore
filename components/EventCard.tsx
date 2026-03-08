
import React from 'react';
import { WeekploreEvent } from '../types';

interface EventCardProps {
  event: WeekploreEvent;
  onBook: (event: WeekploreEvent) => void;
  onInfo?: (event: WeekploreEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onBook, onInfo }) => {
  const availableShifts = event.shifts?.filter(s => !s.is_full && s.booked_spots < s.capacity) || [];
  const isSoldOut = event.is_sold_out || availableShifts.length === 0;

  return (
    <div className="group bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-brand-border flex flex-col h-full max-w-[450px] mx-auto w-full">
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img 
          src={event.cover_image_url} 
          alt={event.title} 
          className={`w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 ${event.is_sold_out ? 'grayscale opacity-60' : ''}`}
        />
        {/* <div className="absolute top-6 left-6">
          <span className="bg-brand-bg/90 backdrop-blur-sm text-brand-text px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">
            {event.category || 'Experience'}
          </span>
        </div> */}
        {event.is_sold_out && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-terracotta/20 backdrop-blur-[2px]">
            <div className="bg-brand-terracotta text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-[0.4em] text-sm shadow-2xl rotate-[-5deg] border-2 border-white/20">
              Sold Out
            </div>
          </div>
        )}
        <div className="absolute bottom-6 right-6 bg-brand-text text-brand-bg px-5 py-2 rounded-2xl font-bold shadow-xl">
          €{event.price}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 flex-grow flex flex-col">
        <div className="mb-4">
           <h3 className="text-xl md:text-2xl font-serif font-bold text-brand-text leading-tight group-hover:text-brand-terracotta transition-colors">
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
                return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
              })()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-brand-terracotta font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[11px] uppercase tracking-wider">
              Deadline: {(() => {
                const d = new Date(event.booking_deadline);
                return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString('en-GB');
              })()}
            </span>
          </div>
        </div>

        {/* Shifts Section - Always Visible */}
        <div className="mb-8">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-text/40 mb-4">Available Shifts</p>
          <div className="flex flex-wrap gap-2">
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
                  className={`text-[10px] px-4 py-2 rounded-xl border transition-all ${
                    isFull 
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
        <div className="mt-auto grid grid-cols-3 gap-4">
          <button 
            onClick={() => onInfo?.(event)}
            className="col-span-1 border border-brand-text text-brand-text py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-text hover:text-brand-bg transition-all duration-300"
          >
            Info
          </button>
          <button 
            disabled={isSoldOut}
            onClick={() => onBook(event)}
            className={`col-span-2 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${
              isSoldOut 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-brand-text text-brand-bg hover:bg-brand-gold hover:shadow-brand-gold/20'
            }`}
          >
            {isSoldOut ? 'Sold Out' : 'Reserve Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
