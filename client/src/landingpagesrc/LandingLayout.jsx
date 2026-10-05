import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaBolt, FaStar, FaSun, FaSyncAlt } from 'react-icons/fa';
import Layout from '../components/Layout';
import ChatPanel from './ChatPanel';
import ChikaPanel from './ChikaPanel';
import DailyRewardsModal from '../components/Daily.jsx';
import './css/Layout.css';

const checkHasClaimedToday = (lastClaimDate) => {
  if (!lastClaimDate) return false;
  const lastDate = new Date(lastClaimDate).toDateString();
  const today = new Date().toDateString();
  return lastDate === today;
};

const communitySections = [
  { id: 'chat', label: 'Chat' },
  { id: 'chika', label: 'Chika' },
  { id: 'contents', label: 'Content' }
];

const marketSections = [
  { id: 'stars', label: 'Stars', Icon: FaStar },
  { id: 'suns', label: 'Suns', Icon: FaSun },
  { id: 'spin', label: 'Spin', Icon: FaSyncAlt },
  { id: 'powerups', label: 'Powerups', Icon: FaBolt }
];

const LandingLayout = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [pendingPost, setPendingPost] = useState({ text: '', avatar: '' });
  const [triggerRefresh, setTriggerRefresh] = useState(null);

  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [activeCommunitySection, setActiveCommunitySection] = useState('chat');
  const [activeMarketSection, setActiveMarketSection] = useState('stars');
  
  const location = useLocation();
  const navigate = useNavigate();

  // --- HIDE SIDEBARS CONSTANTS ---
  const isSettingsPage = location.pathname.startsWith('/settings');
  const isCommunityPage = location.pathname.startsWith('/community');
  const isMarketPage = location.pathname.startsWith('/market');
  const isTransactionsPage = location.pathname.startsWith('/transactions');
  const isFullWidthPage = ['/polls', '/videos'].some(path => location.pathname.startsWith(path));
  const isCenterOnlyPage = isFullWidthPage || isCommunityPage || isMarketPage || isTransactionsPage;

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

  useEffect(() => {
    if (location.state?.showDailyModal) {
      setIsDailyOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (location.state?.openPostId) setActiveCommunitySection('chat');
  }, [location.key, location.state?.openPostId]);

  const chatUsername = loggedInUser ? `@${loggedInUser.username}` : "Guest";

  const handleOpenModal = (text, avatar, refreshCallback) => {
    if (!loggedInUser?.email) {
      navigate('/login');
      return;
    }
    if (!text.trim()) return;
    setPendingPost({ text, avatar });
    setTriggerRefresh(() => refreshCallback);
    setShowModal(true); 
  };

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
        if (triggerRefresh) triggerRefresh(newPost);
      } else {
        const errData = await response.json();
        alert(`Failed to post: ${errData.message || 'Server error'}`);
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  // --- RESTORED CUSTOM REWARD LOGIC ---
  const handleClaimDailyReward = async (day, value, currency) => {
    if (!loggedInUser?.email) {
      setIsDailyOpen(false);
      navigate('/login');
      return false;
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
        localStorage.setItem('juancast_user', JSON.stringify(updatedUser));
        setLoggedInUser(updatedUser); 
        window.dispatchEvent(new Event('juancast-user-updated'));
        
        return true; // Triggers the celebratory pop-up in Daily.jsx
      } else {
        const errData = await response.json();
        return errData.message || "Failed to claim reward.";
      }
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      return "Server error. Please try again later.";
    }
  };

  const welcomeName = loggedInUser ? loggedInUser.username : "Guest";
  const userAvatar = loggedInUser?.avatar || "";

  return (
    <Layout 
      showWelcome={true} 
      welcomeText={`Welcome, ${welcomeName}!`} 
      tokens={loggedInUser?.suns ?? 0} 
      stars={loggedInUser?.stars ?? 0} 
      loggedInUser={loggedInUser}
      avatar={userAvatar}
      onCalendarClick={() => setIsDailyOpen(true)}
    >
      <div className={`landing-page-shell ${showModal || isDailyOpen ? 'modal-active' : ''}`} style={{ position: 'relative' }}>
        
{/* --- UPDATED GRID LOGIC --- */}
        <div 
          className="landing-grid" 
          style={
            isSettingsPage || isTransactionsPage ? { display: 'flex', justifyContent: 'center' } :
            isFullWidthPage ? { display: 'flex', width: '100%' } : 
            {}
          }
        >
          
          {/* Hide side panels on settings and browse pages */}
          {!isSettingsPage && !isFullWidthPage && !isTransactionsPage && (
            <aside className="panel left-panel fixed-sidebar">
              {isCommunityPage ? (
                <nav className="community-section-nav" aria-label="Community sections">
                  {communitySections.map(section => (
                    <button
                      key={section.id}
                      type="button"
                      className={`community-section-button${activeCommunitySection === section.id ? ' active' : ''}`}
                      onClick={() => setActiveCommunitySection(section.id)}
                    >
                      {section.label}
                    </button>
                  ))}
                </nav>
              ) : isMarketPage ? (
                <nav className="market-category-list" aria-label="Market categories">
                  {marketSections.map(({ id, label, Icon }) => (
                    <button
                      type="button"
                      key={id}
                      className={`market-category${activeMarketSection === id ? ' active' : ''}`}
                      onClick={() => setActiveMarketSection(id)}
                    >
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  ))}
                </nav>
              ) : (
                <ChatPanel onPostRequested={handleOpenModal} />
              )}
            </aside>
          )}

          {/* Settings is centered (800px). Browse pages use the full content width. */}
          <main 
            className="center-panel scrollable-center" 
            style={
              isSettingsPage ? { width: '100%', maxWidth: '800px' } :
              isTransactionsPage ? { width: '100%', maxWidth: '1100px', flex: 1, padding: '18px 24px' } :
              isFullWidthPage ? { width: '100%', maxWidth: '100%', flex: 1, padding: '0 20px' } : 
              {}
            }
          >
            <Outlet context={{
              onPostRequested: handleOpenModal,
              activeCommunitySection,
              activeMarketSection,
              loggedInUser,
              openPostId: location.state?.openPostId,
              openReplyIndex: location.state?.openReplyIndex,
              focusKey: location.key
            }} />
          </main>

          {!isSettingsPage && !isCenterOnlyPage && (
            <aside className="panel right-panel fixed-sidebar">
              <ChikaPanel featuredLayout={false} />
            </aside>
          )}

        </div>
      </div>

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