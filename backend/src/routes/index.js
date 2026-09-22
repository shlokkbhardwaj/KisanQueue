import { Router } from 'express';
import { health, healthDb } from '../controllers/health.controller.js';
import { listCrops } from '../controllers/crop.controller.js';
import {
    listMandis,
    getMandiCropAcceptance,
    getAvailableMandis,
    getMandiSlots
} from '../controllers/mandi.controller.js';
import { register, login, logout, me } from '../controllers/auth.controller.js';
import { createFarmer, getFarmer } from '../controllers/farmer.controller.js';
import {
    createBooking,
    getBooking,
    listMyBookings,
    cancelBooking
} from '../controllers/booking.controller.js';
import { issueToken, queueStatus, getQueueTokenByBooking } from '../controllers/queue.controller.js';
import { farmerPayments } from '../controllers/payment.controller.js';
import { listMyNotifications, markAllRead } from '../controllers/notification.controller.js';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { requireStaffAuth, requireStaffRoles } from '../middleware/staffAuth.js';
import { staffLogin, staffLogout, staffMe, listStaff, createStaff } from '../controllers/staff.controller.js';
import { staffQueue, callToken, serveToken, holdToken, resumeToken, completeToken, skipToken, recallToken } from '../controllers/staffQueue.controller.js';

const router = Router();

/* ---------- public ---------- */
router.get('/health', health);
router.get('/health/db', asyncHandler(healthDb));
router.get('/crops', asyncHandler(listCrops));
router.get('/mandis', asyncHandler(listMandis));
router.get('/mandis/available', asyncHandler(getAvailableMandis));
router.get('/mandis/:id/crops', asyncHandler(getMandiCropAcceptance));
router.get('/mandis/:id/slots', asyncHandler(getMandiSlots));

/* ---------- authentication ---------- */
router.post('/auth/register', asyncHandler(register));
router.post('/auth/login', asyncHandler(login));

/* ---------- staff authentication ---------- */
router.post('/staff/auth/login', asyncHandler(staffLogin));
router.post('/staff/auth/logout', requireStaffAuth, asyncHandler(staffLogout));
router.get('/staff/auth/me', requireStaffAuth, asyncHandler(staffMe));
router.get('/staff/users', requireStaffRoles('admin','supervisor'), asyncHandler(listStaff));
router.post('/staff/users', requireStaffRoles('admin'), asyncHandler(createStaff));
router.get('/staff/queue', requireStaffAuth, asyncHandler(staffQueue));
router.post('/staff/queue/:tokenId/call', requireStaffRoles('operator','supervisor','admin'), asyncHandler(callToken));
router.post('/staff/queue/:tokenId/serve', requireStaffRoles('operator','supervisor','admin'), asyncHandler(serveToken));
router.post('/staff/queue/:tokenId/hold', requireStaffRoles('operator','supervisor','admin'), asyncHandler(holdToken));
router.post('/staff/queue/:tokenId/resume', requireStaffRoles('operator','supervisor','admin'), asyncHandler(resumeToken));
router.post('/staff/queue/:tokenId/complete', requireStaffRoles('operator','supervisor','admin'), asyncHandler(completeToken));
router.post('/staff/queue/:tokenId/skip', requireStaffRoles('operator','supervisor','admin'), asyncHandler(skipToken));
router.post('/staff/queue/:tokenId/recall', requireStaffRoles('operator','supervisor','admin'), asyncHandler(recallToken));
router.post('/auth/logout', requireAuth, asyncHandler(logout));
router.get('/auth/me', requireAuth, asyncHandler(me));

/* ---------- farmer (login required) ---------- */
router.post('/farmers', asyncHandler(createFarmer)); // deprecated -> 410, use /auth/register
router.get('/farmers/:id', requireAuth, asyncHandler(getFarmer));

router.post('/bookings', requireAuth, asyncHandler(createBooking));
router.get('/bookings/mine', requireAuth, asyncHandler(listMyBookings)); // must stay above /bookings/:id
router.get('/bookings/:id', requireAuth, asyncHandler(getBooking));
router.post('/bookings/:id/cancel', requireAuth, asyncHandler(cancelBooking));

router.post('/queue/token', requireAuth, asyncHandler(issueToken));
router.get('/queue/status', optionalAuth, asyncHandler(queueStatus));
router.get('/queue/token/:bookingId', requireAuth, asyncHandler(getQueueTokenByBooking));

router.get('/payments/farmer/:farmerId', requireAuth, asyncHandler(farmerPayments));

router.get('/notifications', requireAuth, asyncHandler(listMyNotifications));
router.post('/notifications/read-all', requireAuth, asyncHandler(markAllRead));

export default router;
