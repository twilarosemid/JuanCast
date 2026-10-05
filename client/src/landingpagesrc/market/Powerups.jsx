import NunuLogo from '../../assets/nunu_sa_punso_logo.webp';
import AgimatLogo from '../../assets/agimat_ni_juan_logo.webp';
import ApolakiLogo from '../../assets/apolaki_logo.webp';
import './css/Powerups.css';

const powerups = [
  { name: 'Nuno sa Punso', detail: 'Stars voted will be multiplied 3x', duration: '30 min', price: 5999, image: NunuLogo },
  { name: 'Agimat ni Juan', detail: 'Stars voted will be multiplied 2x', duration: '60 min', price: 1499, image: AgimatLogo },
  { name: 'Apolaki', detail: 'Suns voted will be multiplied 2x', duration: '30 min', price: 2999, image: ApolakiLogo }
];

const Powerups = () => (
  <section className="market-section">
    <header className="market-section-header">
      <h1>Powerups</h1>
      <p>Boost the impact of your votes.</p>
    </header>
    <div className="market-powerup-grid">
      {powerups.map(({ name, detail, duration, price, image }) => (
        <article className="market-powerup" key={name}>
          <span className="market-powerup-duration">{duration}</span>
          <img className="market-powerup-icon" src={image} alt="" />
          <h2>{name}</h2>
          <p>{detail}</p>
          <strong>PHP {price.toLocaleString()}</strong>
        </article>
      ))}
    </div>
    <p className="market-note">Powerup checkout is not available yet.</p>
  </section>
);

export default Powerups;