const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    imageUrl: { 
        type: String 
    }, // For the static image on the card
    cost: { 
        type: Number, 
        required: true 
    }, // Used to filter out places above the user's budget
    tags: [{ 
        type: String 
    }], // Used by your engine to calculate the "Match Score"
    coordinates: {
        lat: { type: Number, required: true }, // Latitude for 3D Street View
        lng: { type: Number, required: true }  // Longitude for 3D Street View
    }
}, { timestamps: true });

module.exports = mongoose.model('Destination', destinationSchema);