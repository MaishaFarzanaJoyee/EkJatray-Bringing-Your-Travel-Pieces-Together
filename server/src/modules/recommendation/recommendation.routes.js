import express from 'express';
import { getRecommendations } from './recommendation.controller.js';

const router = express.Router();

router.get('/', getRecommendations);

export default router;