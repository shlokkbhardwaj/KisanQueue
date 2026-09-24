import { supabase } from '../config/supabase.js';
import { notifyFarmer } from '../services/notification.service.js';
import { addDaysISO, getSlotAvailability, nowInZone } from '../services/slots.service.js';
import {
  httpError, isISODate, normalizeTime, toPositiveInt, toPositiveNumber
} from '../utils/validate.js';

const MAX_QUANTITY_QUINTALS = 10000;
const MAX_DAYS_AHEAD = 30;

/** PostgREST returns a one-to-one embed as an object and a one-to-many embed as an array. */
function firstOf(value) {
  return Array.isArray(value) ? (value[0] || null) : (value || null);
}

/** Flattens the embedded queue token onto `token` and hides the raw embed. */
function withToken(row) {
  if (!row) return row;
  const { queue_tokens: embedded, ...rest } = row;
  return { ...rest, token: firstOf(embedded) };
}

const BOOKING_WITH_DETAILS = `
  *,
  crops(id, name, unit),
  mandis(id, name, address, district, state, operating_hours, contact),
  queue_tokens(id, token_number, status, counter_id, created_at, called_at, completed_at)
`;

/* --------------------------------------------------------------- create */

export async function createBooking(req, res) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const farmerId = req.auth.farmerId;
  const body = req.body || {};

  // The farmer comes from the login session, never from the request body.
  if (body.farmerId !== undefined && Number(body.farmerId) !== farmerId) {
    throw httpError(403, 'You can only create bookings for your own account.');
  }

  const mandiId = toPositiveInt(body.mandiId);
  const cropId = toPositiveInt(body.cropId);
  const quantity = toPositiveNumber(body.quantityQuintals);
  const bookingDate = body.bookingDate;
  const slotStart = normalizeTime(body.slotStart);
  const slotEnd = normalizeTime(body.slotEnd);

  if (!mandiId || !cropId || !quantity || !isISODate(bookingDate) || !slotStart || !slotEnd) {
    return res.status(400).json({
      success: false,
      error: 'mandiId, cropId, quantityQuintals, bookingDate (YYYY-MM-DD), slotStart and slotEnd (HH:MM) are required.'
    });
  }
  if (quantity > MAX_QUANTITY_QUINTALS) {
    return res.status(400).json({ success: false, error: `Quantity must be at most ${MAX_QUANTITY_QUINTALS} quintals.` });
  }

  const today = nowInZone().date;
  if (bookingDate < today) {
    return res.status(400).json({ success: false, error: 'Booking date cannot be in the past.' });
  }
  if (bookingDate > addDaysISO(today, MAX_DAYS_AHEAD)) {
    return res.status(400).json({ success: false, error: `Bookings can only be made up to ${MAX_DAYS_AHEAD} days ahead.` });
  }

  // Centre must exist and be active.
  const { data: mandi, error: mandiError } = await supabase
    .from('mandis').select('id, name, status, operating_hours').eq('id', mandiId).maybeSingle();
  if (mandiError) throw mandiError;
  if (!mandi || mandi.status !== 'ACTIVE') {
    return res.status(404).json({ success: false, error: 'This procurement centre was not found or is not active.' });
  }

  // Centre must accept this crop (real data from mandi_crop_acceptance).
  const { data: acceptance, error: acceptanceError } = await supabase
    .from('mandi_crop_acceptance').select('id')
    .eq('mandi_id', mandiId).eq('crop_id', cropId).eq('accepted', true).maybeSingle();
  if (acceptanceError) throw acceptanceError;
  if (!acceptance) {
    return res.status(422).json({ success: false, error: 'This centre does not accept the selected crop.' });
  }

  // The slot must be one the centre actually offers, still in the future, and not full.
  const { slots } = await getSlotAvailability(mandi, bookingDate);
  const slot = slots.find((s) => s.start === slotStart && s.end === slotEnd);
  if (!slot) {
    return res.status(400).json({ success: false, error: 'This time slot is not offered by the selected centre.' });
  }
  if (slot.status === 'past') {
    return res.status(400).json({ success: false, error: 'This time slot has already started. Please choose a later slot.' });
  }

  // Do not create the same booking twice (double click, retry, two tabs).
  const findExisting = async () => {
    const { data, error } = await supabase
      .from('bookings').select('*')
      .eq('farmer_id', farmerId).eq('mandi_id', mandiId).eq('crop_id', cropId)
      .eq('booking_date', bookingDate);
    if (error) throw error;
    return (data || []).find((b) => b.status !== 'CANCELLED' && String(b.slot_start).slice(0, 5) === slotStart) || null;
  };

  const duplicate = await findExisting();
  if (duplicate) return res.json({ success: true, data: duplicate, existing: true });

  if (slot.status === 'full') {
    return res.status(409).json({ success: false, error: 'This time slot is full. Please choose another slot.', code: 'SLOT_FULL' });
  }

  const { data, error } = await supabase.from('bookings').insert({
    farmer_id: farmerId,
    mandi_id: mandiId,
    crop_id: cropId,
    quantity_quintals: quantity,
    booking_date: bookingDate,
    slot_start: slotStart,
    slot_end: slotEnd,
    status: 'BOOKED'
  }).select('*').single();

  if (error) {
    if (error.code === '23505') { // unique index caught a race between two identical requests
      const raced = await findExisting();
      if (raced) return res.json({ success: true, data: raced, existing: true });
    }
    throw error;
  }
  await notifyFarmer(farmerId, {
    type: 'BOOKING',
    title: 'Slot confirmed',
    message: `Your booking at ${mandi.name} on ${bookingDate}, ${slotStart}\u2013${slotEnd} is confirmed.`
  });
  res.status(201).json({ success: true, data, existing: false });
}

