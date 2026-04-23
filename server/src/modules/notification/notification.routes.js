import express from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { getUserNotifications, triggerNotification, markAsRead } from './notification.controller.js';

const router = express.Router();

router.get('/', requireAuth, getUserNotifications);
router.post('/trigger', requireAuth, triggerNotification);
router.put('/:id/read', requireAuth, markAsRead);

export default router;