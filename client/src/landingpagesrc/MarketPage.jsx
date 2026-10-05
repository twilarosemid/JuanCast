import { useOutletContext } from 'react-router-dom';
import StarsShop from './market/StarsShop';
import SunsConvert from './market/SunsConvert';
import Spin from './market/Spin';
import Powerups from './market/Powerups';
import './market/css/UniversalMarket.css';

const MarketPage = () => {
  const { loggedInUser, activeMarketSection } = useOutletContext();
  const sections = {
    stars: <StarsShop />,
    suns: <SunsConvert loggedInUser={loggedInUser} />,
    spin: <Spin loggedInUser={loggedInUser} />,
    powerups: <Powerups />
  };

  return (
    <div className="market-page">
      <main className="market-main">
        {sections[activeMarketSection] || sections.stars}
      </main>
    </div>
  );
};

export default MarketPage;