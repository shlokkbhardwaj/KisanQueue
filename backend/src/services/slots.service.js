import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { minutesToTime, normalizeTime, timeToMinutes } from '../utils/validate.js';

const DEFAULT_OPEN = '09:00';
const DEFAULT_CLOSE = '17:00';

/** Current date (YYYY-MM-DD) and minutes-since-midnight in the configured time zone. */
export function nowInZone(now = new Date(), timeZone = env.timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute)
  };
}

export function addDaysISO(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function to24h(hourText, minuteText, meridiem) {
  let h = Number(hourText);
  const m = Number(minuteText || 0);
  if (meridiem) {
    const pm = /p/i.test(meridiem);
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
  }
  return normalizeTime(`${h}:${String(m).padStart(2, '0')}`);
}

/**
 * Reads the free-text `mandis.operating_hours` column ("08:00-18:00", "8:00 AM - 6:00 PM").
 * If it cannot be understood, a default window is returned and flagged as `assumed`.
 */
export function parseOperatingHours(text) {
  const re = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const m = re.exec(String(text || ''));
  if (m) {
    const open = to24h(m[1], m[2], m[3]);
    const close = to24h(m[4], m[5], m[6] || (m[3] && Number(m[4]) < Number(m[1]) ? 'pm' : m[3]));
    if (open && close && timeToMinutes(close) > timeToMinutes(open)) {
      return { open, close, assumed: false };
    }
  }
  return { open: DEFAULT_OPEN, close: DEFAULT_CLOSE, assumed: true };
}

export function generateSlots(hours, slotMinutes = env.slotMinutes) {
  const slots = [];
  const end = timeToMinutes(hours.close);
  for (let start = timeToMinutes(hours.open); start + slotMinutes <= end; start += slotMinutes) {
    slots.push({ start: minutesToTime(start), end: minutesToTime(start + slotMinutes) });
  }
  return slots;
}

export function slotStatus(booked, capacity) {
  if (booked >= capacity) return 'full';
  if (booked >= Math.ceil(capacity * 0.8)) return 'almost';
  return 'available';
}

/** Real number of (non-cancelled) bookings per slot start time for one centre and date. */
export async function getBookedCountsBySlot(mandiId, date) {
  const { data, error } = await supabase
    .from('bookings')
    .select('slot_start, status')
    .eq('mandi_id', mandiId)
    .eq('booking_date', date);
  if (error) throw error;

  const counts = new Map();
  for (const row of data || []) {
    if (row.status === 'CANCELLED') continue;
    const key = String(row.slot_start || '').slice(0, 5);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

/** Slots for one centre and date with real booked counts. */
export async function getSlotAvailability(mandi, date) {
  const hours = parseOperatingHours(mandi.operating_hours);
  const generated = generateSlots(hours);
  const counts = await getBookedCountsBySlot(mandi.id, date);
  const now = nowInZone();

  const slots = generated.map((slot) => {
    const booked = counts.get(slot.start) || 0;
    const past = date < now.date || (date === now.date && timeToMinutes(slot.start) <= now.minutes);
    const status = past ? 'past' : slotStatus(booked, env.slotCapacity);
    return {
      ...slot,
      booked,
      capacity: env.slotCapacity,
      remaining: Math.max(0, env.slotCapacity - booked),
      status
    };
  });

  return { hours, slots };
}
