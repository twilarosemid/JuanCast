import React, { useState, useEffect } from 'react';
import '../css/BannerCarousel.css'; 

const BannerCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugLog, setDebugLog] = useState('Initializing...');

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setDebugLog('Attempting to fetch from /api/banners...');
        const response = await fetch('[https://juancast.onrender.com](https://juancast.onrender.com)/api/banners');
        
        if (response.ok) {
          const data = await response.json();
          setDebugLog(`Success! Backend returned ${Array.isArray(data) ? data.length : 0} items. Data: ${JSON.stringify(data)}`);
          setHeroSlides(Array.isArray(data) ? data : []);
        } else {
          setDebugLog(`HTTP Error: Backend responded with ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setDebugLog(`Fetch Error: ${error.message} (Check if an AdBlocker is blocking the network request to /api/banners)`);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  if (loading) {
    return (
      <div className="hero-showcase card-shadow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '650px' }}>
        <span style={{ color: '#fff', opacity: 0.6 }}>Loading images...</span>
      </div>
    );
  }

  // X-RAY DEBUG SCREEN
  if (heroSlides.length === 0) {
    return (
      <div className="card-shadow" style={{ padding: '30px', backgroundColor: '#ef4444', color: 'white', height: '650px', borderRadius: '12px' }}>
        <h2>⚠️ Data Disconnect Detected</h2>
        <p><strong>Diagnostic Log:</strong> {debugLog}</p>
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <p><strong>How to read this error:</strong></p>
          <ul>
            <li>If it says <strong>"Fetch Error: Failed to fetch"</strong>, your browser/ad-blocker is killing the network request.</li>
            <li>If it says <strong>"Backend returned 0 items"</strong>, your homepage is somehow pointing to a different database collection than your Admin panel.</li>
            <li>If it says <strong>"HTTP Error: 404"</strong>, the route is missing on your server.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-showcase card-shadow">
      <div 
        className="hero-slides-container"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {heroSlides.map((slide) => (
          <img 
            key={slide._id || slide.id}
            src={slide.imageUrl} 
            alt="Featured Content"
            className="hero-slide-img"
            draggable="false"
            onClick={() => slide.linkUrl && window.open(slide.linkUrl, '_blank', 'noopener,noreferrer')}
            style={{ cursor: slide.linkUrl ? 'pointer' : 'default' }}
          />
        ))}
      </div>
      
      {heroSlides.length > 1 && (
        <div className="hero-dots">
          {heroSlides.map((_, index) => (
            <span 
              key={index} 
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            ></span>
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;