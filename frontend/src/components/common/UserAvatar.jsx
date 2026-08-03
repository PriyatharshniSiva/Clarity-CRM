import React, { useState, useEffect } from 'react';
import { getUploadUrl } from '../../services/api';

const getInitials = (name) => {
  if (!name) return 'U';
  const trimmed = String(name).trim();
  if (!trimmed) return 'U';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

export const createInlineSvgAvatar = (name) => {
  const initials = getInitials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%232563eb"/><text x="50%" y="54%" dominant-baseline="central" text-anchor="middle" font-size="38" font-weight="800" fill="%23ffffff" font-family="system-ui, -apple-system, sans-serif">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
};

const UserAvatar = ({ user, src, name, className = "h-8 w-8 rounded-xl object-cover" }) => {
  const [imgError, setImgError] = useState(false);

  const actualSrc = user?.profilePhoto || user?.profilePic || user?.avatar || user?.profileImage || user?.profilePicture || src;
  const actualName = name || user?.name || user?.username || user?.email;

  useEffect(() => {
    setImgError(false);
  }, [actualSrc, actualName]);

  const hasCustomPic = actualSrc && !imgError;

  if (hasCustomPic) {
    return (
      <img
        src={getUploadUrl(actualSrc)}
        alt={actualName || 'User Avatar'}
        className={`${className} object-cover`}
        onError={() => setImgError(true)}
      />
    );
  }

  const initials = getInitials(actualName);

  return (
    <div
      className={`${className} bg-gradient-primary text-white flex items-center justify-center font-black select-none shrink-0 text-center uppercase tracking-tight`}
      title={actualName || 'User'}
    >
      <span>{initials}</span>
    </div>
  );
};

export default UserAvatar;
