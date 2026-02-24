import React from 'react';
import './NotificationBadge.css';

const NotificationBadge = ({ count = 0, onClick }) => {
    if (count === 0) return null;

    const displayCount = count > 99 ? '99+' : count;

    return (
        <div className="notification-badge-container" onClick={onClick}>
            <div className="notification-icon">
                <span>🔔</span>
                {count > 0 && (
                    <span className="notification-count">{displayCount}</span>
                )}
            </div>
        </div>
    );
};

export default NotificationBadge;
