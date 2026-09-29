import React from 'react';
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
    currentStreak = 0,       // Pulled from database via parent component
    hasClaimedToday = false  // Pulled from database via parent component
}) => {

    // Evaluates status dynamically based on real database properties
    const getDayStatus = (day) => {
        if (day <= currentStreak) return 'claimed';
        if (day === currentStreak + 1 && !hasClaimedToday) return 'available';
        return 'locked';
    };

    if (!isOpen) return null;

    return (
        <div className="daily-rewards-scrim" onClick={onClose}>
            <div className="daily-rewards-container" onClick={e => e.stopPropagation()}>
                
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
                                // Fires the DB function with day, value, and 'STARS'
                                onClaim={() => onClaimReward(reward.day, reward.value, reward.currency)} 
                            />
                        ))}
                    </div>
                    
                    <Day7Reward 
                        status={getDayStatus(7)} 
                        // Fires the DB function for Day 7 with 1000 and 'STARS'
                        onClaim={() => onClaimReward(7, 1000, 'STARS')} 
                    />
                    
                    <button className="daily-close-btn" onClick={onClose}>CLOSE</button>
                </div>
            </div>
        </div>
    );
};

export default DailyRewardsModal;