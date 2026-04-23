import { useEffect, useState } from "react";
import { getNotifications, markNotificationAsRead } from "../services/joyeeService";

export default function InAppNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((note) => !note.isRead).length;

  const markRead = async (id) => {
    await markNotificationAsRead(id);
    loadNotifications();
  };

  return (
    <div className="notification-menu">
      <button className="notification-button" onClick={() => setIsOpen((value) => !value)}>
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <span>Notifications</span>
            <span className="notification-count">{unreadCount} new</span>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">No notifications yet.</p>
            ) : (
              notifications.map((note) => (
                <div key={note._id || note.id} className={`notification-item ${note.isRead ? "read" : "unread"}`}>
                  <div>
                    <strong>{note.title}</strong>
                    <p>{note.message}</p>
                  </div>
                  {!note.isRead && (
                    <button className="notification-mark" onClick={() => markRead(note._id || note.id)}>
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
