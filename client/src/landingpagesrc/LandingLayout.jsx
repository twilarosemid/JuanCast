import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChatPanel from './ChatPanel';
import ChikaPanel from './ChikaPanel';
import DailyRewardsModal from '../components/Daily.jsx'; // Corrected import path
import './css/Layout.css';

// Helper to check if the user already claimed today
const checkHasClaimedToday = (lastClaimDate) => {
  if (!lastClaimDate) return false;
  const lastDate = new Date(lastClaimDate).toDateString();
  const today = new Date().toDateString();
  return lastDate === today;
};

const LandingLayout = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  // Existing state for Community Post Modal
  const [showModal, setShowModal] = useState(false);
  const [pendingPost, setPendingPost] = useState({ text: '', avatar: '' });
  const [triggerRefresh, setTriggerRefresh] = useState(null);

  // New state for Daily Rewards Modal
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Sync user login state
  useEffect(() => {
    const syncLoggedInUser = () => {
      const storedUser = localStorage.getItem('juancast_user');
      if (storedUser) {
        setLoggedInUser(JSON.parse(storedUser));
      } else {
        setLoggedInUser(null);
      }
    };

    syncLoggedInUser();
    window.addEventListener('juancast-user-updated', syncLoggedInUser);
    window.addEventListener('storage', syncLoggedInUser);

    return () => {
      window.removeEventListener('juancast-user-updated', syncLoggedInUser);
      window.removeEventListener('storage', syncLoggedInUser);
    };
  }, []);

  // Listen for the specific navigation state from the Login page
  useEffect(() => {
    if (location.state?.showDailyModal) {
      setIsDailyOpen(true);
      // Clear the state immediately so it doesn't pop up again if the user refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const chatUsername = loggedInUser ? `@${loggedInUser.username}` : "Guest";

  // Triggered when user clicks "POST" in ChatPanel
  const handleOpenModal = (text, avatar, refreshCallback) => {
    if (!text.trim()) return;
    if (!loggedInUser) return alert("Please log in to post in the community chat!");
    setPendingPost({ text, avatar });
    setTriggerRefresh(() => refreshCallback);
    setShowModal(true); 
  };

  // Triggered when user clicks "Post it!" inside the centered global modal
  const confirmPost = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: chatUsername, avatar: pendingPost.avatar, text: pendingPost.text }) 
      });

      if (response.ok) {
        const newPost = await response.json();
        setShowModal(false); 
        if (triggerRefresh) triggerRefresh(newPost); // Instantly updates feed and resets textarea
      } else {
        const errData = await response.json();
        alert(`Failed to post: ${errData.message || 'Server error'}`);
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  // --- NEW: Database API Call for Daily Rewards ---
  const handleClaimDailyReward = async (day, value, currency) => {
    if (!loggedInUser?.email) {
      alert("Please log in to claim daily rewards.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/users/daily-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loggedInUser.email,
          dayClaimed: day,
          rewardValue: value,
          currency: currency 
        })
      });

      if (response.ok) {
        const updatedUser = await response.json(); 
        // Update local storage so the UI updates instantly across the app
        localStorage.setItem('juancast_user', JSON.stringify(updatedUser));
        setLoggedInUser(updatedUser); 
        window.dispatchEvent(new Event('juancast-user-updated'));
        
        alert(`Successfully claimed Day ${day} rewards!`);
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to claim reward.");
      }
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      alert("Server error. Please try again later.");
    }
  };

  const welcomeName = loggedInUser ? loggedInUser.username : "Guest";
  const userAvatar = loggedInUser?.avatar || "";

  return (
    <Layout 
      showWelcome={true} 
      welcomeText={`Welcome, ${welcomeName}!`} 
      tokens={loggedInUser?.suns ?? 0} // Syncs with database suns
      stars={loggedInUser?.stars ?? 0} // Syncs with database stars
      loggedInUser={loggedInUser}
      avatar={userAvatar}
      onCalendarClick={() => setIsDailyOpen(true)}
    >
      {/* Applies background blur class to shell when ANY modal is active */}
      <div className={`landing-page-shell ${showModal || isDailyOpen ? 'modal-active' : ''}`} style={{ position: 'relative' }}>
        <div className="landing-grid">
          {/* Fixed Left Panel */}
          <aside className="panel left-panel fixed-sidebar">
            <ChatPanel onPostRequested={handleOpenModal} />
          </aside>

          {/* Scrollable Center View */}
          <main className="center-panel scrollable-center">
            <Outlet />
          </main>

          {/* Fixed Right Panel */}
          <aside className="panel right-panel fixed-sidebar">
            <ChikaPanel />
          </aside>
        </div>
      </div>

      {/* Global Centered Modal rendered via Portal directly to document.body */}
      {showModal && ReactDOM.createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Post to Community?</h3>
            <p>Are you sure your post contents are correct? Posts cannot be deleted or edited once submitted.</p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="modal-confirm-btn" onClick={confirmPost}>Post it!</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Daily Rewards Modal - NOW CONNECTED TO DATABASE */}
      <DailyRewardsModal 
        isOpen={isDailyOpen} 
        onClose={() => setIsDailyOpen(false)}
        currentStreak={loggedInUser?.dailyStreak || 0}
        hasClaimedToday={checkHasClaimedToday(loggedInUser?.lastClaimDate)}
        onClaimReward={handleClaimDailyReward}
      />
    </Layout>
  );
};

export default LandingLayout;