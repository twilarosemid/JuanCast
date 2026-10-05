import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import './css/Polls.css'; 

// 1. Import your local category logo asset here
import categoryLogo from '../assets/category_logo.png'; 

const nFormatter = (value = 0) => new Intl.NumberFormat('en-US').format(Number(value || 0));

const PollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [poll, setPoll] = useState(null);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [selectedRanking, setSelectedRanking] = useState(null);
  const [voteAmount, setVoteAmount] = useState(1);
  const [feedback, setFeedback] = useState({ isOpen: false, message: '', type: 'success' });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLiveTime = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${yyyy}-${mm}-${dd} ${time} PHT`;
  };

  useEffect(() => {
    const fetchPollData = async () => {
      try {
        const [pollsRes, rankingsRes] = await Promise.all([
          fetch('http://[https://juancast.onrender.com](https://juancast.onrender.com)/api/polls'),
          fetch('http://[https://juancast.onrender.com](https://juancast.onrender.com)/api/rankings')
        ]);

        const pollsData = await pollsRes.json();
        const rankingsData = await rankingsRes.json();
        const currentPoll = pollsData.find(p => p._id === id || p.id === id);
        
        if (currentPoll) {
          setPoll(currentPoll);
          const pollArtists = rankingsData.filter(r => 
            r.group === currentPoll.group && r.category === currentPoll.title
          );
          pollArtists.sort((a, b) => Number(b.voteCount) - Number(a.voteCount));
          setArtists(pollArtists);
        } else {
          setPoll(null);
        }
      } catch (error) {
        console.error("Error fetching poll details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPollData();
  }, [id]);

  const handleOpenVoteModal = (artist) => {
    const currentUser = JSON.parse(localStorage.getItem('juancast_user') || 'null');
    if (!currentUser || !currentUser.email) {
      navigate('/login');
      return;
    }
    setSelectedRanking(artist);
    setVoteAmount(1);
    setVoteModalOpen(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedRanking || voteAmount <= 0) return;
    try {
      const currentUser = JSON.parse(localStorage.getItem('juancast_user') || 'null');
      const response = await fetch(`http://[https://juancast.onrender.com](https://juancast.onrender.com)/api/rankings/${selectedRanking._id || selectedRanking.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, currencyType: 'stars', cost: voteAmount })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to cast vote');

      const refreshRes = await fetch('http://[https://juancast.onrender.com](https://juancast.onrender.com)/api/rankings');
      if (refreshRes.ok) {
        const freshRankings = await refreshRes.json();
        const pollArtists = freshRankings.filter(r => r.group === poll.group && r.category === poll.title);
        pollArtists.sort((a, b) => Number(b.voteCount) - Number(a.voteCount));
        setArtists(pollArtists);
      }

      currentUser.stars = result.remainingStars;
      if (result.remainingSuns !== undefined) currentUser.suns = result.remainingSuns;
      localStorage.setItem('juancast_user', JSON.stringify(currentUser));
      window.dispatchEvent(new Event('juancast-user-updated'));

      setFeedback({ isOpen: true, message: `Successfully voted with ${voteAmount} Star(s) ⭐!\nRemaining: ${result.remainingStars}`, type: 'success' });
      setVoteModalOpen(false);
    } catch (error) {
      setFeedback({ isOpen: true, message: error.message || 'Error casting vote.', type: 'error' });
    }
  };

  const formatPollDates = (start, end) => {
    const optionsDate = { month: 'long', day: 'numeric', year: 'numeric' };
    const sDate = new Date(start).toLocaleDateString('en-US', optionsDate);
    const eDate = new Date(end).toLocaleDateString('en-US', optionsDate);
    const eTime = new Date(end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${sDate} - ${eDate} at ${eTime}`;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Poll...</div>;
  if (!poll) return <div style={{ textAlign: 'center', padding: '50px' }}>Poll not found.</div>;

  return (
    <div className="poll-detail-layout">
      
      {/* 1: IMAGE BANNER */}
      <div 
        className="poll-detail-banner"
        style={{ backgroundImage: poll.imageUrl ? `url(${poll.imageUrl})` : 'none' }}
      ></div>

      {/* 2: INFO BOX */}
      <div className="poll-detail-info-box">
        <div className="poll-timer-bar">
          {formatLiveTime(currentTime)}
        </div>
        <div className="poll-info-content">
          <h1 className="poll-title">{poll.title}</h1>
          <div className="poll-dates">{formatPollDates(poll.fromDate, poll.toDate)}</div>
          <div className="poll-type">{poll.type}</div>
          <p className="poll-description">
            {poll.description || "Vote for your idol who continues to impress fans with their versatility and all-around talent. Show your support!"}
          </p>
        </div>
      </div>

      {/* 3: ARTIST LIST */}
      <div className="poll-artist-list">
        {artists.length === 0 ? (
          <div className="empty-artists">No artists assigned to this poll yet.</div>
        ) : (
          artists.map((artist, index) => (
            <div key={artist._id} className="artist-row">
              <div className="artist-rank">{index + 1}</div>
              <img 
                src={artist.imageUrl || 'https://via.placeholder.com/60'} 
                alt={artist.name} 
                className="artist-avatar"
              />
              <div className="artist-name">{artist.name}</div>
              <div className="artist-spacer"></div>
              <div className="artist-votes">{nFormatter(artist.voteCount)}</div>
              
              {/* VOTE BUTTON (Now uses your imported local asset) */}
              <button 
                className="artist-vote-btn"
                onClick={() => handleOpenVoteModal(artist)}
                title="Cast Vote"
              >
                <img 
                  src={categoryLogo} 
                  alt="Vote" 
                  className="vote-category-logo"
                />
              </button>
            </div>
          ))
        )}
      </div>

      {/* MODALS */}
      {voteModalOpen && ReactDOM.createPortal(
        <div className="vote-modal-overlay" onClick={() => setVoteModalOpen(false)}>
          <div className="vote-modal-content card-shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="vote-modal-title">Cast Your Vote</h3>
            <p className="vote-modal-subtitle">Voting for: <strong>{selectedRanking?.name}</strong></p>
            <div className="vote-modal-form-group">
              <label className="vote-modal-label">Number of Stars to use</label>
              <input type="number" min="1" value={voteAmount} onChange={(e) => setVoteAmount(Number(e.target.value))} className="vote-modal-input" />
            </div>
            <div className="vote-modal-actions">
              <button className="vote-modal-cancel-btn" onClick={() => setVoteModalOpen(false)}>Cancel</button>
              <button className="vote-modal-confirm-btn" onClick={handleConfirmVote}>Confirm Vote</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {feedback.isOpen && ReactDOM.createPortal(
        <div className="vote-modal-overlay feedback-level" onClick={() => setFeedback({ ...feedback, isOpen: false })}>
          <div className="vote-modal-content card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-icon">{feedback.type === 'success' ? '🎉' : '⚠'}</div>
            <h3 className={`vote-modal-title feedback-title ${feedback.type}`}>{feedback.type === 'success' ? 'Success!' : 'Oops!'}</h3>
            <p className="feedback-message">{feedback.message}</p>
            <button className="feedback-btn" onClick={() => setFeedback({ ...feedback, isOpen: false })}>Got it</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PollDetail;