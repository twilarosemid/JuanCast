import React, { useEffect, useState } from 'react';
import './css/ChikaPanel.css';

const latestChikaLogo = new URL('../assets/latest_chika_logo.webp?v=20260922', import.meta.url).href;

const fallbackArticle = {
  _id: 'fallback-chika',
  title: "Seo In Guk charms Filo Heartriders in 'Heart Cookie' Manila fanmeet",
  description: "Korean singer-actor Seo In Guk charmed fans with his 'Heart Cookie' Asia tour fan meeting on Saturday, drawing a strong Filo crowd and glowing reactions online.",
  imageUrl: '',
  url: 'https://latestchika.com/just-in/2025/09/24/117910/seo-in-guk-charms-filo-heartriders-in-heart-cookie-manila-fanmeet/'
};

// Sub-component for individual articles
const ChikaCard = ({ chika, logoUrl }) => {
  const openArticle = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="chika-news-card card-shadow">
      <div className="chika-image-wrap">
        {chika.imageUrl ? (
          <img
            src={chika.imageUrl}
            alt={chika.title || 'Latest Chika'}
            className="chika-main-image"
            draggable="false"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="chika-img-placeholder">Latest Chika</div>
        )}

        <img
          src={logoUrl}
          alt="Chika Badge"
          className="chika-badge"
        />
      </div>
      <h3 className="chika-title">{chika.title}</h3>
      <p className="chika-desc">{chika.description}</p>
      <button className="read-more-btn" onClick={() => openArticle(chika.url)}>
        Read More
      </button>
    </div>
  );
};

// Main container component
const ChikaPanel = () => {
  const [articles, setArticles] = useState([fallbackArticle]);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/chika');
        if (!response.ok) {
          throw new Error('Failed to load Chika articles');
        }

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
        }
      } catch (error) {
        console.error('Error fetching Chika articles:', error);
        setArticles([fallbackArticle]);
      }
    };

    loadArticles();
  }, []);

  return (
    <div className="chika-list">
      {articles.map((chika) => (
        <ChikaCard 
          key={chika._id || chika.id || 'chika-card'} 
          chika={chika} 
          logoUrl={latestChikaLogo} 
        />
      ))}
    </div>
  );
};

export default ChikaPanel;