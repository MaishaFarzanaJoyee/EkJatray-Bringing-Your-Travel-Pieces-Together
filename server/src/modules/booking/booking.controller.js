import Accommodation from './accommodation.model.js';
import Wellness from './wellness.model.js';
import TripPlan from './tripPlan.model.js';
import Notification from '../notification/notification.model.js';

// 1. Get Accommodations
export const getAccommodations = async (req, res) => {
    try {
        const { location } = req.query;
        const filter = location ? { location: new RegExp(location, 'i') } : {};
        const hotels = await Accommodation.find(filter);
        res.status(200).json(hotels);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch accommodations" });
    }
};

// 2. Book Lodging
export const bookLodging = async (req, res) => {
    try {
        const { hotelId } = req.body;
        // Find or create a trip plan for the demo user
        let plan = await TripPlan.findOne({ userIdentifier: "demo-user" });
        if (!plan) plan = new TripPlan({ userIdentifier: "demo-user" });
        
        plan.accommodations.push(hotelId);
        await plan.save();
        await Notification.create({
            userId: userId || '12345', 
            title: "Accommodation Booked! 🏨",
            message: "Your hotel has been successfully added to your EkJatray itinerary."
        });
        res.status(200).json({ message: "Lodging successfully added to Trip Plan!", plan });
    } catch (error) {
        res.status(500).json({ error: "Failed to book lodging" });
    }
};
// DELETE: Remove a booked lodging
export const deleteLodging = async (req, res) => {
    try {
        const { id } = req.params;
        // Assuming 'Plan' or 'Booking' is your Mongoose model for these items
        // Adjust the logic here depending on if it's an array inside a user, or its own document
        await Plan.findByIdAndDelete(id); 
        
        res.status(200).json({ message: "Booking canceled successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// 3. Get Wellness Centers
export const getWellnessCenters = async (req, res) => {
    try {
        const { location } = req.query;
        const filter = { isVerified: true }; // Enforce safety verification
        if (location) filter.location = new RegExp(location, 'i');
        
        const centers = await Wellness.find(filter);
        res.status(200).json(centers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch wellness centers" });
    }
};

// 4. Book Wellness Consultation
export const bookWellness = async (req, res) => {
    try {
        const { wellnessId } = req.body;
        let plan = await TripPlan.findOne({ userIdentifier: "demo-user" });
        if (!plan) plan = new TripPlan({ userIdentifier: "demo-user" });
        
        plan.wellnessConsultations.push(wellnessId);
        await plan.save();
        res.status(200).json({ message: "Consultation safely added to Trip Plan!", plan });
    } catch (error) {
        res.status(500).json({ error: "Failed to book consultation" });
    }
};

// 5. Get Unified Itinerary
export const getUnifiedItinerary = async (req, res) => {
    try {
        const plan = await TripPlan.findOne({ userIdentifier: "demo-user" })
            .populate('accommodations')
            .populate('wellnessConsultations');
            
        if (!plan) return res.status(200).json({ accommodations: [], wellnessConsultations: [] });
        res.status(200).json(plan);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch unified itinerary" });
    }
};