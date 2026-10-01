import ReactDOM from 'react-dom';
import React, { useState } from 'react';
import './css/Daily.css';

// Banner and Star Imports
import StarBanner from '../assets/StarBanner.jpg';
import STAR1 from '../assets/STAR1.png';
import STAR2 from '../assets/STAR2.png';
import STAR3 from '../assets/STAR3.png';
import STAR4 from '../assets/STAR4.png';
import STAR5 from '../assets/STAR5.png';
import STAR6 from '../assets/STAR6.png';
import STAR7 from '../assets/STAR7.png';

// Rewards are kept original, wired with the 'STARS' currency tag for the database
const rewardsData = [
  { day: 1, value: 50, currency: 'STARS', icon: STAR1 },
  { day: 2, value: 100, currency: 'STARS', icon: STAR2 },
  { day: 3, value: 250, currency: 'STARS', icon: STAR3 },
  { day: 4, value: 400, currency: 'STARS', icon: STAR4 },
  { day: 5, value: 650, currency: 'STARS', icon: STAR5 },
  { day: 6, value: 800, currency: 'STARS', icon: STAR6 },
];

const Day7Reward = ({ status, onClaim }) => (
    <div className={`daily-card day-7-card ${status}`}>
        <div className="day-7-info">
            <span className="grand-prize-tag">GRAND PRIZE</span>
            <h2>Day 7</h2>
            <p>1,000 STARS</p>
        </div>
        <div className="day-7-visual">
            <img src={STAR7} alt="1,000 STARS" className="day-7-icon" />
        </div>
        <div className="day-7-action">
            {status === 'available' ? (
                <button className="minimal-btn claim-btn" onClick={onClaim}>CLAIM</button>
            ) : status === 'claimed' ? (
                <div className="minimal-btn claimed-btn">CLAIMED</div>
            ) : (
                <div className="minimal-btn upcoming-btn">CLAIM</div>
            )}
        </div>
    </div>
);

const DailyRewardCard = ({ reward, status, onClaim }) => {
    return (
        <div className={`daily-card grid-card ${status}`}>
            <h3 className="card-day">Day {reward.day}</h3>
            
            <div className="reward-visual-container">
                <img src={reward.icon} alt={`${reward.value} ${reward.currency}`} className="reward-icon" />
            </div>
            
            <div className="card-value">
                {reward.value.toLocaleString()} <span className="card-currency">{reward.currency}</span>
            </div>

            <div className="action-container">
                {status === 'available' ? (
                    <button className="minimal-btn claim-btn" onClick={onClaim}>CLAIM</button>
                ) : status === 'claimed' ? (
                    <div className="minimal-btn claimed-btn">CLAIMED</div>
                ) : (
                    <div className="minimal-btn upcoming-btn">CLAIM</div>
                )}
            </div>
        </div>
    );
};

const DailyRewardsModal = ({ 
    isOpen, 
    onClose, 
    onClaimReward,
    currentStreak = 0,       
    hasClaimedToday = false  
}) => {
    // Custom Alert State
    const [alertMessage, setAlertMessage] = useState('');

    // Evaluates status dynamically based on real database properties
    const getDayStatus = (day) => {
        if (day <= currentStreak) return 'claimed';
        if (day === currentStreak + 1 && !hasClaimedToday) return 'available';
        return 'locked';
    };

    // Wrapper function to capture the response message and show the pop-up
    const executeClaim = async (day, value, currency) => {
        const message = await onClaimReward(day, value, currency);
        if (message) {
            setAlertMessage(message);
        }
    };

    if (!isOpen) return null;

    // --- CRITICAL FIX: Wrapped in ReactDOM.createPortal to break out of layout ---
    return ReactDOM.createPortal(
        <div className="daily-rewards-scrim" onClick={onClose}>
            <div className="daily-rewards-container" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                
                {/* Custom Alert Pop-up Overlay */}
                {alertMessage && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(22, 22, 22, 0.6)', backdropFilter: 'blur(3px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        zIndex: 100, borderRadius: 'inherit'
                    }}>
                        <div style={{ 
                            background: 'white', padding: '25px', borderRadius: '15px', 
                            textAlign: 'center', width: '80%', maxWidth: '320px', 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)', color: '#1f2937'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 800 }}>Notice</h3>
                            <p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '15px', fontWeight: 'bold' }}>
                                {alertMessage}
                            </p>
                            <button 
                                onClick={() => setAlertMessage('')} 
                                style={{ 
                                    background: '#2563eb', color: 'white', border: 'none', 
                                    padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', 
                                    fontWeight: 'bold', width: '100%', transition: 'background 0.2s' 
                                }}
                            >
                                Okay
                            </button>
                        </div>
                    </div>
                )}

                {/* The Banner Image */}
                <img src={StarBanner} alt="Claim Your Daily Stars" className="daily-banner-image" />

                <div className="daily-content-wrapper">
                    <div className="daily-header">
                        <h1>Daily Check-In</h1>
                        <p>Checked in for <strong>{currentStreak}</strong> days this month</p>
                    </div>

                    <div className="daily-reward-grid">
                        {rewardsData.map((reward) => (
                            <DailyRewardCard 
                                key={reward.day} 
                                reward={reward} 
                                status={getDayStatus(reward.day)}
                                onClaim={() => executeClaim(reward.day, reward.value, reward.currency)} 
                            />
                        ))}
                    </div>
                    
                    <Day7Reward 
                        status={getDayStatus(7)} 
                        onClaim={() => executeClaim(7, 1000, 'STARS')} 
                    />
                    
                    <button className="daily-close-btn" onClick={onClose}>CLOSE</button>
                </div>
            </div>
        </div>,
        document.body // <-- This tells React to render it over the entire page
    );
};

export default DailyRewardsModal;