import STAR1 from '../../assets/STAR1.png';
import STAR2 from '../../assets/STAR2.png';
import STAR3 from '../../assets/STAR3.png';
import STAR4 from '../../assets/STAR4.png';
import STAR5 from '../../assets/STAR5.png';
import STAR6 from '../../assets/STAR6.png';
import './css/StarsShop.css';

const starPackages = [
  { amount: 1000, price: 49, image: STAR1 },
  { amount: 5000, price: 159, image: STAR2 },
  { amount: 15000, price: 399, image: STAR3 },
  { amount: 40000, price: 799, image: STAR4 },
  { amount: 100000, price: 1199, image: STAR5 },
  { amount: 500000, price: 2999, image: STAR6 }
];

const StarsShop = () => (
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

export default StarsShop;