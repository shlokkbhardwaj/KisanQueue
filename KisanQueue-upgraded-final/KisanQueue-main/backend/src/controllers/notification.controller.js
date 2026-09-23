import { supabase } from '../config/supabase.js';

export async function listMyNotifications(req, res) {
  const { data, error } = await supabase
    .from('notifications').select('*')
    .eq('farmer_id', req.auth.farmerId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  res.json({ success: true, data: data || [] });
}

export async function markAllRead(req, res) {
  const { error } = await supabase
    .from('notifications').update({ read: true, read_at: new Date().toISOString() })
    .eq('farmer_id', req.auth.farmerId).eq('read', false);
  if (error) throw error;
  res.json({ success: true });
}
