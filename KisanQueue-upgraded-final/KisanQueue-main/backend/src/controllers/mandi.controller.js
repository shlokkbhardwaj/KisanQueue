import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { haversineKm, parseLocation } from '../utils/geo.js';
import { getSlotAvailability, nowInZone } from '../services/slots.service.js';
import { isISODate, toPositiveInt } from '../utils/validate.js';


/*
 * ============================================================
 * GET ALL ACTIVE MANDIS / NEARBY MANDIS
 *
 * Optional query parameters (all additive; the original
 * behaviour with no parameters is unchanged):
 *
 *   lat, lng, radiusKm  -> only centres within the radius,
 *                          nearest first, with distance_km
 *   cropId              -> only centres that accept this crop
 *   includeCrops=true   -> attach accepted_crops: [{id,name}]
 * ============================================================
 */

export async function listMandis(req, res) {

    if (!supabase) {
        throw new Error('Supabase is not configured.');
    }


    const { radiusKm } = req.query;

    const location = parseLocation(req.query);

    const radius = radiusKm ? Number(radiusKm) : 50;

    if (
        (location && location.error) ||
        Number.isNaN(radius) ||
        radius <= 0
    ) {

        return res.status(400).json({
            success: false,
            error: 'Invalid location parameters.'
        });

    }


    let cropId = null;

    if (req.query.cropId !== undefined) {

        cropId = toPositiveInt(req.query.cropId);

        if (!cropId) {

            return res.status(400).json({
                success: false,
                error: 'Invalid cropId.'
            });

        }

    }

    const includeCrops =
        req.query.includeCrops === 'true';


    const { data, error } = await supabase
        .from('mandis')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');


    if (error) {
        throw error;
    }


    let mandis = data || [];


    /*
     * Crop acceptance comes from mandi_crop_acceptance.
     * A centre is never assumed to accept a crop.
     */

    if (cropId || includeCrops) {

        const {
            data: acceptance,
            error: acceptanceError
        } = await supabase
            .from('mandi_crop_acceptance')
            .select('mandi_id, crop_id, crops(id, name)')
            .eq('accepted', true);

        if (acceptanceError) {
            throw acceptanceError;
        }

        const cropsByMandi = new Map();

        (acceptance || []).forEach(row => {

            const crop = Array.isArray(row.crops)
                ? row.crops[0]
                : row.crops;

            const list =
                cropsByMandi.get(Number(row.mandi_id)) || [];

            list.push({
                id: Number(row.crop_id),
                name: crop?.name || null
            });

            cropsByMandi.set(Number(row.mandi_id), list);

        });

        if (cropId) {

            mandis = mandis.filter(mandi =>
                (cropsByMandi.get(Number(mandi.id)) || [])
                    .some(crop => crop.id === cropId)
            );

        }

        if (includeCrops) {

            mandis = mandis.map(mandi => ({
                ...mandi,
                accepted_crops:
                    cropsByMandi.get(Number(mandi.id)) || []
            }));

        }

    }


    /*
     * If latitude and longitude are supplied,
     * calculate nearby centres (Haversine).
     */

    if (location) {

        mandis = mandis
            .map(mandi => ({
                ...mandi,
                distance_km: haversineKm(
                    location.latitude,
                    location.longitude,
                    Number(mandi.latitude),
                    Number(mandi.longitude)
                )
            }))
            .filter(mandi => mandi.distance_km <= radius)
            .sort((a, b) => a.distance_km - b.distance_km);

    }


    res.json({
        success: true,
        data: mandis
    });

}



/*
 * ============================================================
 * GET CROPS ACCEPTED BY ONE CENTRE
 * ============================================================
 */

export async function getMandiCropAcceptance(req, res) {

    if (!supabase) {
        throw new Error('Supabase is not configured.');
    }


    const mandiId =
        Number(req.params.id);


    if (!Number.isInteger(mandiId)) {

        return res.status(400).json({
            success: false,
            error: 'Invalid centre ID.'
        });

    }


    const { data, error } = await supabase
        .from('mandi_crop_acceptance')
        .select(`
            id,
            mandi_id,
            crop_id,
            accepted,
            procurement_type,
            requirements,
            last_verified,
            source,
            crops (
                id,
                name,
                unit,
                active
            )
        `)
        .eq('mandi_id', mandiId)
        .eq('accepted', true);


    if (error) {
        throw error;
    }


    res.json({
        success: true,
        data
    });

}



/*
 * ============================================================
 * GET AVAILABLE CENTRES FOR SELECTED CROP + QUANTITY
 *
 * Example:
 *
 * /api/mandis/available?cropId=3&quantity=25
 * ============================================================
 */

