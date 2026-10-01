import React, { useEffect, useState } from 'react';
import '../css/Polls.css';

// 1. IMPORT YOUR MP3 FILE HERE
import reneSound from '../../assets/rene.mp3'; 

const formatPollDate = (fromDate, toDate) => {
  if (!fromDate) return 'Date unavailable';
  const start = new Date(fromDate);
  if (Number.isNaN(start.getTime())) return 'Date unavailable';

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (!toDate) return formatter.format(start);
  const end = new Date(toDate);
  if (Number.isNaN(end.getTime())) return formatter.format(start);

  return `${formatter.format(start)} – ${formatter.format(end)}`;
};

const isPollEnded = (toDate) => {
  if (!toDate) return false;
  const date = new Date(toDate);
  return !Number.isNaN(date.getTime()) && date < new Date();
};

const PollsView = () => {
  const [originalPolls, setOriginalPolls] = useState([]);
  const [centerIndex, setCenterIndex] = useState(0);
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    const loadPolls = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/polls');
        if (!response.ok) throw new Error('Failed to load polls');

        const data = await response.json();
        
        if (Array.isArray(data)) {
          // --- NEW: Filter out any polls that have already ended ---
          const activePolls = data.filter(poll => !isPollEnded(poll.toDate));
          
          setOriginalPolls(activePolls);
          
          // Only set the center index if there are actually active polls left
          if (activePolls.length > 0) {
            setCenterIndex(Math.min(1, activePolls.length - 1));
          }
        }
      } catch (error) {
        console.error('Error fetching polls:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleResize = () => setIsWideScreen(window.innerWidth >= 1400);
    handleResize();
    window.addEventListener('resize', handleResize);
    loadPolls();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePollClick = (index, poll) => {
    setCenterIndex(index);

    if (poll.title === "RENE BATERBONIA") {
      const audio = new Audio(reneSound);
      audio.volume = 1.0; 
      audio.play().catch(err => console.log('Audio playback blocked:', err));
    }
  };

  // --- INFINITE LOOP LOGIC ---
  // If we have fewer than 5 polls, duplicate them seamlessly so the loop never runs out of cards.
let displayPolls = [...originalPolls];
  if (displayPolls.length > 0 && displayPolls.length < 7) {
    while (displayPolls.length < 7) {
      displayPolls = [...displayPolls, ...originalPolls];
    }
  }
  return (
    <>
      <div className="section-header" style={{ marginTop: '20px', marginBottom: '10px' }}>
        <h2>Polls</h2>
        <a href="#" className="view-all-link">View All</a>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Loading polls...</div>
      ) : originalPolls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>No active polls found.</div>
      ) : (
        <div className="polls-container">
          <div className="polls-track">
            {displayPolls.map((poll, index) => {
              // Calculate distance from center
              let diff = index - centerIndex;
              const total = displayPolls.length;

              // --- THE MAGIC INFINITE WRAP-AROUND MATH ---
              if (diff > Math.floor(total / 2)) diff -= total;
              if (diff < -Math.floor(total / 2)) diff += total;

              const isCenter = diff === 0;
              const isVisible = Math.abs(diff) <= 2; 
              
              const spacingMultiplier = isWideScreen ? 320 : 245;
              const offset = diff * spacingMultiplier;
              
              // Tiered visual effects based on distance from the center
              const scale = isCenter ? 1.1 : Math.abs(diff) === 1 ? 0.92 : 1;
              
              // Smoothly fade out the edges
              const opacity = isCenter ? 1 : Math.abs(diff) === 1 ? 0.72 : Math.abs(diff) === 2 ? 0.2 : 0;
              const blur = isCenter ? '0px' : Math.abs(diff) === 1 ? '1.2px' : Math.abs(diff) === 2 ? '3px' : '5px';
              
              // Forces invisible wrapping cards to fly BEHIND the visible cards
              const zIndex = isVisible ? 10 - Math.abs(diff) : -1;
              
              const ended = isPollEnded(poll.toDate);
              const title = ended ? `${poll.title} (Ended)` : poll.title;

return (
                <div
                  key={`${poll._id || poll.id || poll.title}-${index}`}
                  className={`poll-vcard ${isCenter ? 'active' : ''}`}
                  style={{
                    /* 1. Add top: 50% to override the CSS top: 0 */
                    top: '50%', 
                    
                    /* 2. Change the middle 0 to -50% in the translate3d string */
                    transform: `translate3d(calc(-50% + ${offset}px), -50%, 0) scale(${scale})`, 
                    
                    opacity: opacity,
                    filter: `blur(${blur})`,
                    pointerEvents: isVisible ? 'auto' : 'none',
                    zIndex: zIndex 
                  }}
                  onClick={() => handlePollClick(index, poll)}
                >
                  <div
                    className="poll-vcard-image"
                    style={{
                      backgroundImage: poll.imageUrl 
                        ? `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.5)), url(${poll.imageUrl})` 
                        : 'linear-gradient(135deg, #1e293b, #0f172a)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {!poll.imageUrl && <span style={{ color: '#94a3b8', fontWeight: '600' }}>Poll Image</span>}
                  </div>
                  <div className="poll-vcard-content">
                    <h3 className="poll-vcard-title">{title}</h3>
                    <p className="poll-vcard-date">{formatPollDate(poll.fromDate, poll.toDate)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default PollsView;