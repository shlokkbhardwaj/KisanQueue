import { supabase } from '../config/supabase.js';

/**
 * Writes a row to `notifications` for a farmer. Best effort: a notification failure must never
 * make a booking or token request fail, so errors are only logged.
 */
export async function notifyFarmer(farmerId, { title, message, type = 'INFO' }) {
  try {
    const { error } = await supabase.from('notifications').insert({ farmer_id: farmerId, title, message, type });
    if (error) console.error('Could not save notification:', error.message);
  } catch (err) {
    console.error('Could not save notification:', err.message);
  }
}
