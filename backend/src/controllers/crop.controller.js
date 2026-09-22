import { supabase } from '../config/supabase.js';

export async function listCrops(req, res) {
    const { data, error } = await supabase
        .from('crops')
        .select('id, name, unit')
        .eq('active', true)
        .order('name', { ascending: true });

    if (error) {
        throw error;
    }

    const crops = data || [];

    // Keep the API envelope consistent across public endpoints.
    // `crops` is retained temporarily for backward compatibility with older clients.
    res.json({
        success: true,
        data: crops,
        crops
    });
}