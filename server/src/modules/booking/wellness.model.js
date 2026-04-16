import mongoose from 'mongoose';

const wellnessSchema = new mongoose.Schema({
    centerName: { type: String, required: true },
    practitionerName: { type: String, required: true },
    specialty: { type: String, required: true }, // e.g., "Homeopathy", "Massage"
    location: { type: String, required: true },
    isVerified: { type: Boolean, default: true },
    consultationFee: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('Wellness', wellnessSchema, 'wellness');