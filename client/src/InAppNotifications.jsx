import React, { useState, useEffect } from 'react';

const InAppNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    // Fetch the notifications from your custom backend!
    const fetchNotifications = async () => {
        try {
            
            const response = await fetch('http://localhost:5000/api/notifications');
            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    // Fetch them as soon as the component loads
    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT' });
            // Refresh the list to remove the "unread" dot
            fetchNotifications();
        } catch (error) {
            console.error("Error updating notification:", error);
        }
    };

    // Count how many are unread for the red badge
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative font-sans">
            {/* The Bell Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 bg-white rounded-full shadow hover:bg-gray-100 transition"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* The Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="bg-blue-600 p-4 text-white font-bold flex justify-between items-center">
                        <span>System Alerts</span>
                        <span className="text-xs bg-blue-800 px-2 py-1 rounded-lg">{unreadCount} New</span>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="p-6 text-center text-gray-500">You're all caught up!</p>
                        ) : (
                            notifications.map((note) => (
                                <div 
                                    key={note._id} 
                                    onClick={() => markAsRead(note._id)}
                                    className={`p-4 border-b cursor-pointer transition ${note.isRead ? 'bg-white text-gray-500' : 'bg-blue-50 text-gray-800'}`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <h4 className="font-bold text-sm">{note.title}</h4>
                                        {!note.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>}
                                    </div>
                                    <p className="text-sm">{note.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InAppNotifications;