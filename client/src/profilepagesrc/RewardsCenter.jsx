import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgimatLogo from '../assets/agimat_ni_juan_logo.webp';
import Spins20Image from '../assets/20spins.png';
import AdsImage from '../assets/ads.png';
import StarCurr from '../assets/StarCurr.png';
import './css/RewardsCenter.css';

const wheelPrizes = [
  { key: 'stars', title: '500,000 Stars', detail: 'Star reward', image: StarCurr },
  null,
  { key: 'agimat', title: 'Agimat ni Juan', detail: '30-minute voting boost', image: AgimatLogo },
  null,
  { key: 'spins', title: '+20 Spins', detail: 'Extra roulette spins', image: Spins20Image, imageWide: true },
  null,
  { key: 'reset-ads', title: 'Reset Ads', detail: 'Ad counter reset', image: AdsImage, imageWide: true },
  null,
  { key: 'agimat', title: 'Agimat ni Juan', detail: '30-minute voting boost', image: AgimatLogo },
  null,
  { key: 'spins', title: '+20 Spins', detail: 'Extra roulette spins', image: Spins20Image, imageWide: true },
  null,
  { key: 'save-ads', title: 'Save Ads', detail: 'Ad reward', image: AdsImage, imageWide: true },
  null,
  { key: 'agimat', title: 'Agimat ni Juan', detail: '30-minute voting boost', image: AgimatLogo },
  null,
  null,
  null
];

const rewardTabs = [
  { id: 'bayong', label: 'Bayong', icon: '▣' },
  { id: 'daily', label: 'Daily Stars', icon: '✦' },
  { id: 'swerte', label: 'Swerte', icon: '◉' },
  { id: 'events', label: 'Events', icon: '◇' }
];

const parseApiResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('The Swerte spin service returned an unexpected response.');
  }
  return response.json();
};

