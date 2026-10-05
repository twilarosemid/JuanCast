import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import ChatPanel from './ChatPanel';
import ChikaPanel from './ChikaPanel';
import YouTubeContent from './centerViews/YouTubeContent';
import FacebookContent from './centerViews/FacebookContent';
import XContent from './centerViews/XContent';
import TikTokContent from './centerViews/TikTokContent';
import './css/CommunityPage.css';

const CommunityPage = () => {
  const { onPostRequested, activeCommunitySection, openPostId, openReplyIndex, focusKey } = useOutletContext();
  const [contentItems, setContentItems] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    if (activeCommunitySection !== 'contents') return;

    const loadContentItems = async () => {
      setContentLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/videos?platform=all');
        if (!response.ok) throw new Error('Failed to load platform content');
        const data = await response.json();
        setContentItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading platform content:', error);
      } finally {
        setContentLoading(false);
      }
    };

    loadContentItems();
  }, [activeCommunitySection]);

  const hasPlatformContent = (platform) => contentItems.some(item =>
    (item.platform || 'YouTube').toLowerCase() === platform.toLowerCase()
  );

  return (
    <div className="community-page">
      <section className="community-section-content">
        {activeCommunitySection === 'chat' && (
          <>
            <h1 className="community-section-title">Chat</h1>
            <div className="community-chat-feed">
              <ChatPanel
                onPostRequested={onPostRequested}
                focusPostId={openPostId}
                focusReplyIndex={openReplyIndex}
                focusKey={focusKey}
              />
            </div>
          </>
        )}
        {activeCommunitySection === 'chika' && (
          <>
            <h1 className="community-section-title">Chika</h1>
            <ChikaPanel />
          </>
        )}
        {activeCommunitySection === 'contents' && (
          <div className="community-content-stack">
            {contentLoading ? (
              <p className="community-platform-empty">Loading content...</p>
            ) : (
              <>
                {hasPlatformContent('YouTube') && (
                  <section className="community-platform-callout community-youtube-callout">
                    <div className="section-header community-youtube-heading">
                      <h2>YouTube</h2>
                      <Link to="/videos" className="view-all-link">View All</Link>
                    </div>
                    <div className="community-youtube-content"><YouTubeContent /></div>
                  </section>
                )}
                {hasPlatformContent('Facebook') && <FacebookContent />}
                {hasPlatformContent('X') && <XContent />}
                {hasPlatformContent('TikTok') && <TikTokContent />}
                {!contentItems.length && <p className="community-platform-empty">No content available yet.</p>}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default CommunityPage;