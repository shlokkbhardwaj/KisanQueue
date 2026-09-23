import { supabase } from '../config/supabase.js';
import { notifyFarmer } from '../services/notification.service.js';
import {
  getQueueSnapshot, positionInQueue, queueInfoForToken, summarizeQueue
} from '../services/queue.service.js';
import { nowInZone } from '../services/slots.service.js';
import { httpError, isISODate, toPositiveInt } from '../utils/validate.js';

const MAX_TOKEN_ATTEMPTS = 5;

async function loadOwnedBooking(bookingId, farmerId) {
  const { data, error } = await supabase
    .from('bookings').select('id, farmer_id, mandi_id, booking_date, status').eq('id', bookingId).maybeSingle();
  if (error) throw error;
  // Someone else's booking is reported exactly like a missing one.
  if (!data || Number(data.farmer_id) !== farmerId) return null;
  return data;
}

/* ------------------------------------------------------ POST /queue/token */

export async function issueToken(req, res) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const bookingId = toPositiveInt(req.body?.bookingId);
  if (!bookingId) return res.status(400).json({ success: false, error: 'bookingId is required.' });

  const booking = await loadOwnedBooking(bookingId, req.auth.farmerId);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
  if (booking.status === 'CANCELLED') {
    return res.status(409).json({ success: false, error: 'This booking was cancelled, so no token can be issued.' });
  }

  const findExisting = async () => {
    const { data, error } = await supabase.from('queue_tokens').select('*').eq('booking_id', bookingId).maybeSingle();
    if (error) throw error;
    return data;
  };

  // One booking = one token. Calling this again just returns the token that already exists.
  const existing = await findExisting();
  if (existing) return res.json({ success: true, data: existing, existing: true });

  for (let attempt = 1; attempt <= MAX_TOKEN_ATTEMPTS; attempt += 1) {
    const { data: last, error: lastError } = await supabase
      .from('queue_tokens').select('token_number').order('token_number', { ascending: false }).limit(1).maybeSingle();
    if (lastError) throw lastError;

    const { data, error } = await supabase.from('queue_tokens').insert({
      booking_id: bookingId,
      counter_id: req.body?.counterId ? String(req.body.counterId).slice(0, 20) : null,
      token_number: (Number(last?.token_number) || 0) + 1,
      status: 'WAITING'
    }).select('*').single();

    if (!error) {
      await notifyFarmer(req.auth.farmerId, {
        type: 'QUEUE',
        title: `Token #${data.token_number} issued`,
        message: 'Show this token at the centre. You can follow your position on the live queue page.'
      });
      return res.status(201).json({ success: true, data, existing: false });
    }

    if (error.code === '23505') {
      // Either another request just issued this booking's token, or two bookings raced for the
      // same number. Return the token if it now exists, otherwise try the next number.
      const raced = await findExisting();
      if (raced) return res.json({ success: true, data: raced, existing: true });
      continue;
    }
    throw error;
  }
  throw httpError(503, 'Could not generate a token right now. Please try again.');
}

/* ----------------------------------------------------- GET /queue/status */

