import ReactDOM from 'react-dom';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Rankings.css'; 

const nFormatter = (value = 0) => new Intl.NumberFormat('en-US').format(Number(value || 0));

const RankingsView = () => {
  const [rankings, setRankings] = useState([]);
  const [pollsList, setPollsList] = useState([]); 
  
  // Driven entirely by Admin Dashboard settings
  const [activeGroup, setActiveGroup] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  
  const [featuredPollId, setFeaturedPollId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredRankId, setHoveredRankId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rankingsRes, settingsRes, pollsRes] = await Promise.all([
          fetch('[https://juancast.onrender.com](https://juancast.onrender.com)/api/rankings'),
          fetch('[https://juancast.onrender.com](https://juancast.onrender.com)/api/settings'),
          fetch('[https://juancast.onrender.com](https://juancast.onrender.com)/api/polls')
        ]);

        if (rankingsRes.ok) {
          const rankingsData = await rankingsRes.json();
          setRankings(rankingsData);
        }

        let category = '';
        let group = '';

        if (settingsRes.ok) {
          const rawSettings = await settingsRes.json();
          
          // THE FIX: Safely handles the response whether the API returns an Array or an Object
          const settingsData = Array.isArray(rawSettings) ? (rawSettings[0] || {}) : (rawSettings || {});
          
          group = settingsData.featuredGroup || '';
          category = settingsData.featuredCategory || '';
          
          setActiveGroup(group);
          setActiveCategory(category);
        }

        if (pollsRes.ok) {
          const pollsData = await pollsRes.json();
          
          if (Array.isArray(pollsData)) {
            setPollsList(pollsData);
            
            const safeCategory = (category || '').trim().toLowerCase();
            const safeGroup = (group || '').trim().toLowerCase();

            // 1. Strict Match
            let matchedPoll = pollsData.find(p => 
              (p.title || '').trim().toLowerCase() === safeCategory && 
              (p.group || '').trim().toLowerCase() === safeGroup
            );

            // 2. Semi-Strict Match (Ignores Group typo)
            if (!matchedPoll) {
              matchedPoll = pollsData.find(p => (p.title || '').trim().toLowerCase() === safeCategory);
            }

            if (matchedPoll) {
              setFeaturedPollId(matchedPoll._id || matchedPoll.id);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getYouTubeEmbedUrl = (url, startTime = 0) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^&?]*)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&controls=0&start=${startTime}`;
    }
    return null;
  };

  const filteredRankings = rankings.filter(artist => {
    const safeArtistGroup = (artist.group || '').trim().toLowerCase();
    const safeArtistCategory = (artist.category || '').trim().toLowerCase();
    const safeActiveGroup = (activeGroup || '').trim().toLowerCase();
    const safeActiveCategory = (activeCategory || '').trim().toLowerCase();

    const matchGroup = activeGroup ? safeArtistGroup === safeActiveGroup : true;
    const matchCategory = activeCategory ? safeArtistCategory === safeActiveCategory : true;
    
    return matchGroup && matchCategory;
  });

  const sortedRankings = [...filteredRankings].sort((a, b) => {
    const votesA = Number(a.voteCount || 0);
    const votesB = Number(b.voteCount || 0);
    if (votesA !== votesB) {
      return votesB - votesA; 
    }
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

  const rankedWithPositions = sortedRankings.slice(0, 3).map((item, idx) => ({
    ...item,
    dynamicPosition: idx + 1
  }));

  let arrangedRankings = [];
  let containerLayoutClass = 'podium-three';

  if (rankedWithPositions.length === 1) {
    arrangedRankings = [rankedWithPositions[0]];
    containerLayoutClass = 'podium-one';
  } else if (rankedWithPositions.length === 2) {
    arrangedRankings = [rankedWithPositions[0], rankedWithPositions[1]]; 
    containerLayoutClass = 'podium-two';
  } else if (rankedWithPositions.length === 3) {
    arrangedRankings = [rankedWithPositions[1], rankedWithPositions[0], rankedWithPositions[2]]; 
    containerLayoutClass = 'podium-three';
  }

  // --- Dynamic Title Display ---
  // Will show the exact category set by admin, or "Loading..." while fetching
  const displayTitle = activeCategory || (loading ? 'Loading...' : 'No Category Selected');

  // --- BULLETPROOF ROUTING LOGIC ---
  const handleCastVoteClick = () => {
    const currentUser = JSON.parse(localStorage.getItem('juancast_user') || 'null');
    if (!currentUser?.email) {
      navigate('/login');
      return;
    }

    if (featuredPollId) {
      navigate(`/polls/${featuredPollId}`);
      return;
    }

    if (pollsList.length > 0) {
      const fuzzyMatch = pollsList.find(p => 
        (p.title || '').toLowerCase().includes(activeCategory.toLowerCase()) || 
        activeCategory.toLowerCase().includes((p.title || '').toLowerCase())
      );
      
      if (fuzzyMatch) {
        navigate(`/polls/${fuzzyMatch._id || fuzzyMatch.id}`);
        return;
      }
      navigate(`/polls/${pollsList[0]._id || pollsList[0].id}`);
    } else {
      navigate('/polls');
    }
  };

  return (
    <section className="rankings-view">
      <div className="rankings-view-heading">
        <h2>{displayTitle}</h2>
      </div>

      {/* MAIN PODIUM VIEW */}
      {loading ? (
        <div className="rankings-empty-state">Loading rankings...</div>
      ) : rankedWithPositions.length === 0 ? (
        <div className="rankings-empty-state">No artists available for this category yet.</div>
      ) : (
        <div className={`rankings-container ${containerLayoutClass}`}>
          {arrangedRankings.map((item, index) => {
            const rankPos = item.dynamicPosition;
            const cardClass = rankPos === 1 ? 'gold-card' : rankPos === 2 ? 'silver-card' : rankPos === 3 ? 'bronze-card' : 'standard-card';
            const medal = rankPos === 1 ? '🥇' : rankPos === 2 ? '🥈' : rankPos === 3 ? '🥉' : `#${rankPos}`;
            const itemId = item._id || item.id || `${item.name}-${index}`;

            return (
              <div key={itemId} className={`ranking-card ${cardClass}`}>
                <div className="ranking-medal">{medal}</div>
                
                <div
                  className="ranking-img-placeholder"
                  onMouseEnter={() => setHoveredRankId(itemId)}
                  onMouseLeave={() => setHoveredRankId(null)}
                  style={{
                    backgroundImage: item.imageUrl ? `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${item.imageUrl})` : undefined
                  }}
                >
                  {!item.imageUrl && <span>Image</span>}
                </div>
                
                {hoveredRankId === itemId && item.youtubeUrl && ReactDOM.createPortal(
                  <div className="youtube-hover-scrim">
                    <div className="youtube-video-container">
                      <iframe 
                        src={getYouTubeEmbedUrl(item.youtubeUrl, item.youtubeStartTime)} 
                        title="YouTube video player" 
                        allow="autoplay; encrypted-media" 
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>,
                  document.body
                )}

                <div className="ranking-info">
                  <h3 className="ranking-title">{item.name}</h3>
                  <div className="ranking-votes">{nFormatter(item.voteCount)}</div>
                  
                  <button 
                    className="cast-vote-btn" 
                    onClick={handleCastVoteClick}
                  >
                    CAST VOTE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RankingsView;