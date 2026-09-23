import { supabase } from '../config/supabase.js';

/*
 * Queue calculations. Everything here is derived from real rows in `bookings` and
 * `queue_tokens`. Anything the database cannot support is returned as null so the UI can
 * say "not available" instead of inventing a number.
 *
 * Queue order at one centre on one day = slot time first, then token number.
 * (There is no check-in / arrival timestamp in the schema, so arrival order cannot be used.)
 */

export const ACTIVE_TOKEN_STATUSES = new Set(['WAITING', 'CALLED', 'SERVING', 'HOLD']);

function byQueueOrder(a, b) {
  const slotA = a.slot_start || '99:99';
  const slotB = b.slot_start || '99:99';
  if (slotA !== slotB) return slotA < slotB ? -1 : 1;
  return a.token_number - b.token_number;
}

/** All tokens for one centre on one date, joined with their slot time. */
export async function getQueueSnapshot(mandiId, date) {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, slot_start, status')
    .eq('mandi_id', mandiId)
    .eq('booking_date', date);
  if (error) throw error;

  const live = (bookings || []).filter((b) => b.status !== 'CANCELLED');
  if (!live.length) return [];

  const slotByBooking = new Map(live.map((b) => [Number(b.id), String(b.slot_start || '').slice(0, 5) || null]));
  const { data: tokens, error: tokenError } = await supabase
    .from('queue_tokens')
    .select('id, booking_id, token_number, status, counter_id, created_at, called_at, completed_at')
    .in('booking_id', [...slotByBooking.keys()]);
  if (tokenError) throw tokenError;

  return (tokens || []).map((t) => ({
    ...t,
    booking_id: Number(t.booking_id),
    token_number: Number(t.token_number),
    slot_start: slotByBooking.get(Number(t.booking_id)) || null
  }));
}

export function summarizeQueue(snapshot) {
  const inService = snapshot.filter((t) => t.status === 'SERVING' || t.status === 'CALLED').sort(byQueueOrder);
  const waiting = snapshot.filter((t) => t.status === 'WAITING');
  const completed = snapshot.filter((t) => t.status === 'COMPLETED');

  const durations = completed
    .map((t) => (t.called_at && t.completed_at ? (new Date(t.completed_at) - new Date(t.called_at)) / 60000 : null))
    .filter((minutes) => minutes !== null && minutes > 0 && minutes < 24 * 60);
  // Need a few real samples before an average means anything.
  const avgServiceMinutes = durations.length >= 3
    ? Math.max(1, Math.round(durations.reduce((a, b) => a + b, 0) / durations.length))
    : null;

  return {
    currentToken: inService.length ? inService[0].token_number : null,
    servingCount: inService.length,
    waitingCount: waiting.length,
    completedCount: completed.length,
    totalTokens: snapshot.length,
    avgServiceMinutes,
    counters: inService
      .filter((t) => t.counter_id)
      .map((t) => ({ counter: t.counter_id, token_number: t.token_number, status: t.status }))
  };
}

/** Position of one token inside a snapshot, or null if the token is not in it. */
export function positionInQueue(snapshot, tokenNumber, avgServiceMinutes) {
  const mine = snapshot.find((t) => t.token_number === Number(tokenNumber));
  if (!mine) return null;

  if (!ACTIVE_TOKEN_STATUSES.has(mine.status)) {
    return { tokenStatus: mine.status, tokensAhead: null, aheadTokens: [], estimatedWaitMinutes: null, prediction: null };
  }

  const ahead = snapshot
    .filter((t) => ACTIVE_TOKEN_STATUSES.has(t.status) && t.token_number !== mine.token_number && byQueueOrder(t, mine) < 0)
    .sort(byQueueOrder);

  let estimatedWaitMinutes = null;
  let prediction = null;
  if (mine.status === 'SERVING' || mine.status === 'CALLED') {
    estimatedWaitMinutes = 0;
    prediction = { method: 'live_queue', confidence: 'high', sampleCount: null };
  } else if (avgServiceMinutes) {
    estimatedWaitMinutes = ahead.length * avgServiceMinutes;
    prediction = {
      method: 'historical_same_day_completed_tokens',
      confidence: ahead.length <= 2 ? 'high' : ahead.length <= 6 ? 'medium' : 'estimate',
      sampleCount: null,
      serviceMinutesPerToken: avgServiceMinutes
    };
  }

  return {
    tokenStatus: mine.status,
    tokensAhead: ahead.length,
    aheadTokens: ahead.map((t) => ({ token_number: t.token_number, status: t.status })),
    estimatedWaitMinutes,
    prediction
  };
}

/** Convenience: snapshot + summary + position for one token. */
export async function queueInfoForToken({ mandiId, date, tokenNumber }) {
  const snapshot = await getQueueSnapshot(mandiId, date);
  const summary = summarizeQueue(snapshot);
  const position = positionInQueue(snapshot, tokenNumber, summary.avgServiceMinutes);
  return { summary, position };
}