const RewardsCenter = ({ loggedInUser, dailyStreak = 0, onClose, onOpenDaily }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bayong');
  const [inventory, setInventory] = useState([]);
  const [swerteSpinsRemaining, setSwerteSpinsRemaining] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinMessage, setSpinMessage] = useState('');
  const [rewardMessage, setRewardMessage] = useState('');
  const [redeemingRewardId, setRedeemingRewardId] = useState(null);
  const storageKey = `juancast_rewards_${encodeURIComponent(loggedInUser?.email || 'guest')}`;
  const hasSpunToday = swerteSpinsRemaining === 0;

  useEffect(() => {
    try {
      const savedRewards = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setInventory(Array.isArray(savedRewards.inventory) ? savedRewards.inventory : []);
      setWheelRotation(Number(savedRewards.wheelRotation) || 0);
    } catch {
      setInventory([]);
      setWheelRotation(0);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!loggedInUser?.email) {
      setSwerteSpinsRemaining(null);
      return undefined;
    }

    const controller = new AbortController();
    fetch(`http://[https://juancast.onrender.com](https://juancast.onrender.com)/api/users/swerte-spin-status?email=${encodeURIComponent(loggedInUser.email)}`, {
      signal: controller.signal
    })
      .then(async response => {
        const result = await parseApiResponse(response);
        if (!response.ok) throw new Error(result.message || 'Could not load Swerte spins.');
        setSwerteSpinsRemaining(result.spinsRemaining);
      })
      .catch(error => {
        if (error.name !== 'AbortError') setSpinMessage(error.message || 'Could not load Swerte spins.');
      });

    return () => controller.abort();
  }, [loggedInUser?.email]);

  const saveRewardState = (nextInventory, nextRotation) => {
    const nextState = {
      inventory: nextInventory,
      wheelRotation: nextRotation
    };
    localStorage.setItem(storageKey, JSON.stringify(nextState));
    setInventory(nextInventory);
    setWheelRotation(nextRotation);
  };

  const spinWheel = async () => {
    if (!loggedInUser?.email) {
      navigate('/login');
      return;
    }
    if (isSpinning || swerteSpinsRemaining !== 1) return;

    setIsSpinning(true);
    setSpinMessage('');
    try {
      const response = await fetch('http://[https://juancast.onrender.com](https://juancast.onrender.com)/api/users/swerte-spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loggedInUser.email })
      });
      const result = await parseApiResponse(response);
      if (!response.ok) {
        if (Number.isInteger(result.spinsRemaining)) setSwerteSpinsRemaining(result.spinsRemaining);
        throw new Error(result.message || 'Could not use your Swerte spin.');
      }

      setSwerteSpinsRemaining(result.spinsRemaining);
      const prizeIndexes = wheelPrizes.reduce((indexes, prize, index) => {
        if (prize) indexes.push(index);
        return indexes;
      }, []);
      const prizeIndex = prizeIndexes[Math.floor(Math.random() * prizeIndexes.length)];
      const prize = wheelPrizes[prizeIndex];
      const prizeCenter = prizeIndex * (360 / wheelPrizes.length);
      const adjustment = (360 - ((wheelRotation + prizeCenter) % 360)) % 360;
      const nextRotation = wheelRotation + (360 * 6) + adjustment;

      setWheelRotation(nextRotation);
      await new Promise(resolve => window.setTimeout(resolve, 5200));

      const wonItem = {
        ...prize,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        receivedAt: new Date().toISOString(),
        used: false
      };
      saveRewardState([wonItem, ...inventory], nextRotation);
      setSpinMessage(`${prize.title} added to your Bayong.`);
    } catch (error) {
      setSpinMessage(error.message || 'Could not use your Swerte spin.');
    } finally {
      setIsSpinning(false);
    }
  };

  const handleUseReward = async (item) => {
    if (item.used || redeemingRewardId) return;

    setRewardMessage('');
    if (item.key === 'spins') {
      if (!loggedInUser?.email) {
        navigate('/login');
        return;
      }

      setRedeemingRewardId(item.id);
      try {
        const response = await fetch('http://[https://juancast.onrender.com](https://juancast.onrender.com)/api/users/market-spin-bonus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loggedInUser.email, rewardId: item.id })
        });
        const result = await parseApiResponse(response);
        if (!response.ok) throw new Error(result.message || 'Could not add Market spins.');

        window.dispatchEvent(new CustomEvent('juancast-market-spin-updated', {
          detail: { email: loggedInUser.email, spinsRemaining: result.spinsRemaining }
        }));
        setRewardMessage(`20 Market spins added. You now have ${result.spinsRemaining} spins.`);
      } catch (error) {
        setRewardMessage(error.message || 'Could not add Market spins.');
        return;
      } finally {
        setRedeemingRewardId(null);
      }
    }

    const nextInventory = inventory.map(reward =>
      reward.id === item.id ? { ...reward, used: true } : reward
    );
    saveRewardState(nextInventory, wheelRotation);
  };

  const renderTab = () => {
    if (activeTab === 'daily') {
      return (
        <section className="rewards-daily-view">
          <div className="rewards-daily-summary">
            <img src={StarCurr} alt="" />
            <div>
              <h2>Daily Stars</h2>
              <p>{dailyStreak} day{dailyStreak === 1 ? '' : 's'} checked in this month</p>
            </div>
          </div>
          <button className="rewards-primary-button" type="button" onClick={onOpenDaily}>Open Daily Check-In</button>
        </section>
      );
    }

    if (activeTab === 'swerte') {
      return (
        <section className="rewards-swerte-view">
          <div className="rewards-wheel-stage">
            <div className="rewards-wheel-pointer" aria-hidden="true" />
            <div className={`rewards-wheel${isSpinning ? ' is-spinning' : ''}`} style={{ transform: `rotate(${wheelRotation}deg)` }} aria-label="Swerte prize wheel">
              {wheelPrizes.map((_, index) => {
                const prize = wheelPrizes[index];
                if (!prize) return null;

                const angle = index * (360 / wheelPrizes.length);
                const angleRadians = (angle * Math.PI) / 180;
                return (
                  <div
                    className={`rewards-wheel-label${prize.key === 'stars' ? ' rewards-wheel-label-stars' : ''}`}
                    key={`${prize.key}-${index}`}
                    style={{
                      left: `${50 + Math.sin(angleRadians) * 39}%`,
                      top: `${50 - Math.cos(angleRadians) * 39}%`,
                      transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`
                    }}
                  >
                    {prize.image ? <img className={prize.imageWide ? 'rewards-wheel-image-wide' : ''} src={prize.image} alt="" /> : <span>{prize.icon}</span>}
                    {prize.key === 'stars' && <strong>500K</strong>}
                  </div>
                );
              })}
              <div className="rewards-wheel-hub" aria-hidden="true">✦</div>
            </div>
          </div>
          <p className="rewards-wheel-count">
            {loggedInUser?.email
              ? swerteSpinsRemaining === null
                ? 'Loading daily Swerte spin...'
                : hasSpunToday
                  ? '0 Swerte spins left. Come back tomorrow.'
                  : `${swerteSpinsRemaining} Swerte spin left. Refreshes daily at midnight Pacific Time.`
              : 'Log in to see your daily Swerte spin.'}
          </p>
          <button
            className="rewards-primary-button rewards-wheel-button"
            type="button"
            onClick={spinWheel}
            disabled={isSpinning || (Boolean(loggedInUser?.email) && swerteSpinsRemaining !== 1)}
          >
            {!loggedInUser?.email ? 'Log in to Spin' : isSpinning ? 'Spinning...' : swerteSpinsRemaining === null ? 'Loading Spins...' : hasSpunToday ? 'Already Spun Today' : 'Spin the Wheel'}
          </button>
          <p className="rewards-wheel-message" role="status">{spinMessage || '\u00a0'}</p>
        </section>
      );
    }

    if (activeTab === 'events') {
      return (
        <section className="rewards-empty-state">
          <span aria-hidden="true">◇</span>
          <h2>No active events</h2>
          <p>Event rewards will appear here when available.</p>
        </section>
      );
    }

    return (
      <section className="rewards-inventory-view">
        {inventory.length ? inventory.map(item => (
          <article className="rewards-item" key={item.id}>
            <div className="rewards-item-icon">
              {item.image ? <img className={item.imageWide ? 'rewards-item-icon-wide' : ''} src={item.image} alt="" /> : <span>{item.icon}</span>}
            </div>
            <div className="rewards-item-copy">
              <h2>{item.title}</h2>
              <p>{item.detail}</p>
              <span>{new Date(item.receivedAt).toLocaleDateString()}</span>
            </div>
            <button className="rewards-item-action" type="button" disabled={item.used || redeemingRewardId === item.id} onClick={() => handleUseReward(item)}>
              {item.used ? (item.key === 'spins' ? 'Added to Market' : 'Used') : redeemingRewardId === item.id ? 'Adding spins...' : item.key === 'spins' ? 'Add to Market' : 'Use Now'}
            </button>
          </article>
        )) : (
          <div className="rewards-empty-state">
            <span aria-hidden="true">▣</span>
            <h2>Your Bayong is empty</h2>
            <p>Spin the Swerte wheel to collect rewards.</p>
            <button className="rewards-secondary-button" type="button" onClick={() => setActiveTab('swerte')}>Go to Swerte</button>
          </div>
        )}
        {rewardMessage && <p className="rewards-redeem-message" role="alert">{rewardMessage}</p>}
      </section>
    );
  };

  const activeLabel = rewardTabs.find(tab => tab.id === activeTab)?.label || 'Bayong';

  return (
    <div className="rewards-center-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="rewards-center-dialog" role="dialog" aria-modal="true" aria-labelledby="rewards-center-title">
        <aside className="rewards-center-nav">
          <div className="rewards-brand">
            <span aria-hidden="true">✦</span>
            <strong id="rewards-center-title">Rewards</strong>
          </div>
          <nav aria-label="Rewards categories">
            {rewardTabs.map(tab => (
              <button
                className={`rewards-tab${activeTab === tab.id ? ' active' : ''}`}
                type="button"
                key={tab.id}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                onClick={() => setActiveTab(tab.id)}
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className={`rewards-center-main${activeTab === 'swerte' ? ' rewards-center-main-swerte' : ''}`}>
          <header className="rewards-center-header">
            <div>
              <p>Rewards</p>
              <h1>{activeTab === 'bayong' ? 'Your Items' : activeLabel}</h1>
            </div>
            <button className="rewards-center-close" type="button" aria-label="Close Rewards" onClick={onClose}>×</button>
          </header>
          {renderTab()}
        </main>
      </section>
    </div>
  );
};

export default RewardsCenter;