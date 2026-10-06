import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import '../css/YoutubeContent.css';

const YouTubeContent = () => {
  const scrollRef = useRef(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track which video is clicked for the modal
  const [activeVideoId, setActiveVideoId] = useState(null);
  
  // Force the hover scale using React state instead of CSS
  const [hoveredCardId, setHoveredCardId] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('[https://juancast.onrender.com](https://juancast.onrender.com)/api/videos');
        if (!response.ok) throw new Error('Failed to load videos');
        
        const data = await response.json();
        setVideos(data);
      } catch (error) {
        console.error('Error fetching YouTube content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // --- FIXED: Buttery Smooth Scrolling ---
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      // Prevent vertical page scroll while hovering the carousel
      e.preventDefault(); 
      // Add the exact wheel/trackpad velocity directly to the horizontal scroll
      // This removes the chunky 100px steps and animation clashes
      el.scrollLeft += e.deltaY; 
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [videos]);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^&?]*)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
    }
    return null;
  };

  return (
    <div style={{ width: '100%', marginTop: '30px', marginBottom: '40px' }}>

      <div className="section-header" style={{ marginBottom: '15px' }}>
        <h2>Youtube Content</h2>
        <Link to="/videos" className="view-all-link">View All</Link>
      </div>

      <div style={{ width: '100%', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ color: '#666', fontWeight: 'bold', padding: '10px 0' }}>Loading videos...</div>
        ) : videos.length === 0 ? (
          <div style={{ color: '#666', fontWeight: 'bold', padding: '10px 0' }}>No videos available.</div>
        ) : (
          <div
            className="yt-scroll-container"
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: '15px',
              overflowX: 'auto',
              padding: '20px 25px 20px 5px',
              alignItems: 'center',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollBehavior: 'auto'
            }}
          >
            {videos.map((video) => {
              const videoId = video._id || video.id;
              const isHovered = hoveredCardId === videoId;

              return (
                <div
                  key={videoId}
                  className="yt-card"
                  onMouseEnter={() => setHoveredCardId(videoId)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  onClick={() => setActiveVideoId(videoId)}
                  style={{
                    flex: '0 0 340px',
                    height: '191px',
                    borderRadius: '12px',
                    position: 'relative',
                    cursor: 'pointer',
                    backgroundColor: '#000',
                    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                    zIndex: isHovered ? 10 : 1,
                    boxShadow: isHovered
                      ? '0 20px 40px rgba(0, 0, 0, 0.5)'
                      : '0 10px 20px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.25s ease, z-index 0s'
                  }}
                >
                  <div
                    className="yt-card-image"
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundImage: video.imageUrl
                        ? `url(${video.imageUrl})`
                        : 'linear-gradient(135deg, #1e293b, #0f172a)'
                    }}
                  >
                    <div className="yt-card-overlay" style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '30px 15px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.6) 50%, transparent 100%)'
                    }}>
                      <h3 className="yt-card-main-title" style={{ color: '#fff', fontSize: '14px', margin: '0 0 4px 0' }}>
                        {video.title}
                      </h3>
                      <p className="yt-card-subtitle" style={{ color: '#ccc', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>
                        {video.subtitle || 'YOUTUBE CONTENT'}
                      </p>
                    </div>
                  </div>

                  {activeVideoId === videoId && video.youtubeUrl && ReactDOM.createPortal(
                    <div
                      className="youtube-hover-scrim"
                      style={{ pointerEvents: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveVideoId(null);
                      }}
                    >
                      <div className="youtube-video-container" onClick={(e) => e.stopPropagation()}>
                        <iframe
                          src={getYouTubeEmbedUrl(video.youtubeUrl)}
                          title="YouTube video player"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeContent;