import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import './css/Spin.css';

const SPIN_COOLDOWN_MS = 30_000;

const spinPackages = [
  { spins: 40, price: 100 },
  { spins: 70, price: 150 },
  { spins: 100, price: 200 }
];

const parseApiResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (response.status === 404) {
      throw new Error('Spin API route not found. Restart the backend to load the latest routes.');
    }
    throw new Error('The spin service returned an unexpected response.');
  }

  return response.json();
};

const Spin = ({ loggedInUser }) => {
  const navigate = useNavigate();
  const [spinStatus, setSpinStatus] = useState({ spinsRemaining: 15, stars: 0, cooldownEndsAt: null });
  const [spinValues, setSpinValues] = useState([0, 0, 0]);
  const [spinMessage, setSpinMessage] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [spinNow, setSpinNow] = useState(Date.now());
  const [isMoreSpinsOpen, setIsMoreSpinsOpen] = useState(false);
  const [spinPurchaseMessage, setSpinPurchaseMessage] = useState('');

  useEffect(() => {
    const stopRollingWhenHidden = () => {
      if (document.visibilityState === 'hidden') setRolling(false);
    };
    const stopRollingOnRestore = () => setRolling(false);

    document.addEventListener('visibilitychange', stopRollingWhenHidden);
    window.addEventListener('pageshow', stopRollingOnRestore);
    return () => {
      document.removeEventListener('visibilitychange', stopRollingWhenHidden);
      window.removeEventListener('pageshow', stopRollingOnRestore);
    };
  }, []);

  useEffect(() => {
    if (!isMoreSpinsOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsMoreSpinsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMoreSpinsOpen]);

  useEffect(() => {
    if (isMoreSpinsOpen) document.querySelector('.market-spin-packs-close')?.focus();
  }, [isMoreSpinsOpen]);

  useEffect(() => {
    if (!loggedInUser?.email) {
      setSpinStatus({ spinsRemaining: 0, stars: 0, cooldownEndsAt: null });
      return undefined;
    }

    const controller = new AbortController();
    fetch(`[https://juancast.onrender.com](https://juancast.onrender.com)/api/users/spin-status?email=${encodeURIComponent(loggedInUser.email)}`, { signal: controller.signal })
      .then(async response => {
        const result = await parseApiResponse(response);
        if (!response.ok) throw new Error(result.message || 'Could not load spins.');
        setSpinStatus({
          spinsRemaining: result.spinsRemaining,
          stars: result.stars,
          cooldownEndsAt: result.lastSpinAt ? new Date(Date.parse(result.lastSpinAt) + SPIN_COOLDOWN_MS).toISOString() : null
        });
      })
      .catch(error => {
        if (error.name !== 'AbortError') setSpinMessage(error.message || 'Could not load spins.');
      });

    return () => controller.abort();
  }, [loggedInUser?.email]);

  useEffect(() => {
    const handleBonusSpins = (event) => {
      if (event.detail?.email?.toLowerCase() !== loggedInUser?.email?.toLowerCase()) return;
      setSpinStatus(current => ({ ...current, spinsRemaining: event.detail.spinsRemaining }));
    };

    window.addEventListener('juancast-market-spin-updated', handleBonusSpins);
    return () => window.removeEventListener('juancast-market-spin-updated', handleBonusSpins);
  }, [loggedInUser?.email]);

  useEffect(() => {
    const timer = window.setInterval(() => setSpinNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const cooldownRemaining = spinStatus.cooldownEndsAt
    ? Math.max(0, Math.ceil((Date.parse(spinStatus.cooldownEndsAt) - spinNow) / 1000))
    : 0;

  const spin = async () => {
    if (!loggedInUser?.email) {
      navigate('/login');
      return;
    }
    if (spinning || cooldownRemaining > 0 || spinStatus.spinsRemaining < 1) return;

    setSpinning(true);
    setRolling(true);
    setSpinMessage('');
    try {
      const response = await fetch('[https://juancast.onrender.com](https://juancast.onrender.com)/api/users/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loggedInUser.email })
      });
      const result = await parseApiResponse(response);
      if (!response.ok) {
        if (result.cooldownEndsAt) setSpinStatus(current => ({ ...current, cooldownEndsAt: result.cooldownEndsAt }));
        throw new Error(result.message || 'Spin failed.');
      }

      await new Promise(resolve => window.setTimeout(resolve, 900));
      setRolling(false);
      setSpinValues(result.symbols);
      setSpinStatus({ spinsRemaining: result.spinsRemaining, stars: result.stars, cooldownEndsAt: result.cooldownEndsAt });
      const updatedUser = { ...loggedInUser, stars: result.stars };
      localStorage.setItem('juancast_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('juancast-user-updated'));
      setSpinMessage(result.reward > 0 ? `You won ${result.reward.toLocaleString()} Stars!` : 'No match this spin. Try again!');
    } catch (error) {
      setRolling(false);
      setSpinMessage(error.message || 'Spin failed.');
    } finally {
      setRolling(false);
      setSpinning(false);
    }
  };

  return (
    <>
      <section className="market-section market-spin-section">
        <header className="market-section-header">
          <h1>Spin</h1>
          <p>Try your luck and earn Stars.</p>
        </header>
        <div className="market-spin-content">
          <div className="market-spin-toolbar">
            <p><strong>Spins Left:</strong> {loggedInUser?.email ? spinStatus.spinsRemaining : '—'}</p>
            <button type="button" onClick={() => { setSpinPurchaseMessage(''); setIsMoreSpinsOpen(true); }}>More Spins <span>+</span></button>
          </div>
          <div className="market-slot-machine" aria-label="Three-slot Stars game">
            {spinValues.map((value, index) => (
              <div className={`market-slot${rolling ? ' is-spinning' : ''}`} key={index} aria-label={`Slot ${index + 1}: ${value} Stars`}>
                {rolling ? <span className="market-slot-roll">{value}</span> : value}
              </div>
            ))}
          </div>
          <button
            className="market-spin-button"
            type="button"
            onClick={spin}
            disabled={spinning || cooldownRemaining > 0 || (Boolean(loggedInUser?.email) && spinStatus.spinsRemaining < 1)}
          >
            {!loggedInUser?.email ? 'Log in to Spin' : spinning ? 'Spinning...' : cooldownRemaining > 0 ? `Spin in ${cooldownRemaining}s` : 'Spin'}
          </button>
          {spinMessage && <p className="market-spin-message" role="status">{spinMessage}</p>}
          {!loggedInUser?.email && <p className="market-spin-message">Log in to play and earn Stars.</p>}
          <details className="market-spin-details" open>
            <summary>Game Instructions</summary>
            <ul>
              <li>Press the Spin button to play. It becomes available after the cooldown.</li>
              <li>Two matching values win that value in Stars.</li>
              <li>Three matching values win double that value in Stars.</li>
              <li>Your total Stars are added to your account balance.</li>
              <li>You receive 15 spins each day, refreshing at midnight Pacific Time.</li>
            </ul>
          </details>
          <details className="market-spin-details" open>
            <summary>Disclaimer</summary>
            <ul>
              <li>Advertisements shown are not connected to JuanCast.</li>
              <li>Rewards are credited after each spin.</li>
              <li>All Stars awarded will expire at the end of each month.</li>
            </ul>
          </details>
        </div>
      </section>
      {isMoreSpinsOpen && createPortal(
        <div
          className="market-spin-packs-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setIsMoreSpinsOpen(false);
          }}
        >
          <section className="market-spin-packs-dialog" role="dialog" aria-modal="true" aria-labelledby="spin-packs-title" aria-describedby="spin-packs-note">
            <button className="market-spin-packs-close" type="button" aria-label="Close" onClick={() => setIsMoreSpinsOpen(false)}>&times;</button>
            <h2 id="spin-packs-title">Buy More Spins</h2>
            <p className="market-spin-packs-note" id="spin-packs-note"><strong>Note:</strong> Bought spins will not be retained during spin count reset at 12:00 am</p>
            <div className="market-spin-packs-grid">
              {spinPackages.map(({ spins, price }) => (
                <button
                  className="market-spin-package"
                  type="button"
                  key={spins}
                  onClick={() => setSpinPurchaseMessage('Spin checkout is not available yet.')}
                >
                  <strong className="market-spin-package-amount">+{spins}</strong>
                  <span className="market-spin-package-label">spins</span>
                  <strong className="market-spin-package-price">PHP {price}</strong>
                </button>
              ))}
            </div>
            {spinPurchaseMessage && <p className="market-spin-packs-message" role="status">{spinPurchaseMessage}</p>}
          </section>
        </div>,
        document.body
      )}
    </>
  );
};

export default Spin;