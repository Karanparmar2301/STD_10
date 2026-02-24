import React from 'react';
import { useSelector } from 'react-redux';
import { selectGamificationProgress } from '../store/gamificationSlice';
import './XPProgressBar.css';

const XPProgressBar = ({ compact = false }) => {
    const { level, currentLevelXP, xpToNextLevel, progressPercentage } = useSelector(selectGamificationProgress);
    const totalXPForLevel = currentLevelXP + xpToNextLevel;

    return (
        <div className={`xp-progress-container ${compact ? 'compact' : ''}`}>
            {!compact && (
                <div className="xp-header">
                    <div className="level-badge">
                        <span className="level-icon">⭐</span>
                        <span className="level-text">Level {level}</span>
                    </div>
                    <div className="xp-text">
                        <span className="current-xp">{currentLevelXP}</span>
                        <span className="xp-separator">/</span>
                        <span className="total-xp">{totalXPForLevel} XP</span>
                    </div>
                </div>
            )}

            <div className="xp-progress-bar">
                <div
                    className="xp-progress-fill"
                    style={{ width: `${progressPercentage}%` }}
                >
                    <div className="xp-progress-shimmer"></div>
                </div>
            </div>

            {compact && (
                <div className="xp-compact-info">
                    <span className="compact-level">Lvl {level}</span>
                    <span className="compact-xp">{currentLevelXP}/{totalXPForLevel}</span>
                </div>
            )}
        </div>
    );
};

export default XPProgressBar;
