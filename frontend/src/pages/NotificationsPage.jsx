import { useEffect, useState } from "react";
import { getNotifications, markNotificationAsRead } from "../services/joyeeService";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getNotifications();
      const nextNotifications = Array.isArray(data)
        ? data
        : Array.isArray(data?.notifications)
          ? data.notifications
          : Array.isArray(data?.items)
            ? data.items
            : [];

      setNotifications(nextNotifications);
    } catch (err) {
      setNotifications([]);
      setError(err?.response?.data?.message || "Unable to load notifications right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRead = async (id) => {
    try {
      setError("");
      await markNotificationAsRead(id);
      await loadNotifications();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update notification status.");
    }
  };

  return (
    <div className="page-content">
      <section className="page-section">
        <div className="section-header">
          <h1>Notifications</h1>
          <p>Keep track of system alerts and booking updates in one place.</p>
        </div>

        <div className="card card-form">
          {loading ? (
            <p className="status-message">Loading notifications...</p>
          ) : error ? (
            <p className="status-error">{error}</p>
          ) : notifications.length === 0 ? (
            <p className="status-message">No notifications available.</p>
          ) : (
            <div className="space-y-4">
              {notifications.map((note) => (
                <div key={note._id || note.id} className={`notification-card ${note.isRead ? "notification-read" : "notification-unread"}`}>
                  <div>
                    <h2>{note.title}</h2>
                    <p>{note.message}</p>
                    <p className="text-muted">{new Date(note.createdAt).toLocaleString()}</p>
                  </div>
                  {!note.isRead && (
                    <button className="button-secondary" onClick={() => handleRead(note._id || note.id)}>
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
