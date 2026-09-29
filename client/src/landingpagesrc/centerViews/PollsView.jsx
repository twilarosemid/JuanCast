import React, { useEffect, useState } from 'react';
import '../css/Polls.css';

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
  const [polls, setPolls] = useState([]);
  const [centerIndex, setCenterIndex] = useState(0);
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPolls = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/polls');
        if (!response.ok) throw new Error('Failed to load polls');

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setPolls(data);
          setCenterIndex(Math.min(2, data.length - 1));
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

  return (
    <>
      <div className="section-header" style={{ marginTop: '20px', marginbottom: '10px' }}>
        <h2>Polls</h2>
        <a href="#" className="view-all-link">View All</a>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Loading polls...</div>
      ) : polls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>No active polls found.</div>
      ) : (
        <div className="polls-container">
          <div className="polls-track">
            {polls.map((poll, index) => {
              let diff = index - centerIndex;
              const total = polls.length;

              if (diff > total / 2) diff -= total;
              if (diff < -total / 2) diff += total;

              const isCenter = diff === 0;
              const isVisible = Math.abs(diff) <= 1;
              const spacingMultiplier = isWideScreen ? 320 : 245;
              const offset = diff * spacingMultiplier;
              const scale = isCenter ? 1.1 : 0.92;
              const ended = isPollEnded(poll.toDate);
              const title = ended ? `${poll.title} (Ended)` : poll.title;

              return (
                <div
                  key={poll._id || poll.id || `${poll.title}-${index}`}
                  className={`poll-vcard ${isCenter ? 'active' : ''}`}
                  style={{
                    transform: `translate3d(calc(-50% + ${offset}px), 0, 0) scale(${scale})`,
                    opacity: isVisible ? (isCenter ? 1 : 0.72) : 0,
                    pointerEvents: isVisible ? 'auto' : 'none',
                  }}
                  onClick={() => setCenterIndex(index)}
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