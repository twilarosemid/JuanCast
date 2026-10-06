import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import './css/AllVideos.css'; 

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^&?]*)/);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  }
  return null;
};

const AllVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('https://juancast.onrender.com/api/videos?platform=YouTube');
        if (res.ok) {
          const data = await res.json();
          setVideos(data);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const availableGroups = [
    'ALL',
    ...[...new Set(videos.map(v => v.group).filter(group => group && group !== 'ALL'))].sort((a, b) => a.localeCompare(b))
  ];

  const filteredVideos = videos.filter(v => {
    const matchesGroup = activeFilter === 'ALL' || v.group === activeFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (v.title || '').toLowerCase().includes(searchLower) || 
      (v.subtitle || '').toLowerCase().includes(searchLower);
    
    return matchesGroup && matchesSearch;
  });

  const openVideo = (video) => {
    if ((video.platform || 'YouTube') === 'YouTube') {
      setSelectedVideo(video);
      return;
    }

    if (video.youtubeUrl) window.open(video.youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="videos-modern-page">
      <div className="videos-modern-layout">
        
        {/* LEFT SIDEBAR: Search & Group Filters */}
        <aside className="videos-modern-sidebar">
          
          <div className="modern-search-wrapper">
            <input 
              type="text" 
              placeholder="Search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="modern-search-input"
            />
            <div className="modern-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          <div className="video-group-filters">
            {availableGroups.map(group => (
              <button 
                key={group} 
                className={`video-group-filter ${activeFilter === group ? 'active' : ''}`}
                onClick={() => setActiveFilter(group)}
              >
                {group}
              </button>
            ))}
          </div>
          
        </aside>

        {/* RIGHT CONTENT: Video Grid */}
        <main className="videos-modern-main">
          {loading ? (
            <div className="videos-empty-state">Loading content...</div>
          ) : filteredVideos.length === 0 ? (
            <div className="videos-empty-state">No videos found.</div>
          ) : (
            <div className="videos-modern-grid">
              {filteredVideos.map((video) => (
                <div 
                  key={video._id || video.id} 
                  className="modern-video-card"
                  onClick={() => openVideo(video)}
                >
                  <div 
                    className="modern-video-thumbnail"
                    style={{
                      backgroundImage: video.imageUrl 
                        ? `url(${video.imageUrl})` 
                        : 'linear-gradient(135deg, #1e293b, #0f172a)'
                    }}
                  >
                    <div className="video-play-overlay">
                      <div className="play-icon">▶</div>
                    </div>
                  </div>
                  <div className="modern-video-info">
                    <h3 className="modern-video-title">{video.title}</h3>
                    <div className="modern-video-meta">
                      <span className="modern-video-subtitle">{video.platform || 'YouTube'}</span>
                      {video.group && (
                        <span className="modern-video-group">
                          <span className="group-dot"></span> {video.group}
                        </span>
                      )}
                      <span className="modern-video-subtitle">{video.subtitle}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* YOUTUBE MODAL */}
      {selectedVideo && ReactDOM.createPortal(
        <div className="youtube-modal-overlay" onClick={() => setSelectedVideo(null)}>
          <button className="youtube-close-btn" onClick={() => setSelectedVideo(null)}>✕</button>
          <div className="youtube-video-container" onClick={(e) => e.stopPropagation()}>
            <iframe 
              src={getYouTubeEmbedUrl(selectedVideo.youtubeUrl)} 
              title={selectedVideo.title}
              allow="autoplay; encrypted-media; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AllVideos;