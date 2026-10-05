import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/ChatPanel.css';

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

const ChatPanel = ({ onPostRequested, focusPostId, focusReplyIndex, focusKey }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const focusedTargetRef = useRef(null);

  useEffect(() => {
    const syncLoggedInUser = async () => {
      const storedUser = localStorage.getItem('juancast_user');
      if (!storedUser) {
        setLoggedInUser(null);
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      setLoggedInUser(parsedUser);

      if (!parsedUser.avatar && parsedUser.email) {
        try {
          const response = await fetch(`http://localhost:5000/api/users/me?email=${encodeURIComponent(parsedUser.email)}`);
          if (response.ok) {
            const profile = await response.json();
            const updatedUser = { ...parsedUser, avatar: profile.avatar || '' };
            localStorage.setItem('juancast_user', JSON.stringify(updatedUser));
            setLoggedInUser(updatedUser);
          }
        } catch (error) {
          console.error('Error loading avatar for chat user:', error);
        }
      }
    };

    syncLoggedInUser();
    window.addEventListener('juancast-user-updated', syncLoggedInUser);
    window.addEventListener('storage', syncLoggedInUser);

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

    return () => {
      window.removeEventListener('juancast-user-updated', syncLoggedInUser);
      window.removeEventListener('storage', syncLoggedInUser);
    };
  }, []);

  useEffect(() => {
    if (!focusPostId || !posts.some(post => String(post._id) === String(focusPostId))) return;

    if (focusReplyIndex !== null && focusReplyIndex !== undefined && !expandedComments[focusPostId]) {
      setExpandedComments(current => ({ ...current, [focusPostId]: true }));
      return;
    }

    const targetKey = `${focusKey}:${focusPostId}:${focusReplyIndex ?? 'post'}`;
    if (focusedTargetRef.current === targetKey) return;

    const targetId = focusReplyIndex !== null && focusReplyIndex !== undefined
      ? `community-reply-${focusPostId}-${focusReplyIndex}`
      : `community-post-${focusPostId}`;
    const target = document.getElementById(targetId) || document.getElementById(`community-post-${focusPostId}`);
    if (!target) return;

    focusedTargetRef.current = targetKey;
    const frameId = requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    return () => cancelAnimationFrame(frameId);
  }, [posts, focusPostId, focusReplyIndex, focusKey, expandedComments]);

  const chatUsername = loggedInUser ? `@${loggedInUser.username}` : "Guest";
  const userAvatar = loggedInUser?.avatar || "";

  const buildProfileRoute = (handle = '') => {
    const cleanedHandle = String(handle || '').replace(/^@/, '').trim();
    return cleanedHandle ? `/profile/${encodeURIComponent(cleanedHandle)}` : '/profile';
  };

  const handlePostClick = () => {
    if (!loggedInUser?.email) {
      navigate('/login');
      return;
    }
    if (!chatInput.trim()) return;
    
    // Pass the input data and a callback up to LandingLayout's modal trigger
    onPostRequested(chatInput, userAvatar, (newPost) => {
      setPosts([newPost, ...posts]);
      setChatInput('');
    });
  };

  const handleLike = async (postId) => {
    if (!loggedInUser) return alert("Log in to react!");

    const postToLike = posts.find(p => p._id === postId);
    const currentLikes = Array.isArray(postToLike?.likes) ? postToLike.likes : [];
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
    <>
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
          const displayAvatar = post.avatar || (post.user === chatUsername || post.user === (loggedInUser?.username ? `@${loggedInUser.username}` : '') ? loggedInUser?.avatar : '') || '';

          return (
            <div id={`community-post-${post._id}`} key={post._id} className="chat-item card-shadow" style={{ flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="chat-avatar-placeholder" style={{
                  width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0e0e0',
                  overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {displayAvatar ? (
                    <img src={displayAvatar} alt={post.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  )}
                </div>
                
                <div className="chat-content" style={{ flex: 1 }}>
                  <div className="chat-user-row">
                    {post.user && post.user !== 'Guest' ? (
                      <Link to={buildProfileRoute(post.user)} className="chat-user" style={{ textDecoration: 'none', color: '#1f2937' }}>
                        {post.user}
                      </Link>
                    ) : (
                      <span className="chat-user">{post.user}</span>
                    )}
                    <span className="chat-time">• {timeAgo(post.createdAt)}</span>
                  </div>
                  {post.text && <div className="chat-text">{post.text}</div>}
                  
                  <div className="chat-actions">
                    <span 
                      onClick={() => handleLike(post._id)}
                      style={{ cursor: 'pointer', color: hasLiked ? '#ff3b30' : 'inherit', transition: 'color 0.2s' }}
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
                  {post.replies && post.replies.map((reply, idx) => {
                    const replyAvatar = reply.avatar || (reply.user === chatUsername ? userAvatar : '') || '';

                    return (
                    <div id={`community-reply-${post._id}-${idx}`} key={idx} className="reply-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e0e0e0',
                        overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {replyAvatar ? (
                          <img src={replyAvatar} alt={reply.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        )}
                      </div>
                      <div>
                        {reply.user && reply.user !== 'Guest' ? (
                          <Link to={buildProfileRoute(reply.user)} className="reply-user" style={{ fontWeight: 'bold', fontSize: '12px', color: '#1f2937', textDecoration: 'none' }}>
                            {reply.user}
                          </Link>
                        ) : (
                          <span className="reply-user" style={{ fontWeight: 'bold', fontSize: '12px' }}>{reply.user}</span>
                        )}
                        <span className="reply-text" style={{ fontSize: '13px', marginLeft: '4px' }}>{reply.text}</span>
                      </div>
                    </div>
                    );
                  })}
                  
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
    </>
  );
};

export default ChatPanel;