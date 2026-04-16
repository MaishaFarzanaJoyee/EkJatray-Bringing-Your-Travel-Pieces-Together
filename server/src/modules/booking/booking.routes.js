import express from 'express';
import { 
    getAccommodations, 
    bookLodging, 
    getWellnessCenters, 
    bookWellness, 
    getUnifiedItinerary 
} from './booking.controller.js';

const router = express.Router();

// Accommodation Routes
router.get('/accommodations', getAccommodations);

// Wellness Routes
router.get('/wellness', getWellnessCenters);

// Trip Plan / Booking Routes
router.post('/plan/book-lodging', bookLodging);
router.post('/plan/book-wellness', bookWellness);
router.get('/plan/unified-itinerary', getUnifiedItinerary);

export default router;