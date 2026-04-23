import mongoose from 'mongoose';

const accommodationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    amenities: [{ type: String }],
    rating: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Accommodation', accommodationSchema, 'accommodations');