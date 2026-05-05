// src/components/NotificationBell.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setNotifications, addNotification } from '../redux/slices/notificationSlice';
import { FaBell } from 'react-icons/fa';
import io from 'socket.io-client';
import NotificationDropdown from './NotificationDropdown';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const socket = io(`${import.meta.env.VITE_API_BASE_URL}/notifications`);
    
    socket.on('connect', () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userId = JSON.parse(userStr)._id;
        socket.emit('subscribeToNotifications', userId);
      }
    });
    
    socket.on('new_notification', (notification) => {
      dispatch(addNotification(notification));
    });

    socket.on('incomingVideoCall', (data) => {
      // Clear previous identical toasts to avoid spam layer
      toast.dismiss('incoming-call-toast');
      
      toast.info(`Incoming video call from ${data.name}! Click to answer.`, {
        toastId: 'incoming-call-toast',
        onClick: () => {
          navigate(`/chat/${data.sessionId}`);
        },
        autoClose: 20000, // keep open for a while
        theme: 'dark'
      });
    });

    return () => socket.disconnect();
  }, [dispatch, navigate]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen((open) => !open)}
        className="w-14 h-14  bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-shadow shadow-md"
        title="Notifications"
      >
        <FaBell size={28} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && <NotificationDropdown />}
    </div>
  );
};

export default NotificationBell;
