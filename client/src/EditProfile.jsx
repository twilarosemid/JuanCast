import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css';
import logo from './assets/juancast_logo.webp';

// Default placeholder
import defaultAvatar from './assets/background_portrait.png'; 

function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [avatar, setAvatar] = useState(defaultAvatar);
  const [fullName, setFullName] = useState('Donato Gulferic');
  const [username, setUsername] = useState('euno.fxd');

  // 1. Fetch the user's current data from MongoDB when the page loads
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('juancast_user'));
        const userEmail = storedUser?.email;

        if (userEmail) {
          const response = await fetch(`http://localhost:5000/api/users/me?email=${userEmail}`);
          
          if (response.ok) {
            const dbUser = await response.json();
            // Pre-fill the form with database info
            if (dbUser.fullName) setFullName(dbUser.fullName);
            if (dbUser.username) setUsername(dbUser.username);
            if (dbUser.avatar) setAvatar(dbUser.avatar);
          }
        }
      } catch (error) {
        console.error("Error loading profile data for editing:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  // Convert the uploaded image into a Base64 string so it can be saved in JSON
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Save the new data back to the MongoDB database via your API
  const handleSave = async (e) => {
    e.preventDefault();
    
    // Get the email from the current session
    const storedUser = JSON.parse(localStorage.getItem('juancast_user'));
    const userEmail = storedUser?.email;
    
    // Construct the payload to send to your backend
    const updatePayload = {
      email: userEmail,
      fullName: fullName,
      username: username,
      avatar: avatar 
    };

    try {
      // Hit your new Node.js server running on port 5000
      const response = await fetch('http://localhost:5000/api/users/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Database update successful:", result);
        
        // Update local storage just in case other parts of the app rely on it temporarily
        const updatedStoredUser = { ...storedUser, fullName, username, avatar };
        localStorage.setItem('juancast_user', JSON.stringify(updatedStoredUser));
        
        navigate('/profile'); 
      } else {
        // Handle backend validation errors (e.g., username already taken, or cooldown active)
        const errorData = await response.json();
        alert(`Failed to save: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Network error while communicating with the database:", error);
      alert("A network error occurred. Is your backend server running?");
    }
  };

  return (
    <div className="edit-profile-wrapper">
      <div className="profile-header">
        <div className="profile-logo-bar">
          <img src={logo} alt="JuanCast" className="profile-nav-logo" />
        </div>
      </div>

      <div className="edit-profile-card">
        <button className="back-button" onClick={() => navigate('/profile')}>
          ← Back
        </button>

        <h2 className="edit-title">Edit Profile</h2>

        <form onSubmit={handleSave} className="edit-form">
          <div className="edit-avatar-container" onClick={handleAvatarClick}>
            <div className="edit-avatar-circle">
              <img src={avatar} alt="Profile" />
              <div className="avatar-overlay">
                <svg viewBox="0 0 24 24" fill="white" width="30" height="30">
                  <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                </svg>
              </div>
            </div>
            <p className="upload-text">Change Photo</p>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              style={{ display: 'none' }} 
            />
          </div>

          <div className="input-group">
            <label>Full Name</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
            />
            <span className="cooldown-text">You can only change your name once every 7 days.</span>
          </div>

          <div className="input-group">
            <label>Username</label>
            <div className="username-wrapper">
              <span className="at-symbol">@</span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
            </div>
            <span className="cooldown-text">You can only change your @username once every 30 days.</span>
          </div>

          <button type="submit" className="save-button">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;