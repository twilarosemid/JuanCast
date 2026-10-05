import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ProfileActionButton } from './ProfileButton';
import DailyRewardsModal from '../components/Daily.jsx';
import RewardsCenter from './RewardsCenter';
import './css/Profile.css';

// 1. IMPORT YOUR CURRENCY ICONS
import StarCurr from '../assets/StarCurr.png';
import SunCurr from '../assets/SunCurr.png';

// 2. ADD HELPER FUNCTION FOR DAILY CLAIMS
const checkHasClaimedToday = (lastClaimDate) => {
  if (!lastClaimDate) return false;
  const lastDate = new Date(lastClaimDate).toDateString();
  const today = new Date().toDateString();
  return lastDate === today;
};

const Profile = () => {
  const navigate = useNavigate();
  const { username: routeUsername } = useParams();
  const { dailyOpenRequest, consumeDailyOpenRequest } = useOutletContext();

  const formatJoinedDate = (dateValue) => {
    if (!dateValue) return 'Joined recently';

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Joined recently';

    return `Joined ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  const timeAgo = (dateString) => {
    if (!dateString) return 'Just now';

    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  // 3. REMOVED PLACEHOLDER DATA to prevent flashing dummy names
  const [user, setUser] = useState({
    name: '',
    username: '',
    joined: '',
    suns: 0,
    stars: 0,
    avatar: '',
    coverPhoto: '',
    coverPosition: { x: 50, y: 50 },
    followers: [],
    following: []
  });
  
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [expandedComments, setExpandedComments] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [newPostText, setNewPostText] = useState('');
  const [showProfilePostModal, setShowProfilePostModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  
  const [isDailyOpen, setIsDailyOpen] = useState(false); 
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);

  const openRewards = () => {
    setIsRewardsOpen(true);
  };

  const closeRewards = () => {
    setIsRewardsOpen(false);
  };

  useEffect(() => {
    if (dailyOpenRequest) {
      setIsDailyOpen(true);
      consumeDailyOpenRequest();
    }
  }, [dailyOpenRequest, consumeDailyOpenRequest]);

  const normalizeUserHandle = (value = '') => (value || '').replace(/^@/, '').trim().toLowerCase();
  const isOwnProfile = !routeUsername || normalizeUserHandle(routeUsername) === normalizeUserHandle(loggedInUser?.username || user.username);

  const handleFollowToggle = async () => {
    if (!loggedInUser?.email) {
      alert('Log in to follow users.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/users/follow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loggedInUser.email,
          username: routeUsername || user.username
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update follow status.');
      }

      setIsFollowing(Boolean(data.isFollowing));
      setFollowersCount(Number(data.followersCount || followersCount + (data.isFollowing ? 1 : -1)));
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert(error.message || 'Unable to update follow status.');
    }
  };

  useEffect(() => {
    const syncUserFromStorage = async () => {
      const storedUser = localStorage.getItem('juancast_user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setLoggedInUser(parsedUser);

      if (!parsedUser) {
        if (routeUsername) {
          try {
            const response = await fetch(`http://localhost:5000/api/users/profile/${encodeURIComponent(normalizeUserHandle(routeUsername))}`);
            if (response.ok) {
              const profile = await response.json();
              setUser((prev) => ({
                ...prev,
                name: profile.fullName || 'User',
                username: profile.username || normalizeUserHandle(routeUsername),
                joined: formatJoinedDate(profile.createdAt || profile.joinDate),
                avatar: profile.avatar || '',
                coverPhoto: profile.coverPhoto || '',
                coverPosition: profile.coverPosition || { x: 50, y: 50 },
                followers: Array.isArray(profile.followers) ? profile.followers : [],
                following: Array.isArray(profile.following) ? profile.following : []
              }));
              setFollowersCount(Array.isArray(profile.followers) ? profile.followers.length : 0);
            }
          } catch (error) {
            console.error('Error loading profile by username:', error);
          }
        }
        return;
      }

      const mergedUser = {
        ...parsedUser,
        name: parsedUser.fullName || parsedUser.name || 'User',
        username: parsedUser.username || '',
        joined: parsedUser.joined || formatJoinedDate(parsedUser.createdAt || parsedUser.joinDate),
        avatar: parsedUser.avatar || '',
        coverPhoto: parsedUser.coverPhoto || '',
        coverPosition: parsedUser.coverPosition || { x: 50, y: 50 },
        followers: Array.isArray(parsedUser.followers) ? parsedUser.followers : [],
        following: Array.isArray(parsedUser.following) ? parsedUser.following : []
      };

      const isViewingDifferentUser = Boolean(routeUsername) && normalizeUserHandle(routeUsername) !== normalizeUserHandle(parsedUser.username || '');

      if (isViewingDifferentUser) {
        try {
          const response = await fetch(`http://localhost:5000/api/users/profile/${encodeURIComponent(normalizeUserHandle(routeUsername))}`);
          if (response.ok) {
            const profile = await response.json();
            const targetFollowers = Array.isArray(profile.followers) ? profile.followers : [];
            const viewerHandle = normalizeUserHandle(parsedUser?.username || loggedInUser?.username || '');

            setUser({
              ...mergedUser,
              name: profile.fullName || 'User',
              username: profile.username || normalizeUserHandle(routeUsername),
              joined: formatJoinedDate(profile.createdAt || profile.joinDate),
              avatar: profile.avatar || '',
              coverPhoto: profile.coverPhoto || '',
              coverPosition: profile.coverPosition || { x: 50, y: 50 },
              followers: targetFollowers,
              following: Array.isArray(profile.following) ? profile.following : []
            });
            setFollowersCount(targetFollowers.length);
            setIsFollowing(targetFollowers.some((value) => normalizeUserHandle(value) === viewerHandle));
            return;
          }
        } catch (error) {
          console.error('Error loading other user profile:', error);
        }
        return;
      }

      setUser((prev) => ({ ...prev, ...mergedUser }));

      if (parsedUser.email) {
        try {
          const response = await fetch(`http://localhost:5000/api/users/me?email=${encodeURIComponent(parsedUser.email)}`);
          if (response.ok) {
            const profile = await response.json();
            const freshUser = {
              ...mergedUser,
              fullName: profile.fullName || mergedUser.name,
              username: profile.username || mergedUser.username,
              createdAt: profile.createdAt || mergedUser.createdAt,
              joined: formatJoinedDate(profile.createdAt || profile.joinDate || mergedUser.createdAt),
              avatar: profile.avatar || mergedUser.avatar || '',
              coverPhoto: profile.coverPhoto || mergedUser.coverPhoto || '',
              coverPosition: profile.coverPosition || mergedUser.coverPosition || { x: 50, y: 50 },
              followers: Array.isArray(profile.followers) ? profile.followers : mergedUser.followers,
              following: Array.isArray(profile.following) ? profile.following : mergedUser.following,
              stars: profile.stars || 0,
              suns: profile.suns || 0,
              dailyStreak: profile.dailyStreak || 0,
              lastClaimDate: profile.lastClaimDate || null
            };

            localStorage.setItem('juancast_user', JSON.stringify(freshUser));
            setUser((prev) => ({
              ...prev,
              ...freshUser,
              name: freshUser.fullName || prev.name,
              coverPhoto: freshUser.coverPhoto || prev.coverPhoto,
              coverPosition: freshUser.coverPosition || prev.coverPosition || { x: 50, y: 50 },
              followers: freshUser.followers || prev.followers,
              following: freshUser.following || prev.following
            }));
            setFollowersCount(Array.isArray(profile.followers) ? profile.followers.length : 0);
          }
        } catch (error) {
          console.error('Error loading profile data for user:', error);
        }
      }
    };

    syncUserFromStorage();
    window.addEventListener('storage', syncUserFromStorage);

    return () => window.removeEventListener('storage', syncUserFromStorage);
  }, [routeUsername]);

  useEffect(() => {
    const targetUsername = normalizeUserHandle(routeUsername || loggedInUser?.username || user.username || '');

    if (!targetUsername) {
      setPosts([]);
      return;
    }

    fetch('http://localhost:5000/api/posts')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const filteredPosts = data.filter((post) => {
          const postUser = normalizeUserHandle(post.user);
          return postUser === targetUsername;
        });

        setPosts(filteredPosts);
      })
      .catch((error) => console.error('Error fetching user posts:', error));
  }, [routeUsername, loggedInUser?.username, user.username]);

  const currentProfileHandle = `@${(user.username || '').trim()}`;

  const handleLike = async (postId) => {
    const postToLike = posts.find((post) => (post._id || post.id) === postId);
    const currentLikes = Array.isArray(postToLike?.likes) ? postToLike.likes : [];
    const hasLiked = currentLikes.includes(currentProfileHandle);

    setPosts((prevPosts) => prevPosts.map((post) => {
      if ((post._id || post.id) !== postId) return post;

      const likes = Array.isArray(post.likes) ? post.likes : [];
      const updatedLikes = hasLiked
        ? likes.filter((userHandle) => userHandle !== currentProfileHandle)
        : [...likes, currentProfileHandle];

      return { ...post, likes: updatedLikes };
    }));

    try {
      await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentProfileHandle })
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const resolveReplyAvatar = (reply) => {
    if (!reply) return '';
    if (reply.avatar) return reply.avatar;

    const normalizedReplyUser = normalizeUserHandle(reply.user);
    const normalizedLoggedInUser = normalizeUserHandle(loggedInUser?.username);
    const normalizedProfileUser = normalizeUserHandle(user.username);

    if (normalizedReplyUser && normalizedReplyUser === normalizedLoggedInUser && loggedInUser?.avatar) {
      return loggedInUser.avatar;
    }
    if (normalizedReplyUser && normalizedReplyUser === normalizedProfileUser && user.avatar) {
      return user.avatar;
    }

    return '';
  };

  const handleReplySubmit = async (postId) => {
    const replyText = replyInputs[postId];
    if (!replyText || !replyText.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentProfileHandle, avatar: user.avatar || loggedInUser?.avatar || '', text: replyText })
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts((prevPosts) => prevPosts.map((post) => ((post._id || post.id) === postId ? updatedPost : post)));
        setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const handleProfilePostRequest = () => {
    const trimmedText = newPostText.trim();
    if (!trimmedText) return;
    setShowProfilePostModal(true);
  };

  const handleCreatePost = async () => {
    const trimmedText = newPostText.trim();
    if (!trimmedText) return;

    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentProfileHandle,
          avatar: user.avatar || '',
          text: trimmedText
        })
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts((prevPosts) => [newPost, ...prevPosts]);
        setNewPostText('');
        setShowProfilePostModal(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to post: ${errorData.message || 'Server error'}`);
      }
    } catch (error) {
      console.error('Error creating profile post:', error);
    }
  };

  // 4. ADD THE DAILY DATABASE FETCH LOGIC
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
        alert(`Successfully claimed Day ${day} rewards!`);
      } else {
        const errText = await response.text();
        try {
            const errData = JSON.parse(errText);
            alert(errData.message || errData.error || "Failed to claim reward.");
        } catch (e) {
            alert(`Server Error ${response.status}: Route not found or server crashed.`);
        }
      }
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      alert("Server error. Please try again later.");
    }
  };

  const featureButtons = [
    { icon: '⭐', text: 'Rewards', onClick: openRewards },
    { icon: '🎁', text: 'Juantask', onClick: () => console.log('Juantask clicked') },
    { icon: '📢', text: 'Promo', onClick: () => console.log('Promo clicked') },
    { icon: '🎖️', text: 'Badges', onClick: () => console.log('Badges clicked') }
  ];

  return (
    <div className="profile-dashboard-layout">
      {/* Centered Profile Header Card */}
      <div className="profile-main-card">
        <div className="profile-cover-photo">
          {user.coverPhoto ? (
            <img
              src={user.coverPhoto}
              alt="Cover"
              style={{ objectPosition: `${user.coverPosition?.x ?? 50}% ${user.coverPosition?.y ?? 50}%` }}
            />
          ) : null}
        </div>

        {/* Header Content Section */}
        <div className="profile-header-content">
          <div className="profile-left-identity">
            <div className="profile-avatar-circle">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </div>

            <div className="profile-user-info">
              <h2 className="profile-fullname">{user.name}</h2>
              <p className="profile-username">@{user.username}</p>
              <p className="profile-joined">{user.joined}</p>
            </div>
          </div>

          <div className="profile-right-actions">
            
            {isOwnProfile && loggedInUser && (
              <div className="profile-tokens" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img src={SunCurr} alt="Suns" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  {loggedInUser.suns ?? user.suns ?? 0}
                </span>
                <span className="token-divider">/</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img src={StarCurr} alt="Stars" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  {loggedInUser.stars ?? user.stars ?? 0}
                </span>
              </div>
            )}

            {!isOwnProfile && loggedInUser && (
              <ProfileActionButton
                label={isFollowing ? 'Following' : 'Follow'}
                variant={isFollowing ? 'primary' : 'default'}
                onClick={handleFollowToggle}
              />
            )}

            {isOwnProfile && (
              <ProfileActionButton 
                label="Edit Profile" 
                onClick={() => navigate('/profile/edit')} 
              />
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Split Section */}
      <div className="profile-columns-wrapper">
        {/* Left Side: Overview & Features */}
        <div className="profile-left-subcolumn">
          <div className="profile-overview-box">
            <h3 className="overview-title">Activity Overview</h3>
            <div className="overview-stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Posts</span>
                <span className="stat-value">{posts.length}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Comments</span>
                <span className="stat-value">{posts.reduce((sum, post) => sum + (post.replies?.length || 0), 0)}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Reactions</span>
                <span className="stat-value">{posts.reduce((sum, post) => sum + (Array.isArray(post.likes) ? post.likes.length : 0), 0)}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Followers</span>
                <span className="stat-value">{followersCount}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Following</span>
                <span className="stat-value">{Array.isArray(user.following) ? user.following.length : 0}</span>
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <div className="profile-features-wrapper">
              <h3 className="features-title">Platform Features</h3>
              <div className="platform-features-grid">
                {featureButtons.map((btn, index) => (
                  <button key={index} type="button" className="platform-feature-btn" onClick={btn.onClick}>
                    <span className="feature-icon">{btn.icon}</span>
                    <span className="feature-label">{btn.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Community Feed */}
        <div className="profile-right-subcolumn">
          {isOwnProfile && (
            <div className="profile-feed-card post-creator-box">
              <textarea
                className="post-placeholder-text"
                placeholder="What are you Juan-dering about?"
                value={newPostText}
                onChange={(event) => {
                  setNewPostText(event.target.value);
                  event.target.style.height = 'auto';
                  event.target.style.height = `${event.target.scrollHeight}px`;
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleProfilePostRequest();
                  }
                }}
                rows={1}
                style={{
                  width: '100%',
                  resize: 'none',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  color: '#334155',
                  minHeight: '42px',
                  maxHeight: '220px',
                  overflowY: 'hidden',
                  padding: 0,
                  boxSizing: 'border-box',
                  lineHeight: '1.5'
                }}
              />
              <div className="post-creator-bottom">
                <button className="post-action-btn" onClick={handleProfilePostRequest}>POST</button>
              </div>
            </div>
          )}

          {showProfilePostModal && ReactDOM.createPortal(
            <div className="profile-modal-overlay" onClick={() => setShowProfilePostModal(false)}>
              <div className="profile-modal-content" onClick={(event) => event.stopPropagation()}>
                <h3>Post to Community?</h3>
                <p>Are you sure your post contents are correct? Posts cannot be deleted or edited once submitted.</p>
                <div className="profile-modal-actions">
                  <button className="profile-modal-cancel-btn" onClick={() => setShowProfilePostModal(false)}>Cancel</button>
                  <button className="profile-modal-confirm-btn" onClick={handleCreatePost}>Post it!</button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {posts.length === 0 ? (
            <div className="profile-feed-card">
              <p className="feed-body-text">No posts yet from this profile.</p>
            </div>
          ) : (
            posts.map((post) => {
              const postId = post._id || post.id;
              const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;
              const replyCount = Array.isArray(post.replies) ? post.replies.length : 0;
              const hasLiked = Array.isArray(post.likes) && post.likes.includes(currentProfileHandle);
              const postDisplayAvatar = post.avatar || (normalizeUserHandle(post.user) === normalizeUserHandle(user.username) ? user.avatar : '') || '';

              return (
                <div key={postId} className="profile-feed-card">
                  <div className="feed-header">
                    <div className="feed-user-avatar">
                      {postDisplayAvatar ? (
                        <img src={postDisplayAvatar} alt={post.user} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%', padding: '8px' }}>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      )}
                    </div>
                    <div className="feed-user-meta">
                      <span className="feed-username">{post.user}</span>
                      <span className="feed-timestamp">{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                  <p className="feed-body-text">{post.text}</p>
                  <div className="feed-footer-actions">
                    <span
                      onClick={() => handleLike(postId)}
                      style={{ cursor: 'pointer', color: hasLiked ? '#ff3b30' : '#64748b' }}
                    >
                      {hasLiked ? '❤️' : '♡'} {likeCount}
                    </span>
                    <span
                      onClick={() => toggleComments(postId)}
                      style={{ cursor: 'pointer' }}
                    >
                      💬 {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
                    </span>
                  </div>

                  {expandedComments[postId] && (
                    <div className="profile-feed-comments">
                      {(post.replies || []).map((reply, index) => {
                        const replyAvatar = resolveReplyAvatar(reply);

                        return (
                          <div key={`${postId}-reply-${index}`} className="profile-feed-reply">
                            <div className="feed-user-avatar" style={{ width: '28px', height: '28px', marginRight: '8px' }}>
                              {replyAvatar ? (
                                <img src={replyAvatar} alt={reply.user} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%', padding: '4px' }}>
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                              )}
                            </div>
                            <strong>{reply.user}</strong>
                            <span>{reply.text}</span>
                          </div>
                        );
                      })}

                      <div className="profile-feed-reply-box">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={replyInputs[postId] || ''}
                          onChange={(event) => setReplyInputs((prev) => ({ ...prev, [postId]: event.target.value }))}
                          onKeyDown={(event) => event.key === 'Enter' && handleReplySubmit(postId)}
                        />
                        <button onClick={() => handleReplySubmit(postId)}>Reply</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. CONFIGURED THE MODAL TO USE ACTUAL DATABASE DATA */}
      {isRewardsOpen && (
        <RewardsCenter
          loggedInUser={loggedInUser}
          dailyStreak={loggedInUser?.dailyStreak || 0}
          onClose={closeRewards}
          onOpenDaily={() => setIsDailyOpen(true)}
        />
      )}

      <DailyRewardsModal 
        isOpen={isDailyOpen} 
        onClose={() => setIsDailyOpen(false)}
        currentStreak={loggedInUser?.dailyStreak || 0}
        hasClaimedToday={checkHasClaimedToday(loggedInUser?.lastClaimDate)}
        onClaimReward={handleClaimDailyReward}
      />
    </div>
  );
};

export default Profile;