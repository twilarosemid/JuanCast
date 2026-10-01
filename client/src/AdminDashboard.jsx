import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import './components/css/AdminDashboard.css';

const API_BASE = 'http://localhost:5000';

const emptyForms = {
  rankings: { name: '', position: '1', youtubeUrl: '', youtubeStartTime: 0, image: null },
  polls: { title: '', fromDate: '', toDate: '', image: null },
  chika: { title: '', description: '', url: '', image: null },
  videos: { title: '', subtitle: '', youtubeUrl: '', image: null } 
};

const navItems = [
  { key: 'rankings', label: 'Rankings' },
  { key: 'polls', label: 'Polls' },
  { key: 'chika', label: 'Chika' },
  { key: 'banners', label: 'Banners' },
  { key: 'videos', label: 'YouTube Content' },
  { key: 'reports', label: 'User Reports' } // <-- ADDED REPORTS TAB
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
  const [activeTab, setActiveTab] = useState('rankings');
  const [formData, setFormData] = useState(emptyForms);
  const [editingId, setEditingId] = useState({ rankings: null, polls: null, chika: null, videos: null });
  
  // <-- ADDED reports ARRAY TO STATE
  const [items, setItems] = useState({ rankings: [], polls: [], chika: [], videos: [], reports: [] });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [fileInputKey, setFileInputKey] = useState({ rankings: 0, polls: 0, chika: 0, banners: 0, videos: 0 });

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
      // <-- ADDED /api/reports TO FETCH PROMISES
      const [rankingsRes, pollsRes, chikaRes, videosRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE}/api/rankings`),
        fetch(`${API_BASE}/api/polls`),
        fetch(`${API_BASE}/api/chika`),
        fetch(`${API_BASE}/api/videos`), 
        fetch(`${API_BASE}/api/reports`)
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

      const rankings = await parseJsonSafe(rankingsRes);
      const polls = await parseJsonSafe(pollsRes);
      const chika = await parseJsonSafe(chikaRes);
      const videos = await parseJsonSafe(videosRes);
      const reports = await parseJsonSafe(reportsRes); // <-- PARSE REPORTS

      setItems({ rankings, polls, chika, videos, reports });
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

      if (section === 'rankings') {
        if (!payload.name?.trim()) throw new Error('Ranking name is required.');
        form.append('name', payload.name);
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
        if (payload.youtubeUrl) form.append('youtubeUrl', payload.youtubeUrl);
        if (payload.image) form.append('image', payload.image);
      }

      const method = editingId[section] ? 'PUT' : 'POST';
      const url = `${API_BASE}/api/${section}${editingId[section] ? `/${editingId[section]}` : ''}`;

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

      setStatus(`${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully.`);
      resetForm(section);
      await loadContent();
    } catch (error) {
      console.error('Error saving admin entry:', error);
      setStatus(error.message || 'Unable to save data.');
    }
  };

  const deleteEntry = async (section, id) => {
    try {
      const response = await fetch(`${API_BASE}/api/${section}/${id}`, { method: 'DELETE' });
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server error (${response.status}): Endpoint might be missing.`);
      }

      if (!response.ok) throw new Error(result.message || 'Unable to delete item.');

      setStatus(`${section.charAt(0).toUpperCase() + section.slice(1)} deleted successfully.`);
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
        youtubeUrl: item.youtubeUrl || '',
        youtubeStartTime: item.youtubeStartTime || 0,
        image: null
      },
      polls: {
        title: item.title || '',
        fromDate: item.fromDate ? new Date(item.fromDate).toISOString().slice(0, 10) : '',
        toDate: item.toDate ? new Date(item.toDate).toISOString().slice(0, 10) : '',
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
        youtubeUrl: item.youtubeUrl || '',
        image: null
      }
    };

    setFormData((prev) => ({ ...prev, [section]: nextForm[section] }));
    setEditingId((prev) => ({ ...prev, [section]: item._id || item.id }));
    setFileInputKey((prev) => ({ ...prev, [section]: prev[section] + 1 }));
  };

  // --- Banner Cropping Event Handlers ---
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

  const renderThumbnail = (imageUrl, fallbackBg = '#e2e8f0') => ({
    width: '52px',
    height: '52px',
    borderRadius: '10px',
    background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : fallbackBg,
    border: '1px solid #dbe1ea'
  });

  const renderTabContent = () => {
    if (activeTab === 'rankings') {
      return (
        <div className="admin-tab-content-grid">
          <div className="admin-card">
            <h2 className="admin-card-title">{editingId.rankings ? 'Edit Ranking' : 'Add Ranking'}</h2>
            <div className="admin-form-group">
              <input value={formData.rankings.name} onChange={(e) => setSectionField('rankings', 'name', e.target.value)} placeholder="Name" className="admin-input" />
              
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
                <input type="number" min="1" value={formData.rankings.position} onChange={(e) => setSectionField('rankings', 'position', e.target.value)} placeholder="Position" className="admin-input" />
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
                <button onClick={() => submitEntry('rankings')} className="admin-btn-primary">{editingId.rankings ? 'Update Ranking' : 'Save Ranking'}</button>
                {editingId.rankings && <button onClick={() => resetForm('rankings')} className="admin-btn-secondary">Cancel</button>}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Saved Rankings</h2>
            <div className="admin-items-list">
              {loading ? <div>Loading...</div> : items.rankings.length === 0 ? <div>No rankings yet.</div> : items.rankings.map((item) => (
                <div key={item._id || item.id} className="admin-item-row">
                  <div className="admin-item-info">
                    <div style={renderThumbnail(item.imageUrl, '#dbeafe')} />
                    <div>
                      <div className="admin-item-name">{item.name}</div>
                      <div className="admin-item-subtext">#{item.position} • {new Intl.NumberFormat('en-US').format(item.voteCount || 0)} votes</div>
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
            <h2 className="admin-card-title">{editingId.videos ? 'Edit Video' : 'Add Video'}</h2>
            <div className="admin-form-group">
              <input value={formData.videos.title} onChange={(e) => setSectionField('videos', 'title', e.target.value)} placeholder="Title (e.g. MNL 48 - Pag-ibig)" className="admin-input" />
              <input value={formData.videos.subtitle} onChange={(e) => setSectionField('videos', 'subtitle', e.target.value)} placeholder="Subtitle (e.g. PPOP MUSIC AWARDS)" className="admin-input" />
              <input value={formData.videos.youtubeUrl} onChange={(e) => setSectionField('videos', 'youtubeUrl', e.target.value)} placeholder="YouTube Video URL (Optional)" className="admin-input" />
              <input
                key={fileInputKey.videos}
                type="file"
                accept="image/*"
                onChange={(e) => setSectionField('videos', 'image', e.target.files?.[0] || null)}
                className="admin-input"
              />
              <div className="admin-button-group">
                <button onClick={() => submitEntry('videos')} className="admin-btn-primary">{editingId.videos ? 'Update Video' : 'Save Video'}</button>
                {editingId.videos && <button onClick={() => resetForm('videos')} className="admin-btn-secondary">Cancel</button>}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Saved Videos</h2>
            <div className="admin-items-list">
              {loading ? <div>Loading...</div> : items.videos.length === 0 ? <div>No videos yet.</div> : items.videos.map((item) => (
                <div key={item._id || item.id} className="admin-item-row">
                  <div className="admin-item-info">
                    <div style={renderThumbnail(item.imageUrl, '#1e293b')} />
                    <div>
                      <div className="admin-item-name">{item.title}</div>
                      <div className="admin-item-subtext">{item.subtitle}</div>
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
                
                {/* Visual indicator that the cropped image is loaded into state */}
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

    // --- ADDED REPORTS TAB CONTENT ---
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
                      <div className="admin-item-subtext" style={{ whiteSpace: 'pre-wrap', color: '#334155', lineHeight: '1.5', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                        {item.issue}
                      </div>
                      <div className="admin-item-subtext" style={{ fontSize: '12px', color: '#64748b' }}>
                        Reported on: {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
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
          <aside className="admin-sidebar">
            <div className="admin-sidebar-heading">Content</div>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`admin-nav-item ${activeTab === item.key ? 'active' : ''}`}
              >
                {item.label}
              </button>
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