import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Polls.css';

const AllPolls = () => {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [pollGroups, setPollGroups] = useState([]); 
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');
  const [activeType, setActiveType] = useState('All');
  
  // Tracks which categories are vertically expanded
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    // 1. Fetch the Polls
    fetch('https://juancast.onrender.com/api/polls')
      .then(res => res.json())
      .then(data => setPolls(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching polls:", err));

    // 2. Fetch the Poll Groups (for the image filters)
    fetch('https://juancast.onrender.com/api/poll-groups')
      .then(res => res.json())
      .then(data => setPollGroups(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching poll groups:", err));
  }, []);

  const filteredPolls = polls.filter(poll => {
    const safeTitle = poll.title || "";
    const matchesSearch = safeTitle.toLowerCase().includes((search || "").toLowerCase());
    
    const pollGroup = poll.group || "PPMA";
    const matchesGroup = activeGroup === 'All' || pollGroup === activeGroup;
    const pollType = poll.type || 'Minor';
    const matchesType = activeType === 'All' || pollType === activeType;
    
    return matchesSearch && matchesGroup && matchesType;
  });

  const groupNames = [...new Set([
    ...pollGroups.map(group => group.name),
    ...polls.map(poll => poll.group || 'PPMA')
  ])];
  const pollsByGroup = groupNames
    .map(groupName => ({
      name: groupName,
      polls: filteredPolls.filter(poll => (poll.group || 'PPMA') === groupName)
    }))
    .filter(group => group.polls.length > 0);

  const formatDate = (dateString) => {
    if (!dateString) return "TBA";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "TBA";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Toggles a category between horizontal swipe and vertical stack
  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  return (
    <div className="polls-page-wrapper">
      
      <aside className="polls-sidebar">
        <div className="search-bar-container">
          <input 
            type="text" 
            placeholder="Search" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="polls-search-input"
          />
          <span className="search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <select
            aria-label="Filter polls by type"
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
            className="polls-filter-select"
          >
            <option value="All">All</option>
            <option value="Minor">Minor</option>
            <option value="Major">Major</option>
          </select>
        </div>

        <div className="poll-group-filters">
          {/* Default ALL Button */}
          <button 
            className={`poll-group-filter ${activeGroup === 'All' ? 'active' : ''}`}
            onClick={() => setActiveGroup('All')}
          >
            ALL
          </button>
          
          {/* Dynamic Group Buttons */}
          {pollGroups.map(group => (
            <button 
              key={group._id}
              className={`poll-group-filter ${activeGroup === group.name ? 'active' : ''}`}
              onClick={() => setActiveGroup(group.name)}
              title={group.name} 
            >
              {group.name}
            </button>
          ))}
        </div>
      </aside>

      <main className="polls-main-content">
        {pollsByGroup.map(group => {
          const isExpanded = expandedGroups[group.name];
          const hasMultiple = group.polls.length > 1;

          return (
            <section className="poll-group-section" key={group.name}>
              <h2 className="poll-group-heading">{group.name}</h2>
              
              <div className={`polls-grid-wrapper ${isExpanded ? 'is-expanded' : ''}`}>
                
                {/* Toggles between 'collapsed' (horizontal swipe) and 'expanded' (vertical stack) */}
                <div className={`polls-grid ${isExpanded ? 'expanded' : 'collapsed'}`}>
                  {group.polls.map(poll => (
                    <div
                      key={poll._id || poll.id}
                      className="poll-card"
                      onClick={() => navigate(`/polls/${poll._id || poll.id}`)}
                    >
                      <div className="poll-card-image" style={{ backgroundImage: `url(${poll.imageUrl || ''})` }}></div>
                      <div className="poll-card-info">
                        <h3 className="poll-card-title">{poll.title || "Untitled Poll"}</h3>
                        <p className="poll-card-date">
                          {formatDate(poll.fromDate)} - {formatDate(poll.toDate)}
                        </p>
                        <div className="poll-card-tags">
                          <span className="blue-icon">🪩</span>
                          <span className="tag-group">{group.name}</span>
                          <span className="tag-type">{poll.type || 'Minor'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Outfading Overlay (Only visible when collapsed and has multiple cards) */}
                {!isExpanded && hasMultiple && (
                  <div className="polls-fade-overlay" onClick={() => toggleGroup(group.name)}>
                    <div className="view-all-pill">View All ➔</div>
                  </div>
                )}

                {/* Show Less Button (Only visible when vertically expanded) */}
                {isExpanded && hasMultiple && (
                  <button className="show-less-btn" onClick={() => toggleGroup(group.name)}>
                    ↑ Show Less
                  </button>
                )}
                
              </div>
            </section>
          );
        })}
        
        {!pollsByGroup.length && (
          <p className="polls-empty-state">No polls match your filters.</p>
        )}
      </main>
    </div>
  );
};

export default AllPolls;