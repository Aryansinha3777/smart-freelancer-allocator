import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setNotifications,
  markOneRead,
  markAllRead,
} from "../store/notificationSlice.js";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from "../api/notificationApi.js";

const typeColors = {
  assignment: "bg-blue-100 text-blue-700",
  status_update: "bg-purple-100 text-purple-700",
  rating: "bg-yellow-100 text-yellow-700",
  reassignment: "bg-red-100 text-red-700",
};

const typeLabels = {
  assignment: "Assignment",
  status_update: "Update",
  rating: "Rating",
  reassignment: "Reassigned",
};

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector(
    (state) => state.notification
  );
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await getMyNotifications();
      dispatch(setNotifications(data));
    } catch (_) {}
  };

  const handleMarkOne = async (id) => {
    dispatch(markOneRead(id));
    await markAsRead(id);
  };

  const handleMarkAll = async () => {
    dispatch(markAllRead());
    await markAllAsRead();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:text-slate-800 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-slate-800">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && handleMarkOne(n._id)}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                    !n.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${
                        typeColors[n.type] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {typeLabels[n.type] || n.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-snug">
                        {n.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;