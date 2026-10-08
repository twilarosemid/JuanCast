import React, { useEffect, useState } from 'react';
import './css/ChikaPanel.css';

const latestChikaLogo = new URL('../assets/latest_chika_logo.webp?v=20260922', import.meta.url).href;

// Sub-component for individual articles
const ChikaCard = ({ chika, logoUrl, featured = false }) => {
  const openArticle = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`chika-news-card card-shadow${featured ? ' chika-headline-card' : ''}`}>
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
const ChikaPanel = ({ featuredLayout = true }) => {
  const [articles, setArticles] = useState([]);
  const [headlineId, setHeadlineId] = useState('');

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const response = await fetch('https://juancast.onrender.com/api/chika');
        if (!response.ok) throw new Error('Failed to load Chika articles');

        const data = await response.json();
        setArticles(Array.isArray(data) ? data : []);

        try {
          const settingsResponse = await fetch('https://juancast.onrender.com/api/settings');
          if (!settingsResponse.ok) throw new Error('Failed to load Chika headline setting');
          const settings = await settingsResponse.json();
          setHeadlineId(settings.featuredChikaId || '');
        } catch (error) {
          console.error('Error fetching Chika headline setting:', error);
        }
      } catch (error) {
        console.error('Error fetching Chika articles:', error);
        setArticles([]);
      }
    };

    loadArticles();
  }, []);

  const headline = articles.find((article) => article._id === headlineId) || articles[0];
  const remainingArticles = articles.filter((article) => article !== headline);

  return (
    <div className={`chika-list${featuredLayout ? ' chika-featured-layout' : ''}`}>
      {featuredLayout ? (
        <>
          {headline && <ChikaCard chika={headline} logoUrl={latestChikaLogo} featured />}
          <div className="chika-article-grid">
            {remainingArticles.map((chika) => (
              <ChikaCard
                key={chika._id || chika.id || 'chika-card'}
                chika={chika}
                logoUrl={latestChikaLogo}
              />
            ))}
          </div>
        </>
      ) : articles.map((chika) => (
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