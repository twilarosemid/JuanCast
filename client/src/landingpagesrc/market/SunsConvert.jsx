import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StarCurr from '../../assets/StarCurr.png';
import SunCurr from '../../assets/SunCurr.png';
import './css/SunsConvert.css';

const sunsToStarsRate = 1800;

const SunsConvert = ({ loggedInUser }) => {
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
      const response = await fetch('https://juancast.onrender.com/api/users/convert-suns', {
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

  return (
    <section className="market-section market-conversion-section">
      <header className="market-section-header">
        <h1>Sun Conversion</h1>
        <p>Convert Suns to Stars for Votes.</p>
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
};

export default SunsConvert;