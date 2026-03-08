
/**
 * Parses various time formats into HH:mm (24-hour) format.
 * Supported formats:
 * - 10:15
 * - 10.15 (treat . as :)
 * - 1015 (=> 10:15)
 * - 18 (=> 18:00)
 * - 18:0 (=> 18:00)
 * - 8pm / 8 pm (=> 20:00)
 * - 8:30pm (=> 20:30)
 * 
 * Returns null if the time is invalid.
 */
export const parseTime = (input: string): string | null => {
  let clean = input.toLowerCase().trim();
  if (!clean) return null;

  // Handle AM/PM
  let isPM = clean.includes('pm');
  let isAM = clean.includes('am');
  clean = clean.replace(/(am|pm)/g, '').trim();

  // Replace . with :
  clean = clean.replace('.', ':');

  let hours = 0;
  let minutes = 0;

  if (clean.includes(':')) {
    const parts = clean.split(':');
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1] || '0', 10);
  } else {
    // No colon
    if (clean.length <= 2) {
      hours = parseInt(clean, 10);
      minutes = 0;
    } else if (clean.length === 3) {
      hours = parseInt(clean.slice(0, 1), 10);
      minutes = parseInt(clean.slice(1), 10);
    } else if (clean.length === 4) {
      hours = parseInt(clean.slice(0, 2), 10);
      minutes = parseInt(clean.slice(2), 10);
    } else {
      return null;
    }
  }

  if (isNaN(hours) || isNaN(minutes)) return null;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Extracts HH:mm from an ISO datetime string (YYYY-MM-DDTHH:mm).
 */
export const getTimeFromISO = (iso: string | null | undefined): string => {
  if (!iso) return '';
  try {
    const parts = iso.split('T');
    if (parts.length < 2) return '';
    return parts[1].slice(0, 5);
  } catch (e) {
    return '';
  }
};

/**
 * Validates an ISO datetime string.
 */
export const isValidISODatetime = (iso: string): boolean => {
  if (!iso.includes('T')) return false;
  const [date, time] = iso.split('T');
  if (!date || !time) return false;
  
  // Validate date (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  
  // Validate time (HH:mm)
  if (!/^\d{2}:\d{2}$/.test(time.slice(0, 5))) return false;
  
  const [h, m] = time.slice(0, 5).split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return false;
  
  return true;
};