export async function queueStatus(req, res) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const requestedBookingId = toPositiveInt(req.query.bookingId);
  let mandiId = toPositiveInt(req.query.mandiId);
  let date = req.query.date;
  let myBooking = null;

  if (req.query.date !== undefined && !isISODate(date)) {
    return res.status(400).json({ success: false, error: 'date must be YYYY-MM-DD.' });
  }

  if (requestedBookingId) {
    if (!req.auth) return res.status(401).json({ success: false, error: 'Please log in to continue.', code: 'AUTH_REQUIRED' });
    myBooking = await loadOwnedBooking(requestedBookingId, req.auth.farmerId);
    if (!myBooking) return res.status(404).json({ success: false, error: 'Booking not found' });
    mandiId = Number(myBooking.mandi_id);
    date = String(myBooking.booking_date).slice(0, 10);
  }

  date = date || nowInZone().date;

  // Legacy behaviour (no centre given): every waiting token, but only anonymous queue facts.
  if (!mandiId) {
    const { data: bookings, error } = await supabase
      .from('bookings').select('id, mandi_id, slot_start, status').eq('booking_date', date);
    if (error) throw error;
    const live = (bookings || []).filter((b) => b.status !== 'CANCELLED');
    const byId = new Map(live.map((b) => [Number(b.id), b]));
    let waiting = [];
    if (byId.size) {
      const { data: tokens, error: tokenError } = await supabase
        .from('queue_tokens').select('booking_id, token_number, status, counter_id, created_at')
        .in('booking_id', [...byId.keys()]).eq('status', 'WAITING');
      if (tokenError) throw tokenError;
      waiting = (tokens || []).map((t) => ({
        token_number: Number(t.token_number),
        status: t.status,
        counter_id: t.counter_id,
        mandi_id: byId.get(Number(t.booking_id))?.mandi_id ?? null,
        booking_date: date,
        slot_start: String(byId.get(Number(t.booking_id))?.slot_start || '').slice(0, 5) || null
      })).sort((a, b) => a.token_number - b.token_number);
    }
    return res.json({ success: true, data: waiting, summary: null, mine: null, date });
  }

  const { data: mandi, error: mandiError } = await supabase
    .from('mandis').select('id, name, address, district, state, operating_hours').eq('id', mandiId).maybeSingle();
  if (mandiError) throw mandiError;
  if (!mandi) return res.status(404).json({ success: false, error: 'Procurement centre not found.' });

  const snapshot = await getQueueSnapshot(mandiId, date);
  const summary = summarizeQueue(snapshot);
  const waiting = snapshot
    .filter((t) => t.status === 'WAITING')
    .sort((a, b) => a.token_number - b.token_number)
    .map((t) => ({
      token_number: t.token_number, status: t.status, counter_id: t.counter_id,
      mandi_id: mandiId, booking_date: date, slot_start: t.slot_start
    }));

  let mine = null;
  if (myBooking) {
    const mySnapshotToken = snapshot.find((t) => t.booking_id === Number(myBooking.id));
    if (mySnapshotToken) {
      const position = positionInQueue(snapshot, mySnapshotToken.token_number, summary.avgServiceMinutes);
      mine = {
        bookingId: Number(myBooking.id),
        tokenNumber: mySnapshotToken.token_number,
        slot_start: mySnapshotToken.slot_start,
        ...position
      };

      // Automated in-app turn alert. It is deliberately best-effort and deduplicated
      // so repeated live-queue polling does not flood the farmer's notifications.
      if (position.tokensAhead !== null && position.tokensAhead <= 2 && ['WAITING','CALLED','SERVING','HOLD'].includes(position.tokenStatus)) {
        const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: recentAlerts, error: alertError } = await supabase
          .from('notifications')
          .select('id')
          .eq('farmer_id', req.auth.farmerId)
          .eq('type', 'QUEUE_APPROACHING')
          .gte('created_at', since)
          .limit(1);
        if (!alertError && !(recentAlerts || []).length) {
          const message = position.tokensAhead === 0
            ? 'Your turn is next. Please proceed to the procurement counter.'
            : `Your turn is approaching. ${position.tokensAhead} token${position.tokensAhead === 1 ? '' : 's'} ahead of you.`;
          await notifyFarmer(req.auth.farmerId, {
            type: 'QUEUE_APPROACHING',
            title: position.tokensAhead === 0 ? 'Your turn is next' : 'Your turn is approaching',
            message
          });
        }
      }
    }
  }

  res.json({
    success: true,
    data: waiting,
    summary: {
      mandiId,
      mandiName: mandi.name,
      mandiAddress: mandi.address,
      date,
      ...summary
    },
    mine,
    date
  });
}

/* ------------------------------------------ GET /queue/token/:bookingId */

export async function getQueueTokenByBooking(req, res) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const bookingId = Number(req.params.bookingId);

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Valid bookingId is required.'
    });
  }

  const { data, error } = await supabase
    .from('queue_tokens')
    .select(`
      *,
      bookings(
        id,
        farmer_id,
        mandi_id,
        crop_id,
        quantity_quintals,
        booking_date,
        slot_start,
        slot_end,
        status,
        mandis(name,address),
        crops(name)
      )
    `)
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) throw error;

  const booking = Array.isArray(data?.bookings) ? data.bookings[0] : data?.bookings;

  // Missing token, or a token that belongs to another farmer: same answer for both.
  if (!data || !booking || Number(booking.farmer_id) !== req.auth.farmerId) {
    return res.status(404).json({
      success: false,
      error: 'Queue token not found for this booking.'
    });
  }

  // Live position (additive; `data` keeps the exact shape it always had).
  let queue = null;
  try {
    const { summary, position } = await queueInfoForToken({
      mandiId: Number(booking.mandi_id),
      date: String(booking.booking_date).slice(0, 10),
      tokenNumber: Number(data.token_number)
    });
    queue = { summary, position };
  } catch (queueError) {
    console.error('Could not compute queue position:', queueError.message);
  }

  res.json({
    success: true,
    data,
    queue
  });
}
