import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import './components/css/AdminDashboard.css';

const API_BASE = '[https://juancast.onrender.com](https://juancast.onrender.com)';

const emptyForms = {
  rankings: { name: '', position: '1', group: '', category: '', youtubeUrl: '', youtubeStartTime: 0, image: null },
  polls: { title: '', fromDate: '', toDate: '', group: 'PPMA', type: 'Minor', description: '', image: null },
  pollGroups: { name: '', image: null }, 
  chika: { title: '', description: '', url: '', image: null },
  videos: { title: '', subtitle: '', youtubeUrl: '', group: '', platform: 'YouTube', image: null }
};

// --- CATEGORIZED NAVIGATION ---
const navCategories = [
  {
    title: 'Voting System',
    items: [
      { key: 'polls', label: 'Polls' },
      { key: 'pollGroups', label: 'Poll Groups' },
      { key: 'rankings', label: 'Artists (Rankings)' }
    ]
  },
  {
    title: 'Content Management',
    items: [
      { key: 'chika', label: 'Chika Articles' },
      { key: 'videos', label: 'Contents' },
      { key: 'banners', label: 'Promo Banners' }
    ]
  },
  {
    title: 'User Operations',
    items: [
      { key: 'reports', label: 'User Reports' }
    ]
  }
];

// --- HTML5 Canvas Cropping Helper ---
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      const file = new File([blob], `banner-${Date.now()}.jpg`, { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg');
  });
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('polls'); 
  const [formData, setFormData] = useState(emptyForms);
  const [editingId, setEditingId] = useState({ rankings: null, polls: null, pollGroups: null, chika: null, videos: null });
  
  const [items, setItems] = useState({ rankings: [], polls: [], pollGroups: [], chika: [], videos: [], reports: [] });
  
  // --- HOMEPAGE FEATURED RANKING STATE ---
  const [featuredConfig, setFeaturedConfig] = useState({
    featuredGroup: '',
    featuredCategory: '',
    featuredChikaId: ''
  });

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportMessages, setReportMessages] = useState({});
  
  const [fileInputKey, setFileInputKey] = useState({ rankings: 0, polls: 0, pollGroups: 0, chika: 0, banners: 0, videos: 0 });

  // --- Banner & Cropper States ---
  const [banners, setBanners] = useState([]);
  const [newBanner, setNewBanner] = useState({ image: null, linkUrl: '' });
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('juancast_user') || 'null');
    const isAdmin = Boolean(currentUser?.isAdmin || currentUser?.role === 'admin');
    if (!currentUser || !isAdmin) {
      navigate('/login', { replace: true });
      return;
    }

    loadContent();
    loadBanners();
  }, [navigate]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const [rankingsRes, pollsRes, pollGroupsRes, chikaRes, videosRes, reportsRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/rankings`),
        fetch(`${API_BASE}/api/polls`),
        fetch(`${API_BASE}/api/poll-groups`),
        fetch(`${API_BASE}/api/chika`),
        fetch(`${API_BASE}/api/videos?platform=all`), 
        fetch(`${API_BASE}/api/reports`),
        fetch(`${API_BASE}/api/settings`)
      ]);

      const parseJsonSafe = async (res) => {
        if (!res.ok) return [];
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error("Server returned non-JSON response:", text);
          return [];
        }
      };

      setItems({ 
        rankings: await parseJsonSafe(rankingsRes), 
        polls: await parseJsonSafe(pollsRes), 
        pollGroups: await parseJsonSafe(pollGroupsRes), 
        chika: await parseJsonSafe(chikaRes), 
        videos: await parseJsonSafe(videosRes), 
        reports: await parseJsonSafe(reportsRes) 
      });

      if (settingsRes && settingsRes.ok) {
        const setts = await settingsRes.json();
        setFeaturedConfig({
          featuredGroup: setts.featuredGroup || '',
          featuredCategory: setts.featuredCategory || '',
          featuredChikaId: setts.featuredChikaId || ''
        });
      }

    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      setStatus('Failed to load content from the database. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadBanners = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/banners`);
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (err) {
      console.error('Error loading banners:', err);
    }
  };

  const saveFeaturedSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(featuredConfig)
      });
      if (response.ok) {
        setStatus('Homepage Featured Ranking updated successfully!');
      } else {
        setStatus('Failed to update featured settings.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setStatus('Error updating featured settings.');
    }
  };

  const saveFeaturedChika = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredChikaId: featuredConfig.featuredChikaId })
      });
      if (!response.ok) {
        throw new Error('Failed to update the Chika headline.');
      }
      setStatus('Chika headline updated successfully!');
    } catch (error) {
      console.error('Error saving Chika headline:', error);
      setStatus(error.message || 'Error updating the Chika headline.');
    }
  };

  const setSectionField = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const resetForm = (section) => {
    setFormData((prev) => ({ ...prev, [section]: emptyForms[section] }));
    setEditingId((prev) => ({ ...prev, [section]: null }));
    setFileInputKey((prev) => ({ ...prev, [section]: prev[section] + 1 }));
  };

  const submitEntry = async (section) => {
    try {
      const payload = formData[section];
      const form = new FormData();

      if (section === 'pollGroups') {
        if (!payload.name?.trim()) throw new Error('Group name is required.');
        form.append('name', payload.name);
        if (payload.image) form.append('image', payload.image);
      }

      if (section === 'rankings') {
        if (!payload.name?.trim()) throw new Error('Artist name is required.');
        form.append('name', payload.name);
        form.append('group', payload.group || '');       
        form.append('category', payload.category || ''); 
        form.append('position', payload.position || '1');
        if (payload.youtubeUrl) form.append('youtubeUrl', payload.youtubeUrl);
        form.append('youtubeStartTime', payload.youtubeStartTime || 0); 
        if (payload.image) form.append('image', payload.image);
      }

      if (section === 'polls') {
        if (!payload.title?.trim() || !payload.fromDate || !payload.toDate) {
          throw new Error('Poll title, start date (from), and end date (to) are required.');
        }
        form.append('title', payload.title);
        form.append('group', payload.group);
        form.append('type', payload.type);
        form.append('description', payload.description);
        form.append('fromDate', payload.fromDate);
        form.append('toDate', payload.toDate);
        if (payload.image) form.append('image', payload.image);
      }

      if (section === 'chika') {
        if (!payload.title?.trim() || !payload.description?.trim()) {
          throw new Error('Chika title and description are required.');
        }
        form.append('title', payload.title);
        form.append('description', payload.description);
        if (payload.url) form.append('url', payload.url);
        if (payload.image) form.append('image', payload.image);
      }

      if (section === 'videos') {
        if (!payload.title?.trim()) {
          throw new Error('Video title is required.');
        }
        form.append('title', payload.title);
        form.append('subtitle', payload.subtitle || '');
        form.append('group', payload.group || ''); // <-- ADD THIS
        form.append('platform', payload.platform || 'YouTube');
        if (payload.youtubeUrl) form.append('youtubeUrl', payload.youtubeUrl);
        if (payload.image) form.append('image', payload.image);
      }

      const method = editingId[section] ? 'PUT' : 'POST';
      const apiSection = section === 'pollGroups' ? 'poll-groups' : section;
      const url = `${API_BASE}/api/${apiSection}${editingId[section] ? `/${editingId[section]}` : ''}`;

      const response = await fetch(url, {
        method,
        body: form
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server error or invalid route configuration (${response.status}): ${responseText.slice(0, 100)}`);
      }

      if (!response.ok) throw new Error(result.message || 'Unable to save data.');

      setStatus(`${section === 'rankings' ? 'Artist' : section.charAt(0).toUpperCase() + section.slice(1)} saved successfully.`);
      resetForm(section);
      await loadContent();
    } catch (error) {
      console.error('Error saving admin entry:', error);
      setStatus(error.message || 'Unable to save data.');
    }
  };

  const deleteEntry = async (section, id) => {
    try {
      const apiSection = section === 'pollGroups' ? 'poll-groups' : section;
      const response = await fetch(`${API_BASE}/api/${apiSection}/${id}`, { method: 'DELETE' });
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server error (${response.status}): Endpoint might be missing.`);
      }

      if (!response.ok) throw new Error(result.message || 'Unable to delete item.');

      setStatus(`${section === 'rankings' ? 'Artist' : section.charAt(0).toUpperCase() + section.slice(1)} deleted successfully.`);
      if (editingId[section] === id) resetForm(section);
      await loadContent();
    } catch (error) {
      console.error('Error deleting item:', error);
      setStatus(error.message || 'Unable to delete item.');
    }
  };

  const startEdit = (section, item) => {
    const nextForm = {
      rankings: {
        name: item.name || '',
        position: String(item.position || 1),
        group: item.group || '',          
        category: item.category || '',    
        youtubeUrl: item.youtubeUrl || '',
        youtubeStartTime: item.youtubeStartTime || 0,
        image: null
      },
      polls: {
        title: item.title || '',
        group: item.group || 'PPMA',
        type: item.type || 'Minor',
        description: item.description || '',
        fromDate: item.fromDate ? new Date(item.fromDate).toISOString().slice(0, 10) : '',
        toDate: item.toDate ? new Date(item.toDate).toISOString().slice(0, 10) : '',
        image: null
      },
      pollGroups: {
        name: item.name || '',
        image: null
      },
      chika: {
        title: item.title || '',
        description: item.description || '',
        url: item.url || '',
        image: null
      },
      videos: {
        title: item.title || '',
        subtitle: item.subtitle || '',
        group: item.group || '',
        platform: item.platform || 'YouTube',
        youtubeUrl: item.youtubeUrl || '',
        image: null
      }
    };

    setFormData((prev) => ({ ...prev, [section]: nextForm[section] }));
    setEditingId((prev) => ({ ...prev, [section]: item._id || item.id }));
    setFileInputKey((prev) => ({ ...prev, [section]: prev[section] + 1 }));
  };

  const handleBannerFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setCropSrc(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const handleCancelCrop = () => {
    setCropSrc(null);
    setFileInputKey(prev => ({ ...prev, banners: prev.banners + 1 }));
  };

  const handleConfirmCrop = async () => {
    try {
      const croppedFile = await getCroppedImg(cropSrc, croppedAreaPixels);
      setNewBanner({ ...newBanner, image: croppedFile });
      setCropSrc(null);
    } catch (e) {
      console.error('Error generating cropped image:', e);
      setStatus('Failed to crop image.');
    }
  };

  const handleAddBanner = async () => {
    if (!newBanner.image) {
      setStatus('Image file is required for banners.');
      return;
    }
    
    try {
      const form = new FormData();
      form.append('image', newBanner.image);
      if (newBanner.linkUrl) form.append('linkUrl', newBanner.linkUrl);

      const response = await fetch(`${API_BASE}/api/banners`, {
        method: 'POST',
        body: form
      });
      
      if (response.ok) {
        const addedBanner = await response.json();
        setBanners([addedBanner, ...banners]);
        setNewBanner({ image: null, linkUrl: '' });
        setFileInputKey(prev => ({ ...prev, banners: prev.banners + 1 }));
        setStatus('Banner added successfully!');
      } else {
        setStatus('Failed to add banner.');
      }
    } catch (error) {
      console.error('Error adding banner:', error);
      setStatus('Error adding banner.');
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    try {
      const response = await fetch(`${API_BASE}/api/banners/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setBanners(banners.filter(b => b._id !== id));
        setStatus('Banner deleted successfully!');
      } else {
        setStatus('Failed to delete banner.');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      setStatus('Error deleting banner.');
    }
  };

  const handleResolveReport = async (id) => {
    if (!window.confirm("Mark this report as resolved? The user will be notified.")) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/reports/${id}/resolve`, { method: 'PUT' });
      if (response.ok) {
        setStatus('Report resolved successfully.');
        setItems(prev => ({
          ...prev,
          reports: prev.reports.filter(r => r._id !== id)
        }));
      } else {
        setStatus('Failed to resolve report.');
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      setStatus('Error resolving report.');
    }
  };

  const handleSendReportMessage = async (id) => {
    const message = String(reportMessages[id] || '').trim();
    if (!message) return;

    try {
      const response = await fetch(`${API_BASE}/api/reports/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to send message.');

      setItems(previous => ({
        ...previous,
        reports: previous.reports.map(report => report._id === id ? result.report : report)
      }));
      setReportMessages(previous => ({ ...previous, [id]: '' }));
      setStatus('Message sent to the reporter’s Mail notifications.');
    } catch (error) {
      console.error('Error sending report message:', error);
      setStatus(error.message || 'Failed to send message to the reporter.');
    }
  };

  const renderThumbnail = (imageUrl, fallbackBg = '#e2e8f0') => ({
    width: '52px',
    height: '52px',
    borderRadius: '10px',
    background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : fallbackBg,
    border: '1px solid #dbe1ea'
  });

  const renderTabContent = () => {
    if (activeTab === 'rankings') {
      
      const allArtistCategories = [...new Set(
        items.polls.map(p => p.title)
      )].filter(Boolean);

      // --- GROUPING LOGIC FOR ARTISTS ---
      const groupedArtists = items.rankings.reduce((acc, item) => {
        const categoryName = item.category || 'Uncategorized';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(item);
        return acc;
      }, {});

      // Sort categories so 'Uncategorized' is at the bottom
      const sortedCategories = Object.keys(groupedArtists).sort((a, b) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
      });

      return (
        <div className="admin-tab-content-grid">
          
          {/* --- HOMEPAGE SETTING CARD --- */}
          <div className="admin-card" style={{ gridColumn: '1 / -1', background: '#f8fafc', border: '2px solid #e2e8f0' }}>
            <h2 className="admin-card-title" style={{ color: '#1e3a8a' }}>👑 Set Homepage Featured Ranking</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
              Select which poll category users will see by default on the main landing page.
            </p>
            <div className="admin-grid-split">
              <select 
                value={featuredConfig.featuredGroup} 
                onChange={(e) => setFeaturedConfig({ ...featuredConfig, featuredGroup: e.target.value })}
                className="admin-input" style={{ background: 'white' }}
              >
                <option value="">Select Target Group...</option>
                {items.pollGroups?.map(g => (
                  <option key={g._id} value={g.name}>{g.name}</option>
                ))}
              </select>
              
              <select 
                value={featuredConfig.featuredCategory} 
                onChange={(e) => setFeaturedConfig({ ...featuredConfig, featuredCategory: e.target.value })}
                className="admin-input" style={{ background: 'white' }}
              >
                <option value="">Select Target Category...</option>
                {allArtistCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <button 
                onClick={saveFeaturedSettings} 
                className="admin-btn-primary" 
                style={{ height: '42px', margin: 0, backgroundColor: '#10b981', borderColor: '#10b981' }}
              >
                Save Homepage View
              </button>
            </div>
          </div>
          {/* --------------------------------- */}

          <div className="admin-card">
            <h2 className="admin-card-title">{editingId.rankings ? 'Edit Artist' : 'Add Artist'}</h2>
            <div className="admin-form-group">
              <input value={formData.rankings.name} onChange={(e) => setSectionField('rankings', 'name', e.target.value)} placeholder="Artist Name" className="admin-input" />
              
              {/* GROUP & CATEGORY INPUTS */}
              <div className="admin-grid-split">
                <select 
                  value={formData.rankings.group} 
                  onChange={(e) => setSectionField('rankings', 'group', e.target.value)} 
                  className="admin-input"
                  style={{ background: 'white' }}
                >
                  <option value="">Select Poll Group...</option>
                  {items.pollGroups?.map(g => (
                    <option key={g._id} value={g.name}>{g.name}</option>
                  ))}
                </select>
                
                <select 
                  value={formData.rankings.category} 
                  onChange={(e) => setSectionField('rankings', 'category', e.target.value)} 
                  className="admin-input"
                  style={{ background: 'white' }}
                >
                  <option value="">Select Category...</option>
                  {allArtistCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <input 
                type="text" 
                placeholder="YouTube Video URL (Optional)" 
                value={formData.rankings.youtubeUrl} 
                onChange={(e) => setSectionField('rankings', 'youtubeUrl', e.target.value)} 
                className="admin-input" 
              />
              
              <input 
                type="number" 
                min="0"
                placeholder="Start Time (in seconds, e.g. 75 for 1:15)" 
                value={formData.rankings.youtubeStartTime === 0 ? '' : formData.rankings.youtubeStartTime} 
                onChange={(e) => setSectionField('rankings', 'youtubeStartTime', e.target.value)} 
                className="admin-input" 
              />

              <div className="admin-grid-split">
                <input type="number" min="1" value={formData.rankings.position} onChange={(e) => setSectionField('rankings', 'position', e.target.value)} placeholder="Current Rank / Position" className="admin-input" />
                <div style={{ display: 'grid', alignItems: 'center' }}>
                  <input
                    key={fileInputKey.rankings}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSectionField('rankings', 'image', e.target.files?.[0] || null)}
                    className="admin-input"
                  />
                </div>
              </div>
              <div className="admin-button-group">
                <button onClick={() => submitEntry('rankings')} className="admin-btn-primary">{editingId.rankings ? 'Update Artist' : 'Save Artist'}</button>
                {editingId.rankings && <button onClick={() => resetForm('rankings')} className="admin-btn-secondary">Cancel</button>}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Saved Artists</h2>
            <div className="admin-items-list">
              {loading ? <div>Loading...</div> : items.rankings.length === 0 ? <div>No artists yet.</div> : (
                sortedCategories.map(category => (
                  <div key={category} style={{ marginBottom: '25px' }}>
                    
                    {/* CATEGORY HEADER */}
                    <div style={{
                      fontSize: '13px',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: '800',
                      borderBottom: '2px solid #e2e8f0',
                      paddingBottom: '8px',
                      marginBottom: '15px'
                    }}>
                      {category}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Sort artists by their rank position within the category */}
                      {groupedArtists[category]
                        .sort((a, b) => Number(a.position) - Number(b.position))
                        .map((item) => (
                          <div key={item._id || item.id} className="admin-item-row" style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div className="admin-item-info">
                              <div style={renderThumbnail(item.imageUrl, '#dbeafe')} />
                              <div>
                                <div className="admin-item-name">{item.name}</div>
                                <div className="admin-item-subtext">#{item.position} • {new Intl.NumberFormat('en-US').format(item.voteCount || 0)} votes</div>
                                {(item.group) && (
                                  <div className="admin-item-subtext" style={{ color: '#2563eb', fontWeight: 'bold' }}>{item.group}</div>
                                )}
                              </div>
                            </div>
                            <div className="admin-item-actions">
                              <button onClick={() => startEdit('rankings', item)} className="admin-btn-secondary">Edit</button>
                              <button onClick={() => deleteEntry('rankings', item._id || item.id)} className="admin-btn-danger">Delete</button>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'polls') {
      return (
        <div className="admin-tab-content-grid">
          <div className="admin-card">
            <h2 className="admin-card-title">{editingId.polls ? 'Edit Poll' : 'Add Poll'}</h2>
            <div className="admin-form-group">
              <input value={formData.polls.title} onChange={(e) => setSectionField('polls', 'title', e.target.value)} placeholder="Title" className="admin-input" />
              
              <div className="admin-grid-split">
                <input 
                  value={formData.polls.group} 
                  onChange={(e) => setSectionField('polls', 'group', e.target.value)} 
                  placeholder="Group (e.g. PPMA)" 
                  className="admin-input" 
                />
                <select 
                  value={formData.polls.type} 
                  onChange={(e) => setSectionField('polls', 'type', e.target.value)} 
                  className="admin-input"
                  style={{ background: 'white' }}
                >
                  <option value="Minor">Minor</option>
                  <option value="Major">Major</option>
                </select>
              </div>

              <textarea 
                value={formData.polls.description} 
                onChange={(e) => setSectionField('polls', 'description', e.target.value)} 
                placeholder="Description (Optional)" 
                rows="3" 
                className="admin-textarea" 
              />

              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>From Date:</label>
                <input type="date" value={formData.polls.fromDate} onChange={(e) => setSectionField('polls', 'fromDate', e.target.value)} className="admin-input" />
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>To Date:</label>
                <input type="date" value={formData.polls.toDate} onChange={(e) => setSectionField('polls', 'toDate', e.target.value)} className="admin-input" />
              </div>

              <input
                key={fileInputKey.polls}
                type="file"
                accept="image/*"
                onChange={(e) => setSectionField('polls', 'image', e.target.files?.[0] || null)}
                className="admin-input"
              />
              <div className="admin-button-group">
                <button onClick={() => submitEntry('polls')} className="admin-btn-primary">{editingId.polls ? 'Update Poll' : 'Save Poll'}</button>
                {editingId.polls && <button onClick={() => resetForm('polls')} className="admin-btn-secondary">Cancel</button>}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Saved Polls</h2>
            <div className="admin-items-list">
              {loading ? <div>Loading...</div> : items.polls.length === 0 ? <div>No polls yet.</div> : items.polls.map((item) => {
                const now = new Date();
                const isEnded = item.toDate && new Date(item.toDate) < now;
                const dateRangeText = item.fromDate && item.toDate 
                  ? `${new Date(item.fromDate).toLocaleDateString()} – ${new Date(item.toDate).toLocaleDateString()}` 
                  : item.fromDate ? `From ${new Date(item.fromDate).toLocaleDateString()}` : '';

                return (
                  <div key={item._id || item.id} className="admin-item-row">
                    <div className="admin-item-info">
                      <div style={renderThumbnail(item.imageUrl, '#e2e8f0')} />
                      <div>
                        <div className="admin-item-name">{item.title}{isEnded ? ' (Ended)' : ''}</div>
                        <div className="admin-item-subtext">{dateRangeText}</div>
                        <div className="admin-item-subtext" style={{ color: '#2563eb' }}>{item.group} • {item.type}</div>
                      </div>
                    </div>
                    <div className="admin-item-actions">
                      <button onClick={() => startEdit('polls', item)} className="admin-btn-secondary">Edit</button>
                      <button onClick={() => deleteEntry('polls', item._id || item.id)} className="admin-btn-danger">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'pollGroups') {
      return (
        <div className="admin-tab-content-grid">
          <div className="admin-card">
            <h2 className="admin-card-title">Manage Poll Groups (Filters)</h2>
            <div className="admin-form-group">
              <input 
                value={formData.pollGroups.name} 
                onChange={(e) => setSectionField('pollGroups', 'name', e.target.value)} 
                placeholder="Group Name (e.g., PPMA, FAN PROJECT)" 
                className="admin-input" 
              />
              <input
                key={fileInputKey.pollGroups}
                type="file"
                accept="image/*"
                onChange={(e) => setSectionField('pollGroups', 'image', e.target.files?.[0] || null)}
                className="admin-input"
              />
              <div className="admin-button-group">
                <button onClick={() => submitEntry('pollGroups')} className="admin-btn-primary">
                  {editingId.pollGroups ? 'Update Group' : 'Save Group'}
                </button>
                {editingId.pollGroups && <button onClick={() => resetForm('pollGroups')} className="admin-btn-secondary">Cancel</button>}
              </div>
            </div>
          </div>
          <div className="admin-card">
            <h2 className="admin-card-title">Current Poll Groups</h2>
            <div className="admin-items-list">
              {loading ? <div>Loading...</div> : !items.pollGroups || items.pollGroups.length === 0 ? <div>No groups yet.</div> : items.pollGroups.map((item) => (
                <div key={item._id} className="admin-item-row">
                  <div className="admin-item-info">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="admin-item-thumb" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />}
                    <div className="admin-item-name" style={{ marginLeft: item.imageUrl ? '15px' : '0' }}>{item.name}</div>
                  </div>
                  <div className="admin-item-actions">
                    <button onClick={() => deleteEntry('pollGroups', item._id)} className="admin-btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'chika') {
      return (
        <div className="admin-tab-content-grid">
          <div className="admin-card">
            <h2 className="admin-card-title">{editingId.chika ? 'Edit Chika' : 'Add Chika'}</h2>
            <div className="admin-form-group">
              <input value={formData.chika.title} onChange={(e) => setSectionField('chika', 'title', e.target.value)} placeholder="Title" className="admin-input" />
              <textarea value={formData.chika.description} onChange={(e) => setSectionField('chika', 'description', e.target.value)} placeholder="Description" rows="5" className="admin-textarea" />
              <input value={formData.chika.url} onChange={(e) => setSectionField('chika', 'url', e.target.value)} placeholder="Article URL" className="admin-input" />
              <input
                key={fileInputKey.chika}
                type="file"
                accept="image/*"
                onChange={(e) => setSectionField('chika', 'image', e.target.files?.[0] || null)}
                className="admin-input"
              />
              <div className="admin-button-group">
                <button onClick={() => submitEntry('chika')} className="admin-btn-primary">{editingId.chika ? 'Update Chika' : 'Save Chika'}</button>
                {editingId.chika && <button onClick={() => resetForm('chika')} className="admin-btn-secondary">Cancel</button>}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Saved Chika</h2>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="featured-chika-select">Headline Article</label>
              <select
                id="featured-chika-select"
                value={featuredConfig.featuredChikaId}
                onChange={(e) => setFeaturedConfig({ ...featuredConfig, featuredChikaId: e.target.value })}
                className="admin-input"
              >
                <option value="">Use the latest article</option>
                {items.chika.map((item) => (
                  <option key={item._id || item.id} value={item._id || item.id}>{item.title}</option>
                ))}
              </select>
              <button onClick={saveFeaturedChika} className="admin-btn-primary">
                Save Headline
              </button>
            </div>
            <div className="admin-items-list">
              {loading ? <div>Loading...</div> : items.chika.length === 0 ? <div>No chika articles yet.</div> : items.chika.map((item) => (
                <div key={item._id || item.id} className="admin-item-row">
                  <div className="admin-item-info">
                    <div style={renderThumbnail(item.imageUrl, '#e2e8f0')} />
                    <div>
                      <div className="admin-item-name">{item.title}</div>
                      <div className="admin-item-subtext">{item.description}</div>
                    </div>
                  </div>
                  <div className="admin-item-actions">
                    <button onClick={() => startEdit('chika', item)} className="admin-btn-secondary">Edit</button>
                    <button onClick={() => deleteEntry('chika', item._id || item.id)} className="admin-btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'videos') {
      return (
        <div className="admin-tab-content-grid">
          <div className="admin-card">
            <h2 className="admin-card-title">{editingId.videos ? 'Edit Content' : 'Add Content'}</h2>
            <div className="admin-form-group">
              <input value={formData.videos.title} onChange={(e) => setSectionField('videos', 'title', e.target.value)} placeholder="Content title" className="admin-input" />
              
              <div className="admin-grid-split">
                <input value={formData.videos.subtitle} onChange={(e) => setSectionField('videos', 'subtitle', e.target.value)} placeholder="Subtitle / Event" className="admin-input" />
                {/* NEW PPOP GROUP INPUT */}
                <input value={formData.videos.group} onChange={(e) => setSectionField('videos', 'group', e.target.value)} placeholder="PPOP Group (e.g. BINI, SB19)" className="admin-input bg-white" />
              </div>

              <select value={formData.videos.platform} onChange={(e) => setSectionField('videos', 'platform', e.target.value)} className="admin-input">
                <option value="YouTube">YouTube</option>
                <option value="Facebook">Facebook</option>
                <option value="X">X</option>
                <option value="TikTok">TikTok</option>
              </select>
              <input value={formData.videos.youtubeUrl} onChange={(e) => setSectionField('videos', 'youtubeUrl', e.target.value)} placeholder="Content URL" className="admin-input" />
              
              <div className="admin-input-row">
                <input
                  key={fileInputKey.videos}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSectionField('videos', 'image', e.target.files?.[0] || null)}
                  className="admin-input admin-input-flex"
                />
              </div>

              <div className="admin-button-group">
                <button onClick={() => submitEntry('videos')} className="admin-btn-primary">{editingId.videos ? 'Update Video' : 'Save Video'}</button>
                {editingId.videos && <button onClick={() => resetForm('videos')} className="admin-btn-secondary">Cancel</button>}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Saved Contents</h2>
            <div className="admin-items-list">
              {loading ? <div>Loading...</div> : items.videos.length === 0 ? <div>No videos yet.</div> : items.videos.map((item) => (
                <div key={item._id || item.id} className="admin-item-row">
                  <div className="admin-item-info">
                    <div className="admin-item-thumb" style={renderThumbnail(item.imageUrl, '#1e293b')} />
                    <div>
                      <div className="admin-item-name">{item.title}</div>
                      <div className="admin-item-subtext">{item.platform || 'YouTube'}</div>
                      <div className="admin-item-subtext">{item.subtitle}</div>
                      {/* NEW PPOP GROUP BADGE IN LIST */}
                      {item.group && <div className="admin-item-subtext admin-item-highlight">{item.group}</div>}
                    </div>
                  </div>
                  <div className="admin-item-actions">
                    <button onClick={() => startEdit('videos', item)} className="admin-btn-secondary">Edit</button>
                    <button onClick={() => deleteEntry('videos', item._id || item.id)} className="admin-btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'banners') {
      return (
        <div className="admin-tab-content-grid">
          <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
            <h2 className="admin-card-title">Add New Banner</h2>
            <div className="admin-form-group">
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                  key={fileInputKey.banners}
                  type="file" 
                  accept="image/*"
                  onChange={handleBannerFileSelect}
                  className="admin-input"
                  style={{ flex: 1, minWidth: '200px', margin: 0 }}
                />
                
                {newBanner.image && (
                  <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    ✓ Cropped Banner Ready
                  </div>
                )}

                <input 
                  type="text" 
                  placeholder="Click Link URL (Optional)" 
                  value={newBanner.linkUrl} 
                  onChange={e => setNewBanner({ ...newBanner, linkUrl: e.target.value })}
                  className="admin-input"
                  style={{ flex: 1, minWidth: '200px', margin: 0 }}
                />
                <button 
                  onClick={handleAddBanner}
                  className="admin-btn-primary"
                  style={{ padding: '0 25px', height: '42px', margin: 0 }}
                >
                  Add Banner
                </button>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
            <h2 className="admin-card-title">Active Banners</h2>
            <div className="admin-items-list">
              {banners.length === 0 ? <div>No banners active.</div> : banners.map(banner => (
                <div key={banner._id || banner.id} className="admin-item-row">
                  <div className="admin-item-info">
                    <img src={banner.imageUrl} alt="preview" style={{ width: '120px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #dbe1ea' }} />
                    <div>
                      <div className="admin-item-subtext">Link: {banner.linkUrl || 'None'}</div>
                    </div>
                  </div>
                  <div className="admin-item-actions">
                    <button onClick={() => handleDeleteBanner(banner._id || banner.id)} className="admin-btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'reports') {
      return (
        <div className="admin-tab-content-grid">
          <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
            <h2 className="admin-card-title">User Issue Reports</h2>
            <div className="admin-items-list">
              {loading ? <div>Loading...</div> : items.reports.length === 0 ? <div>No reports yet.</div> : items.reports.map((item) => (
                <div key={item._id || item.id} className="admin-item-row" style={{ alignItems: 'flex-start' }}>
                  <div className="admin-item-info" style={{ flex: 1, alignItems: 'flex-start' }}>
                    {item.fileUrl && (
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                        <img src={item.fileUrl} alt="Report attachment" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #dbe1ea', display: 'block' }} />
                      </a>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="admin-item-name" style={{ fontSize: '16px', marginBottom: '4px' }}>{item.subject}</div>
                      <div style={{ fontSize: '13px', color: '#1e88e5', fontWeight: 'bold', marginBottom: '8px' }}>
                        Reported by: {item.reporterEmail || 'Anonymous'}
                      </div>
                      <div className="admin-item-subtext" style={{ whiteSpace: 'pre-wrap', color: '#334155', lineHeight: '1.5', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                        {item.issue}
                      </div>
                      <div className="admin-item-subtext" style={{ fontSize: '12px', color: '#64748b' }}>
                        Reported on: {new Date(item.createdAt).toLocaleString()}
                      </div>
                      {item.messages?.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <strong style={{ fontSize: '13px' }}>Messages sent</strong>
                          {item.messages.map((entry, index) => (
                            <p key={entry._id || `${item._id}-message-${index}`} style={{ margin: '6px 0', padding: '8px 10px', borderRadius: '6px', background: '#eff6ff', color: '#1e3a8a', whiteSpace: 'pre-wrap' }}>
                              {entry.message}
                            </p>
                          ))}
                        </div>
                      )}
                      {item.reporterEmail && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                          <textarea
                            value={reportMessages[item._id] || ''}
                            onChange={event => setReportMessages(previous => ({ ...previous, [item._id]: event.target.value }))}
                            placeholder="Write a message for the reporter..."
                            maxLength={2000}
                            rows={3}
                            style={{ flex: '1 1 260px', minWidth: 0, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', font: 'inherit', resize: 'vertical' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSendReportMessage(item._id)}
                            disabled={!reportMessages[item._id]?.trim()}
                            className="admin-btn-primary"
                            style={{ alignSelf: 'flex-end' }}
                          >
                            Send Message
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="admin-item-actions" style={{ marginLeft: '15px' }}>
                    <button 
                      onClick={() => handleResolveReport(item._id || item.id)} 
                      className="admin-btn-primary"
                      style={{ backgroundColor: '#10b981', border: 'none' }} 
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="admin-dashboard-wrapper">
      
      {/* --- CROP MODAL OVERLAY --- */}
      {cropSrc && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.9)', zIndex: 99999,
          display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#ffffff', padding: '20px', borderRadius: '16px',
            width: '90%', maxWidth: '800px', height: '80vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <h2 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Crop Banner Image (16:9)</h2>
            <div style={{ position: 'relative', flex: 1, background: '#cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              />
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
              <button 
                className="admin-btn-secondary" 
                style={{ flex: 1, padding: '12px', fontWeight: 'bold' }} 
                onClick={handleCancelCrop}
              >
                Cancel
              </button>
              <button 
                className="admin-btn-primary" 
                style={{ flex: 1, padding: '12px', fontWeight: 'bold' }} 
                onClick={handleConfirmCrop}
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-dashboard-container">
        <div className="admin-header-row">
          <div>
            <p className="admin-subtitle">Admin Panel</p>
            <h1 className="admin-title">Dashboard Overview</h1>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('juancast_user');
              navigate('/login');
            }}
            className="admin-logout-btn"
          >
            Logout
          </button>
        </div>

        <div className="admin-layout-grid">
          
          {/* --- CATEGORIZED SIDEBAR --- */}
          <aside className="admin-sidebar">
            {navCategories.map((category, idx) => (
              <div key={idx} style={{ marginBottom: '24px' }}>
                <div 
                  className="admin-sidebar-heading" 
                  style={{ 
                    fontSize: '11px', 
                    color: '#64748b', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px', 
                    marginBottom: '8px', 
                    paddingLeft: '16px',
                    fontWeight: '800'
                  }}
                >
                  {category.title}
                </div>
                {category.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`admin-nav-item ${activeTab === item.key ? 'active' : ''}`}
                    style={{ width: '100%', textAlign: 'left', marginBottom: '4px' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </aside>

          <section className="admin-content-section">
            {status && (
              <div className="admin-status-banner">
                {status}
              </div>
            )}
            {renderTabContent()}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;