// src/components/NotificationDropdown.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markAsRead } from '../redux/slices/notificationSlice';
import axios from 'axios';  // Import axios here
import { Check, X } from 'lucide-react'; // For icons if needed

const NotificationDropdown = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.notifications);
  const [isOpen, setIsOpen] = useState(false);  // State to toggle the dropdown visibility
  const [filter, setFilter] = useState('all'); // Default filter is 'all'

  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id)); // Mark notification as read in Redux

    // Persist the update to the backend
    const token = localStorage.getItem('token');
    axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/${id}/read`, {}, {
      headers: { 'x-auth-token': token },
    }).catch((err) => {
      console.error('Error updating read status in backend:', err.message);
    });
  };

  const handleAcceptRequest = async (e, notification) => {
    e.stopPropagation();
    handleMarkAsRead(notification._id);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/sessions/accept`, 
        { sessionId: notification.relatedId },
        { headers: { 'x-auth-token': token } }
      );
      alert('Request accepted successfully!');
    } catch (err) {
      console.error('Error accepting request:', err.message);
      alert('Failed to accept request');
    }
  };

  const handleRejectRequest = async (e, notification) => {
    e.stopPropagation();
    handleMarkAsRead(notification._id);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/sessions/reject`, 
        { sessionId: notification.relatedId },
        { headers: { 'x-auth-token': token } }
      );
      alert('Request rejected successfully!');
    } catch (err) {
      console.error('Error rejecting request:', err.message);
      alert('Failed to reject request');
    }
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach((notification) => {
      if (!notification.isRead) {
        dispatch(markAsRead(notification._id));  // Update in Redux state

        // Persist the change to the backend
        const token = localStorage.getItem('token');
        axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/${notification._id}/read`, {}, {
          headers: { 'x-auth-token': token },
        }).catch((err) => {
          console.error('Error marking all notifications as read:', err.message);
        });
      }
    });
  };

  const toggleFilter = (filterType) => {
    if (filter === filterType) {
      setFilter('all');
    } else {
      setFilter(filterType);
    }
  };

  // Filter notifications based on the selected filter
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true; // Show all notifications when filter is 'all'
  });

  // Close the dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('.notification-dropdown') === null) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl notification-dropdown z-50 overflow-hidden transform transition-all duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
        <h3 className="text-white font-bold text-lg drop-shadow-sm">Notifications</h3>
      </div>
      
      {/* Filter Buttons */}
      <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-gray-50">
        <div className="flex space-x-2">
          <button
            onClick={() => toggleFilter('unread')}            
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-200 ${filter === 'unread' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          >
            Unread
          </button>
          <button
            onClick={() => toggleFilter('read')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-200 ${filter === 'read' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          >
            Read
          </button>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="text-xs font-medium text-indigo-500 hover:text-indigo-700 hover:underline transition-colors"
        >
          Mark All Read
        </button>
      </div>

      {/* Notifications List */}
      <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 bg-white">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <li
              key={notification._id}
              className={`p-4 transition-colors duration-200 cursor-pointer ${!notification.isRead ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-gray-50'}`}
              onClick={() => handleMarkAsRead(notification._id)}  // Mark as read on click
            >
              <div className="flex flex-col gap-2">
                <span className={`text-sm ${!notification.isRead ? 'text-gray-800 font-semibold' : 'text-gray-600 font-medium'}`}>
                  {notification.message}
                </span>
                
                {/* Accept/Reject Buttons for Session Requests */}
                {notification.type === 'session_request' && notification.relatedId && !notification.isRead && (
                  <div className="flex space-x-2 mt-1">
                    <button
                      onClick={(e) => handleAcceptRequest(e, notification)}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-transform transform hover:scale-105 shadow-sm"
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      onClick={(e) => handleRejectRequest(e, notification)}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-transform transform hover:scale-105 shadow-sm"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))
        ) : (
          <li className="p-6 text-center text-gray-500 flex flex-col items-center justify-center">
             <span className="text-sm font-medium">No notifications yet</span>
             <span className="text-xs text-gray-400 mt-1">Check back later!</span>
          </li>
        )}
      </ul>
    </div>
  );
};

export default NotificationDropdown;