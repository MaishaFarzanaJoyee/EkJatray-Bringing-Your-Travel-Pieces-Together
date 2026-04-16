import mongoose from 'mongoose';

const tripPlanSchema = new mongoose.Schema({
    // In a real app, this would link to the logged-in User ID. 
    // Using a simple string identifier for testing purposes.
    userIdentifier: { type: String, required: true, default: "demo-user" },
    accommodations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Accommodation' }],
    wellnessConsultations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Wellness' }]
}, { timestamps: true });

export default mongoose.model('TripPlan', tripPlanSchema);