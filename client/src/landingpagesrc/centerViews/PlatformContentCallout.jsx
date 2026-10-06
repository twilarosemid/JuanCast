import { useEffect, useRef, useState } from 'react';

const PlatformContentCallout = ({ platform }) => {
  const scrollRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCardId, setHoveredCardId] = useState(null);

  useEffect(() => {
    const loadPlatformContent = async () => {
      try {
        const response = await fetch(`https://juancast.onrender.com/api/videos?platform=${encodeURIComponent(platform)}`);
        if (!response.ok) throw new Error(`Failed to load ${platform} content`);
        const data = await response.json();
        const platformItems = Array.isArray(data)
          ? data.filter(item => (item.platform || 'YouTube').toLowerCase() === platform.toLowerCase())
          : [];
        setItems(platformItems);
      } catch (error) {
        console.error(`Error fetching ${platform} content:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadPlatformContent();
  }, [platform]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleWheel = (event) => {
      event.preventDefault();
      element.scrollLeft += event.deltaY;
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [items]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="community-platform-callout">
      <div className="section-header" style={{ marginBottom: '15px' }}>
        <h2>{platform}</h2>
      </div>
      {loading ? (
        <p className="community-platform-empty">Loading content...</p>
      ) : items.length === 0 ? (
        <p className="community-platform-empty">No {platform} content available yet.</p>
      ) : (
        <div
          className="yt-scroll-container platform-content-scroll"
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '15px',
            overflowX: 'auto',
            padding: '20px 25px 20px 5px',
            alignItems: 'center',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: 'auto'
          }}
        >
          {items.map(item => {
            const itemId = item._id || item.id;
            const isHovered = hoveredCardId === itemId;

            return (
              <div
                className="yt-card"
                key={itemId}
                onMouseEnter={() => setHoveredCardId(itemId)}
                onMouseLeave={() => setHoveredCardId(null)}
                onClick={() => item.youtubeUrl && window.open(item.youtubeUrl, '_blank', 'noopener,noreferrer')}
                style={{
                  flex: '0 0 340px',
                  height: '191px',
                  borderRadius: '12px',
                  position: 'relative',
                  cursor: item.youtubeUrl ? 'pointer' : 'default',
                  backgroundColor: '#000',
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  zIndex: isHovered ? 10 : 1,
                  boxShadow: isHovered
                    ? '0 20px 40px rgba(0, 0, 0, 0.5)'
                    : '0 10px 20px rgba(0, 0, 0, 0.3)',
                  transition: 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.25s ease, z-index 0s'
                }}
              >
                <div
                  className="yt-card-image"
                  style={{
                    backgroundImage: item.imageUrl
                      ? `url(${item.imageUrl})`
                      : 'linear-gradient(135deg, #1e293b, #0f172a)'
                  }}
                >
                  <div className="yt-card-overlay">
                    <h3 className="yt-card-main-title">{item.title}</h3>
                    <p className="yt-card-subtitle">{item.subtitle || `${platform.toUpperCase()} CONTENT`}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default PlatformContentCallout;