export async function getAvailableMandis(req, res) {

    if (!supabase) {
        throw new Error('Supabase is not configured.');
    }


    const cropId =
        Number(req.query.cropId);


    const quantity =
        Number(req.query.quantity);


    /*
     * Crop validation.
     */

    if (!Number.isInteger(cropId)) {

        return res.status(400).json({
            success: false,
            error: 'Valid cropId is required.'
        });

    }


    /*
     * Quantity validation.
     */

    if (
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {

        return res.status(400).json({
            success: false,
            error: 'Valid quantity is required.'
        });

    }


    /*
     * Check crop.
     */

    const {
        data: crop,
        error: cropError
    } = await supabase
        .from('crops')
        .select(
            'id, name, unit, active'
        )
        .eq('id', cropId)
        .eq('active', true)
        .single();


    if (cropError) {

        if (
            cropError.code ===
            'PGRST116'
        ) {

            return res.status(404).json({
                success: false,
                error:
                    'Selected crop was not found or is inactive.'
            });

        }


        throw cropError;

    }


    /*
     * Find centres accepting this crop.
     */

    const {
        data: acceptance,
        error: acceptanceError
    } = await supabase
        .from('mandi_crop_acceptance')
        .select(`
            mandi_id,
            crop_id,
            accepted,
            procurement_type,
            requirements,
            last_verified,
            source
        `)
        .eq('crop_id', cropId)
        .eq('accepted', true);


    if (acceptanceError) {
        throw acceptanceError;
    }


    /*
     * No centre accepts this crop.
     */

    if (
        !acceptance ||
        acceptance.length === 0
    ) {

        return res.json({
            success: true,
            data: [],
            crop,
            quantity
        });

    }


    const mandiIds =
        acceptance.map(
            item => item.mandi_id
        );


    /*
     * Fetch only active centres.
     */

    const {
        data: mandis,
        error: mandiError
    } = await supabase
        .from('mandis')
        .select('*')
        .in('id', mandiIds)
        .eq('status', 'ACTIVE')
        .order('name');


    if (mandiError) {
        throw mandiError;
    }


    /*
     * Map acceptance information.
     */

    const acceptanceMap =
        new Map(
            acceptance.map(
                item => [
                    item.mandi_id,
                    item
                ]
            )
        );


    const result =
        (mandis || []).map(
            mandi => {

                const acceptanceInfo =
                    acceptanceMap.get(
                        mandi.id
                    );


                return {

                    ...mandi,

                    crop_id:
                        crop.id,

                    crop_name:
                        crop.name,

                    crop_unit:
                        crop.unit,

                    requested_quantity_quintals:
                        quantity,

                    procurement_type:
                        acceptanceInfo
                            ?.procurement_type ||
                        null,

                    requirements:
                        acceptanceInfo
                            ?.requirements ||
                        null,

                    acceptance_source:
                        acceptanceInfo
                            ?.source ||
                        null,

                    crop_last_verified:
                        acceptanceInfo
                            ?.last_verified ||
                        null

                };

            }
        );


    /*
     * Optional: ?lat=&lng= adds distance_km and sorts nearest first.
     * Centres are NOT dropped by distance here - a farmer should still
     * see every centre that accepts the crop.
     */

    const location = parseLocation(req.query);

    if (location && location.error) {

        return res.status(400).json({
            success: false,
            error: location.error
        });

    }

    let output = result;

    if (location) {

        output = result
            .map(mandi => ({
                ...mandi,
                distance_km: haversineKm(
                    location.latitude,
                    location.longitude,
                    Number(mandi.latitude),
                    Number(mandi.longitude)
                )
            }))
            .sort((a, b) => a.distance_km - b.distance_km);

    }


    res.json({

        success: true,

        data: output,

        crop,

        quantity

    });

}



/*
 * ============================================================
 * GET SLOTS FOR ONE CENTRE + DATE  (real booked counts)
 *
 * /api/mandis/1/slots?date=2026-09-20
 * ============================================================
 */

export async function getMandiSlots(req, res) {

    if (!supabase) {
        throw new Error('Supabase is not configured.');
    }

    const mandiId = toPositiveInt(req.params.id);

    if (!mandiId) {

        return res.status(400).json({
            success: false,
            error: 'Invalid centre ID.'
        });

    }

    const date = req.query.date || nowInZone().date;

    if (!isISODate(date)) {

        return res.status(400).json({
            success: false,
            error: 'date must be YYYY-MM-DD.'
        });

    }

    const { data: mandi, error } = await supabase
        .from('mandis')
        .select('id, name, status, operating_hours')
        .eq('id', mandiId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!mandi || mandi.status !== 'ACTIVE') {

        return res.status(404).json({
            success: false,
            error: 'Procurement centre not found.'
        });

    }

    const { hours, slots } = await getSlotAvailability(mandi, date);

    res.json({
        success: true,
        data: {
            mandiId,
            mandiName: mandi.name,
            date,
            hours,
            slotMinutes: env.slotMinutes,
            capacityPerSlot: env.slotCapacity,
            slots
        }
    });

}

/* GET /prices — latest database-recorded price for each centre/crop pair. */
export async function listPrices(req, res) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const date = req.query.date ? String(req.query.date) : new Date().toISOString().slice(0, 10);
    if (!isISODate(date)) return res.status(400).json({ success: false, error: 'date must be YYYY-MM-DD.' });

    const cropId = req.query.cropId !== undefined ? toPositiveInt(req.query.cropId) : null;
    const mandiId = req.query.mandiId !== undefined ? toPositiveInt(req.query.mandiId) : null;
    if (req.query.cropId !== undefined && !cropId) return res.status(400).json({ success: false, error: 'Invalid cropId.' });
    if (req.query.mandiId !== undefined && !mandiId) return res.status(400).json({ success: false, error: 'Invalid mandiId.' });

    let query = supabase
        .from('prices')
        .select('id, mandi_id, crop_id, price_per_quintal, effective_date, source, created_at, crops(id,name,unit), mandis(id,name,district,state)')
        .lte('effective_date', date)
        .order('effective_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200);
    if (cropId) query = query.eq('crop_id', cropId);
    if (mandiId) query = query.eq('mandi_id', mandiId);

    const { data, error } = await query;
    if (error) throw error;

    const seen = new Set();
    const latest = (data || []).filter(row => {
        const key = `${row.mandi_id || 'all'}:${row.crop_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    res.json({
        success: true,
        data: latest,
        meta: { date, count: latest.length, sourcePolicy: 'Database records only; no prices are generated by the application.' }
    });
}
