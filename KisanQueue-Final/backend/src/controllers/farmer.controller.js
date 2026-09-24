import { supabase } from '../config/supabase.js';

/*
 * DEPRECATED. Registration now goes through POST /api/auth/register, which also stores a
 * password. Leaving this route open would let anyone create password-less farmer records.
 */
export async function createFarmer(req, res) {
  return res.status(410).json({
    success: false,
    error: 'This endpoint has been replaced. Register with POST /api/auth/register.'
  });
}

export async function getFarmer(req, res) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  // A farmer may only read their own profile.
  if (Number(req.params.id) !== req.auth.farmerId) {
    return res.status(403).json({
      success: false,
      error: 'You can only view your own profile.'
    });
  }

  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .eq('id', req.auth.farmerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'Farmer not found.'
      });
    }

    throw error;
  }

  res.json({
    success: true,
    data
  });
}
