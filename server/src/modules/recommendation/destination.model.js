import mongoose from 'mongoose';

const destinationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String }, 
    cost: { type: Number, required: true }, 
    tags: [{ type: String }], 
    coordinates: {
        lat: { type: Number, required: true }, 
        lng: { type: Number, required: true }  
    }
}, { timestamps: true });

export default mongoose.model('Destination', destinationSchema);