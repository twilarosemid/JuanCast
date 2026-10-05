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
    const [alertMessage, setAlertMessage] = useState('');
    
    // NEW: State to hold the reward data for the celebratory pop-up
    const [successReward, setSuccessReward] = useState(null);

    const getDayStatus = (day) => {
        if (day <= currentStreak) return 'claimed';
        if (day === currentStreak + 1 && !hasClaimedToday) return 'available';
        return 'locked';
    };

    // Modified to receive the icon and handle boolean success from LandingLayout
    const executeClaim = async (day, value, currency, icon) => {
        const result = await onClaimReward(day, value, currency);
        
        if (result === true) {
            // If successful, show the celebratory pop-up
            setSuccessReward({ day, value, currency, icon });
        } else if (typeof result === 'string') {
            // If it returns a string, it's an error message
            setAlertMessage(result);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="daily-rewards-scrim" onClick={onClose}>
            <div className="daily-rewards-container" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                
                {/* 1. Celebratory Claim Success Pop-up */}
                {successReward && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        zIndex: 110, borderRadius: 'inherit'
                    }}>
                        <div style={{ 
                            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', 
                            padding: '40px 30px', borderRadius: '24px', 
                            textAlign: 'center', width: '85%', maxWidth: '340px', 
                            boxShadow: '0 20px 50px rgba(0,0,0,0.4), 0 0 0 4px rgba(250, 204, 21, 0.3)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            animation: 'slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}>
                            <h2 style={{ margin: '0 0 24px 0', color: '#1e293b', fontSize: '24px', fontWeight: 800 }}>
                                Day {successReward.day} Claimed!
                            </h2>
                            
                            <div style={{
                                width: '110px', height: '110px', borderRadius: '50%', 
                                background: '#fef3c7', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                marginBottom: '24px', boxShadow: '0 10px 25px rgba(250, 204, 21, 0.4)'
                            }}>
                                <img src={successReward.icon} alt="Reward" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                            </div>

                            <div style={{ fontSize: '32px', fontWeight: 900, color: '#d97706', marginBottom: '8px' }}>
                                +{successReward.value.toLocaleString()} <span style={{ fontSize: '18px' }}>{successReward.currency}</span>
                            </div>
                            
                            <p style={{ margin: '0 0 30px 0', color: '#64748b', fontSize: '15px' }}>
                                Awesome! Come back tomorrow to keep your streak alive.
                            </p>

                            <button 
                                onClick={() => {
                                    setSuccessReward(null);
                                    onClose(); // Closes the whole modal after claiming
                                }} 
                                style={{ 
                                    background: '#1e88e5', color: 'white', border: 'none', 
                                    padding: '16px 24px', borderRadius: '12px', cursor: 'pointer', 
                                    fontWeight: 'bold', fontSize: '16px', width: '100%', 
                                    boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)',
                                    transition: 'transform 0.1s'
                                }}
                                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. Error/Notice Pop-up Overlay */}
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
                                    background: '#1e88e5', color: 'white', border: 'none', 
                                    padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', 
                                    fontWeight: 'bold', width: '100%' 
                                }}
                            >
                                Okay
                            </button>
                        </div>
                    </div>
                )}

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
                                // Pass the icon directly into executeClaim here
                                onClaim={() => executeClaim(reward.day, reward.value, reward.currency, reward.icon)} 
                            />
                        ))}
                    </div>
                    
                    <Day7Reward 
                        status={getDayStatus(7)} 
                        onClaim={() => executeClaim(7, 1000, 'STARS', STAR7)} 
                    />
                    
                    <button className="daily-close-btn" onClick={onClose}>CLOSE</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DailyRewardsModal;