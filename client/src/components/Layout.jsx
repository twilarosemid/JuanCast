import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/juancast_logo.webp';
import notificationIcon from '../assets/notifications.png';
import calendarIcon from '../assets/calendar.webp';
// IMPORT YOUR NEW CURRENCY ICONS HERE
import StarCurr from '../assets/StarCurr.png';
import SunCurr from '../assets/SunCurr.png';
import './css/Navbar.css';

const Layout = ({ 
  children,
  showWelcome = false, 
  welcomeText = '', 
  tokens = null, 
  stars = null, 
  showActions = true,
  loggedInUser = null,
  avatar = '',
  onCalendarClick,
  hideHeader = false
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationView, setNotificationView] = useState('notifications');
  const [followedNotificationIds, setFollowedNotificationIds] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('juancast_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const notificationUser = loggedInUser || currentUser;

  useEffect(() => {
    const syncLoggedInUser = () => {
      const storedUser = localStorage.getItem('juancast_user');
      setCurrentUser(storedUser ? JSON.parse(storedUser) : null);
    };

    syncLoggedInUser();
    window.addEventListener('juancast-user-updated', syncLoggedInUser);
    window.addEventListener('storage', syncLoggedInUser);

    return () => {
      window.removeEventListener('juancast-user-updated', syncLoggedInUser);
      window.removeEventListener('storage', syncLoggedInUser);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const username = notificationUser?.username;
    if (!username) {
      setNotifications([]);
      return undefined;
    }

    let isActive = true;
    const loadNotifications = async () => {
      try {
        const response = await fetch(`[https://juancast.onrender.com](https://juancast.onrender.com)/api/notifications?username=${encodeURIComponent(username)}`);
        if (!response.ok) throw new Error('Failed to load notifications');
        const data = await response.json();
        if (isActive) setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 30000);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [notificationUser?.username]);

  const handleLogout = () => {
    localStorage.removeItem('juancast_user');
    setDropdownOpen(false);
    navigate('/login');
  };

  const markNotificationRead = async (notification) => {
    if (notification.isRead || !notificationUser?.username) return;
    setNotifications(current => current.map(item =>
      item._id === notification._id ? { ...item, isRead: true } : item
    ));
    try {
      await fetch(`[https://juancast.onrender.com](https://juancast.onrender.com)/api/notifications/${notification._id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: notificationUser.username })
      });
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const openNotification = (notification) => {
    markNotificationRead(notification);
    setNotificationsOpen(false);
    if (notification.type === 'follow') {
      const username = String(notification.actor || '').replace(/^@/, '');
      navigate(`/profile/${encodeURIComponent(username)}`);
      return;
    }

    navigate('/community', {
      state: {
        openPostId: notification.postId,
        openReplyIndex: notification.type === 'reply' ? notification.replyIndex : null
      }
    });
  };

  const handleFollowBack = async (event, notification) => {
    event.stopPropagation();
    if (!notificationUser?.email) {
      navigate('/login');
      return;
    }

    const username = String(notification.actor || '').replace(/^@/, '');
    try {
      const response = await fetch('[https://juancast.onrender.com](https://juancast.onrender.com)/api/users/follow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notificationUser.email, username })
      });
      if (!response.ok) throw new Error('Unable to follow this user.');
      setFollowedNotificationIds(ids => [...new Set([...ids, notification._id])]);
      setCurrentUser(current => current ? {
        ...current,
        following: [...(current.following || []), `@${username}`]
      } : current);
    } catch (error) {
      console.error('Error following notification author:', error);
    }
  };

  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  const mailNotifications = notifications.filter(notification => notification.type === 'mail');
  const visibleNotifications = notifications.filter(notification => notification.type !== 'mail');

  return (
    <div className="landing-wrapper">
      {!hideHeader && <div className="sticky-header-container">
        <header className="landing-nav-blue">
          <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src={logo} alt="JuanCast Logo" className="nav-logo-img" />
          </div>

          {showActions && (
            <div className="nav-actions">
              <div className="notification-menu-wrapper" ref={notificationRef}>
                <button
                  type="button"
                  className="nav-notification-toggle"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  onClick={() => {
                    setNotificationsOpen(open => !open);
                    setDropdownOpen(false);
                  }}
                >
                  <img src={notificationIcon} alt="" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span
                      className="notification-count"
                      aria-label={`${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
                    />
                  )}
                </button>

                {notificationsOpen && (
                  <section className="notification-dropdown" aria-label="Notification menu">
                    <div className="notification-dropdown-header">
                      <strong>Notification</strong>
                      <button
                        type="button"
                        className="notification-mail-button"
                        onClick={() => setNotificationView(view => view === 'mail' ? 'notifications' : 'mail')}
                      >
                        Mail
                      </button>
                    </div>
                    {notificationView === 'mail' ? (
                      !notificationUser ? (
                        <p className="notification-empty">Log in to view Mail.</p>
                      ) : mailNotifications.length === 0 ? (
                        <p className="notification-empty">No mail notifications.</p>
                      ) : (
                        <div className="notification-list">
                          {mailNotifications.map(notification => (
                            <article className={`notification-item${notification.isRead ? '' : ' unread'}`} key={notification._id}>
                              <button
                                type="button"
                                className="notification-item-main"
                                onClick={() => markNotificationRead(notification)}
                              >
                                <strong className="notification-actor">{notification.subject || 'JuanCast update'}</strong>
                                {notification.preview && <span className="notification-preview">{notification.preview}</span>}
                                <time>{new Date(notification.createdAt).toLocaleString()}</time>
                              </button>
                            </article>
                          ))}
                        </div>
                      )
                    ) : !notificationUser ? (
                      <p className="notification-empty">Log in to view notifications.</p>
                    ) : visibleNotifications.length === 0 ? (
                      <p className="notification-empty">No notifications yet.</p>
                    ) : (
                      <div className="notification-list">
                        {visibleNotifications.map(notification => {
                          const actor = notification.actor || 'Someone';
                          const message = notification.type === 'like'
                            ? 'reacted to your post'
                            : notification.type === 'reply'
                              ? 'replied to your post'
                              : 'followed you';
                          const alreadyFollowing = (notificationUser.following || []).some(handle =>
                            String(handle).replace(/^@/, '').toLowerCase() === actor.replace(/^@/, '').toLowerCase()
                          );
                          const hasFollowedBack = followedNotificationIds.includes(notification._id);

                          return (
                            <article className={`notification-item${notification.isRead ? '' : ' unread'}`} key={notification._id}>
                              <button type="button" className="notification-item-main" onClick={() => openNotification(notification)}>
                                <span className="notification-actor">{actor} {message}</span>
                                {notification.preview && <span className="notification-preview">{notification.preview}</span>}
                                <time>{new Date(notification.createdAt).toLocaleString()}</time>
                              </button>
                              {notification.type === 'follow' && !alreadyFollowing && !hasFollowedBack && (
                                <button type="button" className="notification-followback" onClick={(event) => handleFollowBack(event, notification)}>
                                  Follow back
                                </button>
                              )}
                              {notification.type === 'follow' && (alreadyFollowing || hasFollowedBack) && (
                                <span className="notification-following">Following</span>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </div>
              
              {(loggedInUser || currentUser) ? (
                <div className="nav-profile-dropdown-wrapper" ref={dropdownRef}>
                  <div 
                    className="nav-profile-icon" 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                      width: '35px', height: '35px', borderRadius: '50%', 
                      backgroundColor: '#e0e0e0', border: '2px solid white', cursor: 'pointer',
                      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {(avatar || currentUser?.avatar) ? (
                      <img src={avatar || currentUser?.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    )}
                  </div>

                  {dropdownOpen && (
                    <div className="navbar-dropdown-menu">
                      <div className="dropdown-user-header">
                        <span className="dropdown-username">@{(loggedInUser || currentUser)?.username}</span>
                      </div>
                      <div className="dropdown-divider"></div>
                      <button onClick={() => { setDropdownOpen(false); navigate('/profile'); }}>Profile</button>
                      <button onClick={() => { setDropdownOpen(false); navigate('/transactions'); }}>Transactions</button>
                      <button onClick={() => { setDropdownOpen(false); navigate('/settings'); }}>Settings</button>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login">
                  <button className="nav-login-btn">Login</button>
                </Link>
              )}
            </div>
          )}
        </header>

        {showWelcome && (
          <div className="welcome-bar">
            <div className="welcome-text">{welcomeText}</div>

            <nav className="welcome-nav" aria-label="Main navigation">
              <NavLink to="/polls" className={({ isActive }) => `welcome-nav-link${isActive ? ' active' : ''}`}>Vote</NavLink>
              <NavLink to="/community" className={({ isActive }) => `welcome-nav-link${isActive ? ' active' : ''}`}>Community</NavLink>
              <NavLink to="/market" className={({ isActive }) => `welcome-nav-link${isActive ? ' active' : ''}`}>Market</NavLink>
            </nav>
            
            {/* UPDATED: Currency Display with Images */}
            <div className="welcome-stats" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {tokens !== null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <img src={SunCurr} alt="Suns" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> 
                  {tokens}
                </span>
              )}
              {stars !== null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <img src={StarCurr} alt="Stars" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> 
                  {stars}
                </span>
              )}
              <button 
                type="button"
                className="calendar-icon" 
                onClick={onCalendarClick} 
                aria-label="Daily rewards"
                style={{ cursor: 'pointer', marginLeft: '5px' }}
              >
                <img src={calendarIcon} alt="" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>}

      <div className="main-content-area">
        {children}
      </div>
    </div>
  );
};

export default Layout;