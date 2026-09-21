import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

import logo from './assets/juancast_logo.webp';

const timeAgo = (dateString) => {
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

const chikaData = [
  { 
    id: 1, 
    title: "Seo In Guk charms Filo Heartriders in 'Heart Cookie' Manila fanmeet", 
    desc: "Korean singer-actor Seo In Guk charmed fans with his 'Heart Cookie' Asia tour fan meeting on Saturday...",
  }
];

const rankingsData = [
  { id: 2, rank: 'Silver', title: 'Nasaan Ka Na - Ashtine Olviga', votes: '4,756,670', colorClass: 'silver-card', medal: '🥈' },
  { id: 1, rank: 'Gold', title: 'Hulog - KAIA', votes: '7,226,032', colorClass: 'gold-card', medal: '🥇' },
  { id: 3, rank: 'Bronze', title: 'Lunod - HORI7ON', votes: '7,226,032', colorClass: 'bronze-card', medal: '🥉' }
];

const pollsData = [
  { id: 1, title: 'ENHYPEN JAY', location: 'MOA Arena', date: 'Aug 19 - Sept 19', tokens: '39 PPMA', type: 'Minor' },
  { id: 2, title: 'ENHYPEN JUNGWON', location: 'MOA Arena', date: 'Aug 19 - Sept 19', tokens: '39 PPMA', type: 'Minor' },
  { id: 3, title: 'ENHYPEN HEESEUNG', location: 'MOA Arena', date: 'Aug 19 - Sept 19', tokens: '39 PPMA', type: 'Minor' },
  { id: 4, title: 'ENHYPEN SUNOO', location: 'MOA Arena', date: 'Aug 19 - Sept 19', tokens: '39 PPMA', type: 'Minor' },
  { id: 5, title: 'ENHYPEN SUNGHOON', location: 'MOA Arena', date: 'Aug 19 - Sept 19', tokens: '39 PPMA', type: 'Minor' }
];

const LandingPage = () => {
  const [posts, setPosts] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  const [expandedComments, setExpandedComments] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [showModal, setShowModal] = useState(false);
  
  const [activePoll, setActivePoll] = useState(2);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('juancast_user');
    if (storedUser) {
      setLoggedInUser(JSON.parse(storedUser));
    }

    fetch('http://localhost:5000/api/posts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error("Database returned an error instead of posts:", data);
        }
      })
      .catch(err => console.error("Error fetching posts:", err));
  }, []);

  const welcomeName = loggedInUser ? loggedInUser.username : "Guest";
  const chatUsername = loggedInUser ? `@${loggedInUser.username}` : "Guest";
  const userAvatar = loggedInUser?.avatar || ""; 

  const handlePostClick = () => {
    if (!chatInput.trim()) return;
    if (!loggedInUser) return alert("Please log in to post in the community chat!");
    setShowModal(true); 
  };

  const confirmPost = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Now sending the userAvatar to the database
        body: JSON.stringify({ user: chatUsername, avatar: userAvatar, text: chatInput }) 
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts([newPost, ...posts]); 
        setChatInput(''); 
        setShowModal(false); 
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleLike = async (postId) => {
    if (!loggedInUser) return alert("Log in to react!");

    const postToLike = posts.find(p => p._id === postId);
    const currentLikes = Array.isArray(postToLike.likes) ? postToLike.likes : [];
    const hasLiked = currentLikes.includes(chatUsername);

    setPosts(prevPosts => prevPosts.map(p => {
      if (p._id === postId) {
        const pLikes = Array.isArray(p.likes) ? p.likes : [];
        const newLikes = hasLiked
          ? pLikes.filter(u => u !== chatUsername)
          : [...pLikes, chatUsername];
        return { ...p, likes: newLikes };
      }
      return p;
    }));

    try {
      await fetch(`http://localhost:5000/api/posts/${postId}/like`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: chatUsername })
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleReplySubmit = async (postId) => {
    const replyText = replyInputs[postId];
    if (!replyText || !replyText.trim()) return;
    if (!loggedInUser) return alert("Log in to comment!");

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Now sending the userAvatar to the replies array
        body: JSON.stringify({ user: chatUsername, avatar: userAvatar, text: replyText })
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map(p => p._id === postId ? updatedPost : p));
        setReplyInputs(prev => ({ ...prev, [postId]: '' })); 
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  return (
    <div className="landing-wrapper">
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Post to Community?</h3>
            <p>Are you sure your post contents are correct? Posts cannot be deleted or edited once submitted.</p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="modal-confirm-btn" onClick={confirmPost}>Post it!</button>
            </div>
          </div>
        </div>
      )}
      
      <nav className="landing-nav-blue">
        <div className="nav-logo">
          <img src={logo} alt="JuanCast Logo" className="nav-logo-img" />
        </div>
        <div className="nav-actions">
          <span className="nav-bell">🔔</span>
          
          {loggedInUser ? (
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div className="nav-profile-icon" style={{
                width: '35px', height: '35px', borderRadius: '50%', 
                backgroundColor: '#e0e0e0', border: '2px solid white', cursor: 'pointer',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </div>
            </Link>
          ) : (
            <Link to="/login">
              <button className="nav-login-btn">Login</button>
            </Link>
          )}
        </div>
      </nav>

      <div className="main-content-area">
        
        <div className="welcome-bar">
          <div className="welcome-text">Welcome, {welcomeName}!</div>
          <div className="welcome-stats">
            <span>🌟 10</span>
            <span>⭐ 10</span>
            <span className="calendar-icon">📅</span>
          </div>
        </div>

        <div className="landing-grid">
          
          <aside className="panel left-panel">
            <div className="panel-header">
              <span className="chat-tab active">CHAT 💬</span>
            </div>
            <div className="chat-input-placeholder">
              <textarea 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="What are you Juan-dering about?"
                style={{ width: '100%', border: 'none', resize: 'none', outline: 'none', height: '50px', background: 'transparent', fontFamily: 'inherit' }}
              />
              <button className="post-btn" onClick={handlePostClick}>POST</button>
            </div>
            <div className="chat-list">
              {posts.map(post => {
                const postLikes = Array.isArray(post.likes) ? post.likes : [];
                const hasLiked = postLikes.includes(chatUsername);

                return (
                  <div key={post._id} className="chat-item card-shadow" style={{ flexDirection: 'column' }}>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      
                      {/* Pulls avatar directly from the specific post */}
                      <div className="chat-avatar-placeholder" style={{
                        width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0e0e0',
                        overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {post.avatar ? (
                          <img src={post.avatar} alt={post.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        )}
                      </div>
                      
                      <div className="chat-content" style={{ flex: 1 }}>
                        <div className="chat-user-row">
                          <span className="chat-user">{post.user}</span>
                          <span className="chat-time">• {timeAgo(post.createdAt)}</span>
                        </div>
                        {post.text && <div className="chat-text">{post.text}</div>}
                        
                        <div className="chat-actions">
                          <span 
                            onClick={() => handleLike(post._id)}
                            style={{ 
                              cursor: 'pointer', 
                              color: hasLiked ? '#ff3b30' : 'inherit',
                              transition: 'color 0.2s'
                            }}
                          >
                            {hasLiked ? '❤️' : '♡'} {postLikes.length}
                          </span>
                          
                          <span onClick={() => toggleComments(post._id)} style={{ cursor: 'pointer', marginLeft: '15px' }}>
                            🗨️ {post.replies?.length || 0} {expandedComments[post._id] ? '(Hide)' : '(Reply)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {expandedComments[post._id] && (
                      <div className="comments-section">
                        
                        {post.replies && post.replies.map((reply, idx) => (
                          <div key={idx} className="reply-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            {/* Tiny avatar for replies */}
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e0e0e0',
                              overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {reply.avatar ? (
                                <img src={reply.avatar} alt={reply.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                              )}
                            </div>
                            <div>
                              <span className="reply-user" style={{ fontWeight: 'bold', fontSize: '12px' }}>{reply.user}</span>
                              <span className="reply-text" style={{ fontSize: '13px', marginLeft: '4px' }}>{reply.text}</span>
                            </div>
                          </div>
                        ))}
                        
                        <div className="reply-input-row" style={{ marginTop: '10px' }}>
                          <input 
                            type="text" 
                            placeholder="Write a comment..." 
                            value={replyInputs[post._id] || ''}
                            onChange={(e) => setReplyInputs({ ...replyInputs, [post._id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(post._id)}
                          />
                          <button onClick={() => handleReplySubmit(post._id)}>Reply</button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </aside>

          <main className="center-panel">
            <div className="carousel-banner card-shadow">
              <div className="img-placeholder-text">Banner Image Placeholder</div>
              <div className="carousel-dots">
                <span className="dot"></span><span className="dot active"></span><span className="dot"></span>
              </div>
            </div>
            
            <div className="section-header">
              <h2>Rankings</h2>
            </div>
            
            <div className="rankings-container">
              {rankingsData.map((item) => (
                <div key={item.id} className={`ranking-card ${item.colorClass}`}>
                  <div className="ranking-medal">{item.medal}</div>
                  <div className="ranking-img-placeholder">
                    <span>Image</span>
                  </div>
                  <div className="ranking-info">
                    <h3 className="ranking-title">{item.title}</h3>
                    <div className="ranking-votes">{item.votes}</div>
                    <button className="cast-vote-btn">CAST VOTE</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="section-header" style={{ marginTop: '20px' }}>
              <h2>Polls</h2>
              <a href="#" className="view-all-link">View All</a>
            </div>
            
            <div className="polls-container">
              <div 
                className="polls-track"
                style={{ transform: `translateX(calc(-125px - ${activePoll * 265}px))` }}
              >
                {pollsData.map((poll, index) => {
                  const isActive = index === activePoll;
                  
                  return (
                    <div 
                      key={poll.id} 
                      className={`poll-vcard ${isActive ? 'active' : 'inactive'}`}
                      onClick={() => setActivePoll(index)}
                    >
                      <div className="poll-vcard-image">
                        {/* Image placeholder */}
                      </div>
                      <div className="poll-vcard-content">
                        <h3 className="poll-vcard-title">{poll.title}</h3>
                        <p className="poll-vcard-date">{poll.date} • {poll.location}</p>
                        
                        <div className="poll-vcard-footer">
                          <span className="token-badge">🪙 {poll.tokens}</span>
                          <span className="type-badge">⭐ {poll.type}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </main>

          <aside className="panel right-panel">
            <div className="chika-header">
              <span className="chika-badge">latest chika</span>
            </div>
            <div className="chika-list">
              {chikaData.map(chika => (
                <div key={chika.id} className="chika-news-card card-shadow">
                  <div className="chika-img-placeholder">Image Placeholder</div>
                  <h3 className="chika-title">{chika.title}</h3>
                  <p className="chika-desc">{chika.desc}</p>
                  <button className="read-more-btn">Read More</button>
                </div>
              ))}
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default LandingPage;