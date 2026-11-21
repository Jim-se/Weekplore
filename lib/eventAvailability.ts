import type { WeekploreEvent } from '../types';

export const isEventSoldOut = (event: WeekploreEvent) => event.is_sold_out || !(event.shifts || []).some(
  shift => shift.is_active !== false && !['canceled', 'cancelled', 'archived'].includes(shift.status || '') &&
    !shift.is_full && shift.booked_spots < shift.capacity
);
