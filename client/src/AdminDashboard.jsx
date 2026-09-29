import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './components/css/AdminDashboard.css';

const API_BASE = 'http://localhost:5000';

const emptyForms = {
  rankings: { name: '', position: '1', image: null },
  polls: { title: '', fromDate: '', toDate: '', image: null },
  chika: { title: '', description: '', url: '', image: null }
};

const navItems = [
  { key: 'rankings', label: 'Rankings' },
  { key: 'polls', label: 'Polls' },
  { key: 'chika', label: 'Chika' }
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rankings');
  const [formData, setFormData] = useState(emptyForms);
  const [editingId, setEditingId] = useState({ rankings: null, polls: null, chika: null });
  const [items, setItems] = useState({ rankings: [], polls: [], chika: [] });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [fileInputKey, setFileInputKey] = useState({ rankings: 0, polls: 0, chika: 0 });

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('juancast_user') || 'null');
    const isAdmin = Boolean(currentUser?.isAdmin || currentUser?.role === 'admin');
    if (!currentUser || !isAdmin) {
      navigate('/login', { replace: true });
      return;
    }

    loadContent();
  }, [navigate]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const [rankingsRes, pollsRes, chikaRes] = await Promise.all([
        fetch(`${API_BASE}/api/rankings`),
        fetch(`${API_BASE}/api/polls`),
        fetch(`${API_BASE}/api/chika`)
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

      setItems({ rankings, polls, chika });
    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      setStatus('Failed to load content from the database. Check if backend is running.');
    } finally {
      setLoading(false);
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
        if (!payload.name?.trim()) {
          throw new Error('Ranking name is required.');
        }
        form.append('name', payload.name);
        form.append('position', payload.position || '1');
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

      if (!response.ok) {
        throw new Error(result.message || 'Unable to save data.');
      }

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
      const response = await fetch(`${API_BASE}/api/${section}/${id}`, {
        method: 'DELETE'
      });
      
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server error (${response.status}): Endpoint might be missing.`);
      }

      if (!response.ok) {
        throw new Error(result.message || 'Unable to delete item.');
      }

      setStatus(`${section.charAt(0).toUpperCase() + section.slice(1)} deleted successfully.`);
      if (editingId[section] === id) {
        resetForm(section);
      }
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
      }
    };

    setFormData((prev) => ({ ...prev, [section]: nextForm[section] }));
    setEditingId((prev) => ({ ...prev, [section]: item._id || item.id }));
    setFileInputKey((prev) => ({ ...prev, [section]: prev[section] + 1 }));
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
  };

  return (
    <div className="admin-dashboard-wrapper">
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