import React, { useState, useEffect } from 'react';

const WellnessBooking = () => {
    const API_BASE = 'http://localhost:5000/api';

    // 1. Search Inputs State
    const [lodgingLocation, setLodgingLocation] = useState('');
    const [wellnessLocation, setWellnessLocation] = useState('');

    // 2. Search Results State
    const [lodgingResults, setLodgingResults] = useState([]);
    const [wellnessResults, setWellnessResults] = useState([]);

    // 3. Unified Trip Plan State
    const [tripPlan, setTripPlan] = useState({ accommodations: [], wellnessConsultations: [] });

    // Load the plan automatically when the page first loads
    useEffect(() => {
        loadUnifiedPlan();
    }, []);

    // --- API Fetch Functions ---

    const searchLodging = async () => {
        try {
            const res = await fetch(`${API_BASE}/accommodations?location=${lodgingLocation}`);
            const data = await res.json();
            setLodgingResults(data);
        } catch (error) {
            console.error("Error fetching lodging:", error);
        }
    };

    const searchWellness = async () => {
        try {
            const res = await fetch(`${API_BASE}/wellness?location=${wellnessLocation}`);
            const data = await res.json();
            setWellnessResults(data);
        } catch (error) {
            console.error("Error fetching wellness centers:", error);
        }
    };

    const bookLodging = async (hotelId) => {
        try {
            await fetch(`${API_BASE}/plan/book-lodging`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hotelId })
            });
            alert('Hotel added to your trip plan!');
            loadUnifiedPlan(); // Automatically refresh the bottom panel
        } catch (error) {
            console.error("Error booking lodging:", error);
        }
    };

    const bookWellness = async (wellnessId) => {
        try {
            await fetch(`${API_BASE}/plan/book-wellness`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wellnessId })
            });
            alert('Consultation added to your trip plan!');
            loadUnifiedPlan(); // Automatically refresh the bottom panel
        } catch (error) {
            console.error("Error booking wellness:", error);
        }
    };

    const loadUnifiedPlan = async () => {
        try {
            const res = await fetch(`${API_BASE}/plan/unified-itinerary`, { cache: 'no-store' });
            const plan = await res.json();
            console.log("Fresh Database Data:", plan);
            setTripPlan(plan);
        } catch (error) {
            console.error("Error refreshing plan:", error);
        }
    };

    return (
        <div className="bg-gray-50 font-sans min-h-screen py-10">
            <div className="container mx-auto p-6 max-w-6xl">
                <h1 className="text-4xl font-bold text-[#2c3e50] mb-8">Holistic Travel Planning</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* --- Lodging Search Section --- */}
                    <section className="bg-white p-6 rounded-xl shadow border border-gray-200">
                        <h2 className="text-2xl font-bold text-blue-800 mb-4">🏠 Find Lodging</h2>
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                placeholder="Enter City (e.g., Sylhet)" 
                                className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                value={lodgingLocation}
                                onChange={(e) => setLodgingLocation(e.target.value)}
                            />
                            <button 
                                onClick={searchLodging} 
                                className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition-colors"
                            >
                                Search
                            </button>
                        </div>
                        <div className="space-y-4">
                            {lodgingResults.map(hotel => (
                                <div key={hotel._id} className="border p-4 rounded bg-gray-50 flex justify-between items-center hover:shadow-md transition-shadow">
                                    <div>
                                        <h4 className="font-bold text-lg">{hotel.name}</h4>
                                        <p className="text-sm text-gray-600">
                                            BDT {hotel.price}/night | {hotel.amenities?.join(', ')}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => bookLodging(hotel._id)} 
                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                                    >
                                        Book
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* --- Wellness Search Section --- */}
                    <section className="bg-white p-6 rounded-xl shadow border border-gray-200">
                        <h2 className="text-2xl font-bold text-green-800 mb-4">🌿 Verified Wellness Centers</h2>
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                placeholder="Enter City (e.g., Sylhet)" 
                                className="border p-2 rounded w-full focus:ring-2 focus:ring-green-500 outline-none"
                                value={wellnessLocation}
                                onChange={(e) => setWellnessLocation(e.target.value)}
                            />
                            <button 
                                onClick={searchWellness} 
                                className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 transition-colors"
                            >
                                Search
                            </button>
                        </div>
                        <div className="space-y-4">
                            {wellnessResults.map(center => (
                                <div key={center._id} className="border p-4 rounded bg-green-50 flex justify-between items-center hover:shadow-md transition-shadow">
                                    <div>
                                        <h4 className="font-bold text-lg">
                                            {center.centerName} <span className="text-xs bg-green-200 text-green-800 px-2 rounded align-middle">Verified</span>
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {center.practitionerName} ({center.specialty}) | BDT {center.consultationFee}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => bookWellness(center._id)} 
                                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                                    >
                                        Book
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* --- Unified Trip Plan Section --- */}
                <section className="mt-12 bg-gray-800 p-8 rounded-xl shadow text-white">
                    <h2 className="text-3xl font-bold mb-6">🎒 Your Unified Trip Plan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Booked Stays */}
                        <div>
                            <h3 className="text-xl font-bold text-blue-300 border-b border-gray-600 pb-2 mb-4">Booked Stays</h3>
                            <ul className="space-y-2 text-gray-300">
                                {tripPlan.accommodations && tripPlan.accommodations.length > 0 ? (
                                    tripPlan.accommodations.map((a, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <span>🏨</span> {a.name} - {a.location}
                                        </li>
                                    ))
                                ) : (
                                    <li className="italic text-gray-500">No stays booked yet.</li>
                                )}
                            </ul>
                        </div>

                        {/* Wellness Consultations */}
                        <div>
                            <h3 className="text-xl font-bold text-green-300 border-b border-gray-600 pb-2 mb-4">Wellness Consultations</h3>
                            <ul className="space-y-2 text-gray-300">
                                {tripPlan.wellnessConsultations && tripPlan.wellnessConsultations.length > 0 ? (
                                    tripPlan.wellnessConsultations.map((w, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <span>🌿</span> {w.specialty} with {w.practitionerName}
                                        </li>
                                    ))
                                ) : (
                                    <li className="italic text-gray-500">No consultations booked yet.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                    
                    <button 
                        onClick={loadUnifiedPlan} 
                        className="mt-8 bg-white text-gray-800 px-6 py-2 rounded font-bold hover:bg-gray-200 transition-colors"
                    >
                        Refresh Itinerary
                    </button>
                </section>
            </div>
        </div>
    );
};

export default WellnessBooking;