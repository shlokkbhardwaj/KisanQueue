import { supabase } from '../config/supabase.js';

/*
 * Payment RECORDS, read from the `payments` table.
 *
 * This project does not process payments: there is no payment gateway and no endpoint that
 * creates or changes a payment. Rows are expected to be written by the procurement / treasury
 * system (or inserted by hand for the demo). The farmer app only displays them.
 */
export async function farmerPayments(req, res) {
  if (!supabase) throw new Error('Supabase is not configured.');

  // A farmer may only read their own payments.
  if (Number(req.params.farmerId) !== req.auth.farmerId) {
    return res.status(403).json({ success: false, error: 'You can only view your own payments.' });
  }

  const { data, error } = await supabase
    .from('payments')
    .select('*, bookings(id, booking_date, quantity_quintals, crops(name), mandis(name))')
    .eq('farmer_id', req.auth.farmerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ success: true, data });
}
