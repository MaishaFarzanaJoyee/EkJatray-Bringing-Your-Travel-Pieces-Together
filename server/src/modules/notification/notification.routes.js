import express from 'express';
import { getUserNotifications, triggerNotification, markAsRead } from './notification.controller.js';

const router = express.Router();

router.get('/', getUserNotifications);
router.post('/trigger', triggerNotification);
router.put('/:id/read', markAsRead);

export default router;