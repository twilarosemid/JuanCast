import React, { useEffect, useState } from 'react';
import '../css/Rankings.css';

const nFormatter = (value = 0) => new Intl.NumberFormat('en-US').format(Number(value || 0));

const RankingsView = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Voting Modal State
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [selectedRanking, setSelectedRanking] = useState(null);
  const [voteAmount, setVoteAmount] = useState(1);

  // Custom Feedback/Success Modal State
  const [feedback, setFeedback] = useState({ isOpen: false, message: '', type: 'success' });

  useEffect(() => {
    const loadRankings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/rankings');
        if (!response.ok) throw new Error('Failed to load rankings');

        const data = await response.json();
        if (Array.isArray(data)) {
          setRankings(data);
        }
      } catch (error) {
        console.error('Error fetching rankings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRankings();
  }, []);

  const handleOpenVoteModal = (ranking) => {
    const currentUser = JSON.parse(localStorage.getItem('juancast_user') || 'null');
    if (!currentUser || !currentUser.email) {
      setFeedback({ isOpen: true, message: 'You must be logged in to vote.', type: 'error' });
      return;
    }
    
    setSelectedRanking(ranking);
    setVoteAmount(1);
    setVoteModalOpen(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedRanking) return;
    if (voteAmount <= 0) {
      setFeedback({ isOpen: true, message: 'Please enter a valid vote amount.', type: 'error' });
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem('juancast_user') || 'null');
      
      const response = await fetch(`http://localhost:5000/api/rankings/${selectedRanking._id || selectedRanking.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, currencyType: 'stars', cost: voteAmount })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to cast vote');
      }

      const refreshRes = await fetch('http://localhost:5000/api/rankings');
      if (refreshRes.ok) {
        const freshData = await refreshRes.json();
        setRankings(freshData);
      }

      currentUser.stars = result.remainingStars;
      if (result.remainingSuns !== undefined) currentUser.suns = result.remainingSuns;
      localStorage.setItem('juancast_user', JSON.stringify(currentUser));
      window.dispatchEvent(new Event('juancast-user-updated'));

      setFeedback({ 
        isOpen: true, 
        message: `Successfully voted with ${voteAmount} Star(s) ⭐!\n\nRemaining Stars: ${result.remainingStars}`, 
        type: 'success' 
      });
      
      setVoteModalOpen(false);

    } catch (error) {
      console.error('Error casting vote:', error);
      setFeedback({ isOpen: true, message: error.message || 'Error casting vote.', type: 'error' });
    }
  };

  // 1. Sort by votes
  const sortedRankings = [...rankings].sort((a, b) => {
    const votesA = Number(a.voteCount || 0);
    const votesB = Number(b.voteCount || 0);
    if (votesA !== votesB) {
      return votesB - votesA; 
    }
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

  // 2. SLICE TO TOP 3 ONLY BEFORE MAPPING POSITIONS
  const rankedWithPositions = sortedRankings.slice(0, 3).map((item, idx) => ({
    ...item,
    dynamicPosition: idx + 1
  }));

  // 3. Arrangement Logic strictly limits to whatever is in rankedWithPositions (Max 3)
  let arrangedRankings = [];
  let containerLayoutClass = 'podium-three';

  if (rankedWithPositions.length === 1) {
    arrangedRankings = [rankedWithPositions[0]];
    containerLayoutClass = 'podium-one';
  } else if (rankedWithPositions.length === 2) {
    arrangedRankings = [rankedWithPositions[0], rankedWithPositions[1]]; 
    containerLayoutClass = 'podium-two';
  } else if (rankedWithPositions.length === 3) {
    // 2nd Place on Left, 1st Place Center, 3rd Place Right
    arrangedRankings = [rankedWithPositions[1], rankedWithPositions[0], rankedWithPositions[2]]; 
    containerLayoutClass = 'podium-three';
  }

  return (
    <>
      <div className="carousel-banner card-shadow">
        <div className="img-placeholder-text">Banner Image Placeholder</div>
        <div className="carousel-dots">
          <span className="dot"></span><span className="dot active"></span><span className="dot"></span>
        </div>
      </div>

      <div className="section-header rankings-header">
        <h2>Rankings</h2>
        <a href="#" className="view-all-link">View All</a>
      </div>

      {loading ? (
        <div className="rankings-empty-state">Loading rankings...</div>
      ) : rankedWithPositions.length === 0 ? (
        <div className="rankings-empty-state">No rankings available yet. Add some from the Admin Dashboard!</div>
      ) : (
        <div className={`rankings-container ${containerLayoutClass}`}>
          {arrangedRankings.map((item, index) => {
            const rankPos = item.dynamicPosition;
            const cardClass = rankPos === 1 ? 'gold-card' : rankPos === 2 ? 'silver-card' : rankPos === 3 ? 'bronze-card' : 'standard-card';
            const medal = rankPos === 1 ? '🥇' : rankPos === 2 ? '🥈' : rankPos === 3 ? '🥉' : `#${rankPos}`;

            return (
              <div key={item._id || item.id || `${item.name}-${index}`} className={`ranking-card ${cardClass}`}>
                <div className="ranking-medal">{medal}</div>
                <div
                  className="ranking-img-placeholder"
                  style={{
                    backgroundImage: item.imageUrl ? `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${item.imageUrl})` : undefined
                  }}
                >
                  {!item.imageUrl && <span>Image</span>}
                </div>
                <div className="ranking-info">
                  <h3 className="ranking-title">{item.name}</h3>
                  <div className="ranking-votes">{nFormatter(item.voteCount)}</div>
                  <button className="cast-vote-btn" onClick={() => handleOpenVoteModal(item)}>CAST VOTE</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- VOTING INPUT MODAL UI --- */}
      {voteModalOpen && (
        <div className="vote-modal-overlay" onClick={() => setVoteModalOpen(false)}>
          <div className="vote-modal-content card-shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="vote-modal-title">Cast Your Vote</h3>
            <p className="vote-modal-subtitle">
              Voting for: <strong>{selectedRanking?.name}</strong>
            </p>

            <div className="vote-modal-form-group">
              <label className="vote-modal-label">Number of Stars to use</label>
              <input 
                type="number" 
                min="1" 
                value={voteAmount} 
                onChange={(e) => setVoteAmount(Number(e.target.value))}
                className="vote-modal-input"
              />
            </div>

            <div className="vote-modal-actions">
              <button className="vote-modal-cancel-btn" onClick={() => setVoteModalOpen(false)}>
                Cancel
              </button>
              <button className="vote-modal-confirm-btn" onClick={handleConfirmVote}>
                Confirm Vote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM FEEDBACK/SUCCESS MODAL --- */}
      {feedback.isOpen && (
        <div className="vote-modal-overlay feedback-level" onClick={() => setFeedback({ ...feedback, isOpen: false })}>
          <div className="vote-modal-content card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-icon">
              {feedback.type === 'success' ? '🎉' : '⚠️'}
            </div>
            <h3 className={`vote-modal-title feedback-title ${feedback.type}`}>
              {feedback.type === 'success' ? 'Success!' : 'Oops!'}
            </h3>
            <p className="feedback-message">
              {feedback.message}
            </p>
            <button className="feedback-btn" onClick={() => setFeedback({ ...feedback, isOpen: false })}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RankingsView;