import React from 'react';
import './css/ProfileButtons.css';

export const ProfileMenuButton = ({ icon, text, onClick }) => {
  return (
    <div className="profile-menu-item" onClick={onClick}>
      <div className="profile-menu-icon">
        {icon}
      </div>
      <span className="profile-menu-text">{text}</span>
    </div>
  );
};

export const ProfileActionButton = ({ label, onClick, variant = "default" }) => {
  const className = variant === "primary" ? "save-button" : "profile-edit-btn";
  return (
    <button className={className} onClick={onClick}>
      {label}
    </button>
  );
};