/* ------------------------------------------------------------------ read */

export async function getBooking(req, res) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const bookingId = toPositiveInt(req.params.id);
  if (!bookingId) return res.status(400).json({ success: false, error: 'Valid booking id is required.' });

  const { data, error } = await supabase
    .from('bookings').select(BOOKING_WITH_DETAILS).eq('id', bookingId).maybeSingle();
  if (error) throw error;

  // Someone else's booking looks exactly like a missing one (no id enumeration).
  if (!data || Number(data.farmer_id) !== req.auth.farmerId) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }
  res.json({ success: true, data: withToken(data) });
}

export async function listMyBookings(req, res) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('bookings').select(BOOKING_WITH_DETAILS)
    .eq('farmer_id', req.auth.farmerId)
    .order('booking_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;

  res.json({ success: true, data: (data || []).map(withToken) });
}

/* ---------------------------------------------------------------- cancel */

export async function cancelBooking(req, res) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const bookingId = toPositiveInt(req.params.id);
  if (!bookingId) return res.status(400).json({ success: false, error: 'Valid booking id is required.' });

  const { data: booking, error } = await supabase
    .from('bookings').select('id, farmer_id, status').eq('id', bookingId).maybeSingle();
  if (error) throw error;
  if (!booking || Number(booking.farmer_id) !== req.auth.farmerId) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }
  if (booking.status === 'CANCELLED') return res.json({ success: true, data: booking, existing: true });
  if (booking.status !== 'BOOKED') {
    return res.status(409).json({ success: false, error: 'This booking can no longer be cancelled because it is already in progress.' });
  }

  const { data: token, error: tokenError } = await supabase
    .from('queue_tokens').select('id, status').eq('booking_id', bookingId).maybeSingle();
  if (tokenError) throw tokenError;
  if (token && token.status !== 'WAITING') {
    return res.status(409).json({ success: false, error: 'Your token has already been called, so it cannot be cancelled online.' });
  }

  const { data: updated, error: updateError } = await supabase
    .from('bookings').update({ status: 'CANCELLED' }).eq('id', bookingId).select('*').single();
  if (updateError) throw updateError;
  if (token) {
    const { error: tokenUpdateError } = await supabase.from('queue_tokens').update({ status: 'CANCELLED' }).eq('id', token.id);
    if (tokenUpdateError) throw tokenUpdateError;
  }
  res.json({ success: true, data: updated });
}
