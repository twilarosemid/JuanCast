import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../assets/background_portrait.png';
import './css/EditProfile.css';

function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const defaultCoverPhoto = '';

  const [avatar, setAvatar] = useState(defaultAvatar);
  const [coverPhoto, setCoverPhoto] = useState(defaultCoverPhoto);
  const [coverPosition, setCoverPosition] = useState({ x: 50, y: 50 });
  const [fullName, setFullName] = useState('Donato Josef Asid Gulferic');
  const [username, setUsername] = useState('euno.fxd');
  const [joinedDate, setJoinedDate] = useState('Joined recently');
  const [initialProfile, setInitialProfile] = useState(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [tokens, setTokens] = useState(10);
  const [stars, setStars] = useState(10);
  const [cropper, setCropper] = useState(null);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const formatJoinedDate = (dateValue) => {
    if (!dateValue) return 'Joined recently';

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Joined recently';

    return `Joined ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  useEffect(() => {
    const syncUserData = async () => {
      let profile = {
        fullName: 'Donato Josef Asid Gulferic',
        username: 'euno.fxd',
        avatar: defaultAvatar,
        coverPhoto: defaultCoverPhoto,
        coverPosition: { x: 50, y: 50 },
        createdAt: null
      };

      try {
        const storedUser = JSON.parse(localStorage.getItem('juancast_user') || 'null');
        const userEmail = storedUser?.email;

        if (storedUser) {
          profile = {
            ...profile,
            fullName: storedUser.fullName || storedUser.name || profile.fullName,
            username: storedUser.username || profile.username,
            avatar: storedUser.avatar || profile.avatar,
            coverPhoto: storedUser.coverPhoto || profile.coverPhoto,
            coverPosition: storedUser.coverPosition || profile.coverPosition,
            createdAt: storedUser.createdAt || storedUser.joinDate || profile.createdAt
          };
          setFullName(profile.fullName);
          setUsername(profile.username);
          setAvatar(profile.avatar);
          setCoverPhoto(profile.coverPhoto);
          setCoverPosition(profile.coverPosition);
          setJoinedDate(formatJoinedDate(profile.createdAt));
          setTokens(storedUser.tokens ?? 10);
          setStars(storedUser.stars ?? 10);
        }

        if (userEmail) {
          const response = await fetch(`http://[https://juancast.onrender.com](https://juancast.onrender.com)/api/users/me?email=${encodeURIComponent(userEmail)}`);
          if (response.ok) {
            const dbUser = await response.json();
            profile = {
              ...profile,
              fullName: dbUser.fullName || profile.fullName,
              username: dbUser.username || profile.username,
              avatar: dbUser.avatar || profile.avatar,
              coverPhoto: dbUser.coverPhoto || profile.coverPhoto,
              coverPosition: dbUser.coverPosition || profile.coverPosition,
              createdAt: dbUser.createdAt || profile.createdAt
            };
            setFullName(profile.fullName);
            setUsername(profile.username);
            setAvatar(profile.avatar);
            setCoverPhoto(profile.coverPhoto);
            setCoverPosition(profile.coverPosition);
            setJoinedDate(formatJoinedDate(profile.createdAt));
          }
        }
      } catch (error) {
        console.error('Error loading profile data for editing:', error);
      } finally {
        setInitialProfile(profile);
        setIsProfileLoaded(true);
      }
    };

    syncUserData();
  }, []);

  const hasChanges = initialProfile !== null && (
    fullName !== initialProfile.fullName
    || username !== initialProfile.username
    || avatar !== initialProfile.avatar
    || coverPhoto !== initialProfile.coverPhoto
    || coverPosition.x !== initialProfile.coverPosition.x
    || coverPosition.y !== initialProfile.coverPosition.y
  );

  useEffect(() => {
    if (!isDraggingCrop || !cropper) return undefined;

    const handlePointerMove = (event) => {
      setCropper((current) => {
        if (!current) return current;
        return {
          ...current,
          offsetX: event.clientX - dragStart.x,
          offsetY: event.clientY - dragStart.y
        };
      });
    };

    const handlePointerUp = () => {
      setIsDraggingCrop(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingCrop, dragStart, cropper]);

  const openCropper = (file, type) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropper({
        type,
        source: reader.result,
        zoom: 1,
        offsetX: 0,
        offsetY: 0
      });
    };
    reader.readAsDataURL(file);
  };

  const closeCropper = () => {
    setCropper(null);
    setIsDraggingCrop(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleCoverClick = () => {
    coverInputRef.current.click();
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    openCropper(file, 'avatar');
    event.target.value = '';
  };

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    openCropper(file, 'cover');
    event.target.value = '';
  };

  const handleCropPointerDown = (event) => {
    if (!cropper) return;
    event.preventDefault();
    setIsDraggingCrop(true);
    setDragStart({
      x: event.clientX - cropper.offsetX,
      y: event.clientY - cropper.offsetY
    });
  };

  const handleCropZoom = (event) => {
    const value = Number(event.target.value);
    setCropper((current) => {
      if (!current) return current;
      return { ...current, zoom: value };
    });
  };

  const applyCrop = () => {
    if (!cropper || !cropper.source) return;

    const image = new Image();
    image.src = cropper.source;
    image.onload = () => {
      const stageElement = document.querySelector('.cropper-stage');
      const viewportElement = document.querySelector('.cropper-viewport');

      const stageRect = stageElement?.getBoundingClientRect();
      const viewportRect = viewportElement?.getBoundingClientRect();

      const stageWidth = stageRect?.width || (cropper.type === 'avatar' ? 320 : 620);
      const stageHeight = stageRect?.height || (cropper.type === 'avatar' ? 320 : 220);
      const cropBoxWidth = viewportRect?.width || (cropper.type === 'avatar' ? 220 : 560);
      const cropBoxHeight = viewportRect?.height || (cropper.type === 'avatar' ? 220 : 160);
      const boxLeft = (stageWidth - cropBoxWidth) / 2;
      const boxTop = (stageHeight - cropBoxHeight) / 2;

      const sourceX = ((boxLeft - cropper.offsetX) / cropper.zoom);
      const sourceY = ((boxTop - cropper.offsetY) / cropper.zoom);
      const sourceWidth = (cropBoxWidth / cropper.zoom);
      const sourceHeight = (cropBoxHeight / cropper.zoom);

      const canvas = document.createElement('canvas');
      const outputWidth = cropper.type === 'avatar' ? 320 : 1200;
      const outputHeight = cropper.type === 'avatar' ? 320 : 500;
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext('2d');

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        Math.max(0, sourceX),
        Math.max(0, sourceY),
        Math.min(image.naturalWidth, Math.max(0, sourceWidth)),
        Math.min(image.naturalHeight, Math.max(0, sourceHeight)),
        0,
        0,
        canvas.width,
        canvas.height
      );

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

      if (cropper.type === 'avatar') {
        setAvatar(croppedDataUrl);
      } else {
        const nextCoverPosition = {
          x: Math.max(0, Math.min(100, 50 + ((cropper.offsetX || 0) / Math.max(1, stageWidth)) * 100)),
          y: Math.max(0, Math.min(100, 50 + ((cropper.offsetY || 0) / Math.max(1, stageHeight)) * 100))
        };

        setCoverPosition(nextCoverPosition);
        setCoverPhoto(croppedDataUrl);
      }

      closeCropper();
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isProfileLoaded || !hasChanges) return;

    const storedUser = JSON.parse(localStorage.getItem('juancast_user') || 'null');
    const userEmail = storedUser?.email;

    if (!userEmail) {
      alert('Your session is expired. Please log in again.');
      navigate('/login');
      return;
    }

    const updatePayload = { email: userEmail, fullName, username, avatar, coverPhoto, coverPosition };

    try {
      const response = await fetch('http://[https://juancast.onrender.com](https://juancast.onrender.com)/api/users/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (response.ok) {
        const updatedStoredUser = {
          ...storedUser,
          fullName,
          username,
          avatar,
          coverPhoto,
          coverPosition,
          tokens,
          stars
        };

        localStorage.setItem('juancast_user', JSON.stringify(updatedStoredUser));
        window.dispatchEvent(new Event('juancast-user-updated'));
        navigate('/profile');
      } else {
        const errorData = await response.json();
        alert(`Failed to save: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('A network error occurred.');
    }
  };

  return (
    <div className="profile-dashboard-layout profile-edit-page">
      <div className="profile-main-card profile-edit-main-card">
        <div className="profile-cover-wrapper">
          <div className="profile-cover-photo">
            {coverPhoto ? (
              <img
                src={coverPhoto}
                alt="Cover preview"
                style={{ objectPosition: `${coverPosition.x}% ${coverPosition.y}%` }}
              />
            ) : null}
          </div>

          <div className="profile-cover-change-row">
            <button type="button" className="profile-change-cover-btn" onClick={handleCoverClick}>
              Change Cover Photo
            </button>
          </div>
        </div>

        <div className="profile-header-content">
          <div className="profile-left-identity">
            <div className="profile-avatar-circle profile-edit-avatar" onClick={handleAvatarClick}>
              {avatar ? (
                <img src={avatar} alt="Profile avatar" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
              <div className="profile-edit-avatar-overlay">
                <span>Change Photo</span>
              </div>
            </div>

            <div className="profile-user-info">
              <h2 className="profile-fullname">{fullName}</h2>
              <p className="profile-username">@{username}</p>
              <p className="profile-joined">{joinedDate}</p>
            </div>
          </div>

          <div className="profile-right-actions">
            <button type="button" className="profile-edit-btn" onClick={() => navigate('/profile')}>
              Back to Profile
            </button>
          </div>
        </div>

        <div className="profile-edit-panel">
          <div className="profile-edit-header">
            <h3>Edit Profile</h3>
          </div>

          <form onSubmit={handleSave} className="edit-form">
            <div className="input-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <span className="cooldown-text">You can only change your name once every 7 days.</span>
            </div>

            <div className="input-group">
              <label htmlFor="username">Username</label>
              <div className="username-wrapper">
                <span className="at-symbol">@</span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <span className="cooldown-text">You can only change your @username once every 30 days.</span>
            </div>

            <div className="profile-edit-actions">
              <button type="button" className="profile-edit-cancel" onClick={() => navigate('/profile')}>
                Cancel
              </button>
              <button type="submit" className="save-button" disabled={!isProfileLoaded || !hasChanges}>
                Save Changes
              </button>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <input
              type="file"
              accept="image/*"
              ref={coverInputRef}
              onChange={handleCoverChange}
              style={{ display: 'none' }}
            />
          </form>
        </div>
      </div>

      {cropper && (
        <div className="cropper-backdrop" role="dialog" aria-modal="true">
          <div className="cropper-modal">
            <div className="cropper-header">
              <h3>{cropper.type === 'avatar' ? 'Crop Profile Photo' : 'Crop Cover Photo'}</h3>
              <button type="button" className="cropper-close" onClick={closeCropper}>
                ×
              </button>
            </div>

            <div className="cropper-stage" onPointerDown={handleCropPointerDown}>
              <img
                src={cropper.source}
                alt="Crop preview"
                className="cropper-image"
                style={{
                  transform: `translate(${cropper.offsetX}px, ${cropper.offsetY}px) scale(${cropper.zoom})`,
                  cursor: isDraggingCrop ? 'grabbing' : 'grab'
                }}
              />
              <div className={`cropper-viewport ${cropper.type === 'avatar' ? 'avatar-crop' : 'cover-crop'}`} />
            </div>

            <div className="cropper-controls">
              <label htmlFor="crop-zoom">Zoom</label>
              <input
                id="crop-zoom"
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={cropper.zoom}
                onChange={handleCropZoom}
              />
            </div>

            <div className="cropper-actions">
              <button type="button" className="cropper-cancel" onClick={closeCropper}>Cancel</button>
              <button type="button" className="cropper-save" onClick={applyCrop}>Use Cropped Photo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditProfile;