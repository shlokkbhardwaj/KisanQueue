import { supabase } from '../config/supabase.js';

function isoDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value || ''); }
function dateOffset(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function centreId(req, res) {
  const staff = req.staffAuth.staff;
  const id = Number(req.query.mandiId || staff.mandi_id);
  if (!id) { res.status(400).json({success:false,error:'A centre is required.'}); return null; }
  if (staff.role !== 'admin' && Number(staff.mandi_id) !== id) {
    res.status(403).json({success:false,error:'You can only view your assigned centre.'}); return null;
  }
  return id;
}

export async function staffAnalytics(req, res) {
  const mandiId = centreId(req, res);
  if (!mandiId) return;
  const end = String(req.query.date || new Date().toISOString().slice(0,10));
  if (!isoDate(end)) return res.status(400).json({success:false,error:'date must be YYYY-MM-DD.'});
  const days = Math.min(31, Math.max(1, Number(req.query.days) || 7));
  const start = dateOffset(end, -(days - 1));

  const { data: bookings, error: be } = await supabase.from('bookings')
    .select('id, booking_date, status, quantity_quintals, crop_id')
    .eq('mandi_id', mandiId).gte('booking_date', start).lte('booking_date', end);
  if (be) throw be;

  const ids = (bookings || []).map(b => b.id);
  let tokens = [];
  if (ids.length) {
    const { data, error } = await supabase.from('queue_tokens')
      .select('id, booking_id, status, created_at, called_at, completed_at').in('booking_id', ids);
    if (error) throw error;
    tokens = data || [];
  }

  const byBooking = new Map((bookings || []).map(b => [Number(b.id), b]));
  const trend = [];
  for (let i = 0; i < days; i++) {
    const day = dateOffset(start, i);
    const bs = (bookings || []).filter(b => String(b.booking_date).slice(0,10) === day);
    const ts = tokens.filter(t => String(byBooking.get(Number(t.booking_id))?.booking_date).slice(0,10) === day);
    const durations = ts.map(t => t.called_at && t.completed_at ? (new Date(t.completed_at)-new Date(t.called_at))/60000 : null)
      .filter(v => Number.isFinite(v) && v > 0 && v < 1440);
    trend.push({
      date: day, bookings: bs.length, completed: bs.filter(b=>b.status==='COMPLETED').length,
      cancelled: bs.filter(b=>b.status==='CANCELLED').length, noShow: bs.filter(b=>b.status==='NO_SHOW').length,
      waiting: ts.filter(t=>t.status==='WAITING').length,
      avgServiceMinutes: durations.length ? Math.round(durations.reduce((a,b)=>a+b,0)/durations.length) : null
    });
  }

  const durations = tokens.map(t => t.called_at && t.completed_at ? (new Date(t.completed_at)-new Date(t.called_at))/60000 : null)
    .filter(v => Number.isFinite(v) && v > 0 && v < 1440);
  const currentBookings = (bookings || []).filter(b => String(b.booking_date).slice(0,10) === end);
  const currentTokens = tokens.filter(t => String(byBooking.get(Number(t.booking_id))?.booking_date).slice(0,10) === end);

  res.json({success:true,data:{
    centreId: mandiId, period:{start,end,days},
    metrics:{
      bookings:currentBookings.length, completed:currentBookings.filter(b=>b.status==='COMPLETED').length,
      waiting:currentTokens.filter(t=>t.status==='WAITING').length,
      serving:currentTokens.filter(t=>t.status==='SERVING'||t.status==='CALLED').length,
      cancelled:currentBookings.filter(b=>b.status==='CANCELLED').length,
      noShow:currentBookings.filter(b=>b.status==='NO_SHOW').length,
      avgServiceMinutes:durations.length ? Math.round(durations.reduce((a,b)=>a+b,0)/durations.length) : null,
      totalQuantityQuintals:currentBookings.reduce((sum,b)=>sum+Number(b.quantity_quintals||0),0)
    }, trend
  }});
}
