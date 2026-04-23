import React, { useState, useEffect } from 'react';

const Recommendation = () => {
    // 1. Authentication State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // 2. Search & Results State
    const [budget, setBudget] = useState('');
    const [tags, setTags] = useState('');
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emptyResult, setEmptyResult] = useState(false);

    // 3. Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCoords, setCurrentCoords] = useState({ lat: null, lng: null });

    // Handle Authentication on component mount
    useEffect(() => {
        const token = localStorage.getItem("ekjatrayToken");
        const currentUser = JSON.parse(localStorage.getItem("ekjatrayUser") || "{}");

        if (token) {
            setIsLoggedIn(true);
            if (currentUser.role === "admin") {
                setIsAdmin(true);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("ekjatrayToken");
        localStorage.removeItem("ekjatrayUser");
        window.location.href = "/login"; // In React Router, you'd use useNavigate()
    };

    const fetchRecommendations = async () => {
        setLoading(true);
        setError('');
        setEmptyResult(false);
        setDestinations([]);

        try {
            const response = await fetch(`http://localhost:1065/api/recommendations?budget=${budget}&tags=${tags}`);
            const data = await response.json();

            if (!data || data.length === 0) {
                setEmptyResult(true);
            } else {
                setDestinations(data);
            }
        } catch (err) {
            setError("Error connecting to the Express Backend. Make sure your server is running.");
        } finally {
            setLoading(false);
        }
    };

    const open3DView = (lat, lng) => {
        setCurrentCoords({ lat, lng });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentCoords({ lat: null, lng: null });
    };

    return (
        <div className="container mx-auto">
            {/* Navbar */}
            <nav className="navbar flex justify-between items-center p-4 bg-white shadow-sm">
                <a className="logo-area flex items-center gap-2" href="/" aria-label="EkJatray home">
                    <img className="logo-img w-10" src="/asset/logo.png" alt="EkJatray logo" />
                    <span className="logo-text flex flex-col">
                        <strong className="text-xl">EkJatray</strong>
                        <small className="text-xs text-gray-500">Bringing your travel pieces together</small>
                    </span>
                </a>
                <div className="menu flex gap-4 items-center">
                    <a href="/" className="menu-btn text-gray-700 hover:text-blue-600">Home</a>
                    
                    {/* Conditional Rendering for Auth */}
                    {!isLoggedIn ? (
                        <>
                            <a href="/login" className="menu-btn text-gray-700 hover:text-blue-600">Login</a>
                            <a href="/register" className="menu-btn text-gray-700 hover:text-blue-600">Register</a>
                        </>
                    ) : (
                        <>
                            {!isAdmin && <a href="/budget" className="menu-btn text-gray-700 hover:text-blue-600">Manage Budget</a>}
                            {isAdmin && <a href="/admin" className="menu-btn text-gray-700 hover:text-blue-600">Admin Panel</a>}
                            <button onClick={handleLogout} className="button-light px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Logout</button>
                        </>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto p-6 mt-8">
                <section className="bg-white p-8 rounded-xl shadow border border-gray-200 mb-8">
                    <h1 className="text-3xl font-bold text-[#2c3e50] mb-2">Find Your Optimal Tour</h1>
                    <p className="text-gray-500 mb-6">Enter your budget and preferences to get AI-matched destinations.</p>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                        <input 
                            type="number" 
                            placeholder="Max Budget (e.g., 5000)" 
                            className="border border-gray-300 p-3 rounded-lg w-full md:w-1/3 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                        />
                        <input 
                            type="text" 
                            placeholder="Preferences (e.g., beach, nature, relaxing)" 
                            className="border border-gray-300 p-3 rounded-lg w-full md:w-2/3 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                        <button 
                            onClick={fetchRecommendations} 
                            className="button-main bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-md transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </section>

                {/* Results Container */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Status Messages */}
                    {loading && <div className="col-span-full text-center py-10 text-gray-500">Loading your optimal tour plans...</div>}
                    {error && <div className="col-span-full text-center py-10 text-red-500">{error}</div>}
                    {emptyResult && <div className="col-span-full text-center py-10 text-gray-500">No destinations found for this budget.</div>}

                    {/* Destination Cards mapped from State */}
                    {destinations.map((dest) => (
                        <div key={dest._id} className="card p-5 flex flex-col justify-between hover:shadow-lg transition-shadow bg-white rounded-lg border border-gray-100">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-gray-800">{dest.name}</h3>
                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Match: {dest.matchScore}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-3">{dest.description || 'A beautiful destination to explore.'}</p>
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {dest.tags.map((tag, index) => (
                                        <span key={index} className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-100">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-[#2c3e50] mb-3">BDT {dest.cost}</p>
                                <button 
                                    onClick={() => open3DView(dest.coordinates.lat, dest.coordinates.lng)} 
                                    className="w-full button-light py-2.5 rounded hover:bg-gray-100 font-medium transition-colors flex justify-center items-center gap-2 border border-gray-300"
                                >
                                    <span>🌐</span> View in 3D
                                </button>
                            </div>
                        </div>
                    ))}
                </section>
            </main>

            {/* 3D Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl overflow-hidden w-11/12 h-5/6 relative shadow-2xl flex flex-col">
                        <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b border-gray-200">
                            <h3 className="font-bold text-xl text-gray-800">Immersive 3D Preview</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-red-500 font-bold text-3xl transition-colors leading-none">&times;</button>
                        </div>
                        <div className="flex-grow w-full bg-gray-200">
                            <iframe 
                                width="100%" 
                                height="100%" 
                                frameBorder="0" 
                                style={{ border: 0 }} 
                                src={`https://maps.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}&t=k&z=15&output=embed`}
                                allowFullScreen
                                title="3D Satellite View"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recommendation;