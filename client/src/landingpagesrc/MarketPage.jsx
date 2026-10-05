import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FaBolt, FaStar, FaSun } from 'react-icons/fa';
import STAR1 from '../assets/STAR1.png';
import STAR2 from '../assets/STAR2.png';
import STAR3 from '../assets/STAR3.png';
import STAR4 from '../assets/STAR4.png';
import STAR5 from '../assets/STAR5.png';
import STAR6 from '../assets/STAR6.png';
import StarCurr from '../assets/StarCurr.png';
import SunCurr from '../assets/SunCurr.png';
import './css/MarketPage.css';

const sunsToStarsRate = 1800;

const starPackages = [
  { amount: 1000, price: 49, image: STAR1 },
  { amount: 5000, price: 159, image: STAR2 },
  { amount: 15000, price: 399, image: STAR3 },
  { amount: 40000, price: 799, image: STAR4 },
  { amount: 100000, price: 1199, image: STAR5 },
  { amount: 500000, price: 2999, image: STAR6 }
];

const powerups = [
  { name: 'Nuno sa Punso', detail: 'Stars voted will be multiplied 3x', duration: '30 min', price: 5999, Icon: FaStar },
  { name: 'Agimat ni Juan', detail: 'Stars voted will be multiplied 2x', duration: '60 min', price: 1499, Icon: FaSun },
  { name: 'Apolaki', detail: 'Suns voted will be multiplied 2x', duration: '30 min', price: 2999, Icon: FaBolt }
];

const MarketPage = () => {
  const { loggedInUser, activeMarketSection } = useOutletContext();
  const navigate = useNavigate();
  const [sunAmount, setSunAmount] = useState('');
  const [balance, setBalance] = useState({ stars: 0, suns: 0 });
  const [conversionStatus, setConversionStatus] = useState('');
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    setBalance({ stars: loggedInUser?.stars || 0, suns: loggedInUser?.suns || 0 });
  }, [loggedInUser]);

  const sunsToConvert = Number(sunAmount);
  const totalStars = Number.isSafeInteger(sunsToConvert) && sunsToConvert > 0 ? sunsToConvert * sunsToStarsRate : 0;

  const convertStarsToSuns = async (event) => {
    event.preventDefault();
    setConversionStatus('');

    if (!loggedInUser?.email) {
      navigate('/login');
      return;
    }
    if (!Number.isSafeInteger(sunsToConvert) || sunsToConvert < 1) {
      setConversionStatus('Enter a whole number of Suns to convert.');
      return;
    }

    setConverting(true);
    try {
      const response = await fetch('http://localhost:5000/api/users/convert-suns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loggedInUser.email, suns: sunsToConvert })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Conversion failed.');

      const updatedUser = { ...loggedInUser, stars: result.stars, suns: result.suns };
      localStorage.setItem('juancast_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('juancast-user-updated'));
      setBalance({ stars: result.stars, suns: result.suns });
      setSunAmount('');
      setConversionStatus(`Converted ${result.convertedSuns} Sun${result.convertedSuns === 1 ? '' : 's'}.`);
    } catch (error) {
      setConversionStatus(error.message || 'Conversion failed.');
    } finally {
      setConverting(false);
    }
  };

  const renderSection = () => {
    if (activeMarketSection === 'stars') {
      return (
        <section className="market-section">
          <header className="market-section-header">
            <h1>Stars for Minor Polls</h1>
            <p>Choose a Stars package for your account.</p>
          </header>
          <div className="market-product-grid">
            {starPackages.map(item => (
              <article className="market-product" key={item.amount}>
                <img className="market-product-image" src={item.image} alt="" />
                <strong className="market-product-amount">{item.amount.toLocaleString()}</strong>
                <span className="market-product-currency">Stars</span>
                <strong className="market-product-price">PHP {item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
              </article>
            ))}
          </div>
          <p className="market-note">Online checkout is not set up yet.</p>
        </section>
      );
    }

    if (activeMarketSection === 'suns') {
      return (
        <section className="market-section market-conversion-section">
          <header className="market-section-header">
            <h1>Sun Conversion</h1>
            <p>Convert Stars to Suns for Major Polls.</p>
          </header>
          <div className="market-balances">
            <span><img src={SunCurr} alt="" /> {balance.suns.toLocaleString()} Suns</span>
            <span><img src={StarCurr} alt="" /> {balance.stars.toLocaleString()} Stars</span>
          </div>
          <form className="sun-conversion-form" onSubmit={convertStarsToSuns}>
              <div className="conversion-rate"><img src={SunCurr} alt="" /><strong>1</strong><span>=</span><strong>{sunsToStarsRate.toLocaleString()}</strong><img src={StarCurr} alt="" /></div>
            <label htmlFor="sun-conversion-amount">Number of Suns</label>
            <input
              id="sun-conversion-amount"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Enter the number of Suns"
              value={sunAmount}
              onChange={event => setSunAmount(event.target.value)}
            />
            <div className="conversion-result">
              <span>Total stars</span>
              <strong>{totalStars.toLocaleString()}</strong>
            </div>
            <button className="market-primary-button" type="submit" disabled={converting}>
              {converting ? 'Converting...' : 'Convert Suns to Stars'}
            </button>
            {conversionStatus && <p className="market-status" role="status">{conversionStatus}</p>}
          </form>
          <ul className="market-rules">
            <li>Converted Stars cannot be converted back into Suns.</li>
            <li>Converted Stars are added to your balance immediately.</li>
          </ul>
        </section>
      );
    }

    if (activeMarketSection === 'powerups') {
      return (
        <section className="market-section">
          <header className="market-section-header">
            <h1>Powerups</h1>
            <p>Boost the impact of your votes.</p>
          </header>
          <div className="market-powerup-grid">
            {powerups.map(({ name, detail, duration, price, Icon }) => (
              <article className="market-powerup" key={name}>
                <span className="market-powerup-duration">{duration}</span>
                <Icon className="market-powerup-icon" aria-hidden="true" />
                <h2>{name}</h2>
                <p>{detail}</p>
                <strong>PHP {price.toLocaleString()}</strong>
              </article>
            ))}
          </div>
          <p className="market-note">Powerup checkout is not available yet.</p>
        </section>
      );
    }

    return (
      <section className="market-section market-unavailable">
        <header className="market-section-header">
          <h1>Spin</h1>
          <p>The Spin service is not available yet.</p>
        </header>
      </section>
    );
  };

  return (
    <div className="market-page">
      <main className="market-main">{renderSection()}</main>
    </div>
  );
};

export default MarketPage;