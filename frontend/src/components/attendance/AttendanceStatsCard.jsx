import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
    selectWeeklySummary,
    selectAttendanceStreak,
    selectPerfectAttendanceBadge
} from '../../store/attendanceSlice';
import './AttendanceStatsCard.css';

/**
 * AttendanceStatsCard - Weekly Summary and Badges
 * Shows last 7 days stats and achievement badges
 */
function AttendanceStatsCard() {
    const weeklySummary = useSelector(selectWeeklySummary);
    const streak = useSelector(selectAttendanceStreak);
    const hasPerfectBadge = useSelector(selectPerfectAttendanceBadge);

    // Generate weekly bar chart data
    const maxDays = 7;
    const presentBarWidth = (weeklySummary.presentCount / maxDays) * 100;
    const absentBarWidth = (weeklySummary.absentCount / maxDays) * 100;

    return (
        <div className="attendance-stats-card">
            {/* Weekly Summary */}
            <div className="stats-section">
                <div className="weekly-card">
                    <div className="weekly-header">
                        <h3>Weekly Attendance</h3>
                        <motion.span
                            className="weekly-percent"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                        >
                            {weeklySummary.percentage}%
                        </motion.span>
                    </div>

                    <div className="attendance-row present-row">
                        <div className="row-left">
                            <span className="label">Present</span>
                            <span className="value present-value">{weeklySummary.presentCount}</span>
                        </div>
                        <div className="progress-track">
                            <motion.div
                                className="progress-fill present-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${presentBarWidth}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            />
                        </div>
                    </div>

                    <div className="attendance-row absent-row">
                        <div className="row-left">
                            <span className="label">Absent</span>
                            <span className="value absent-value">{weeklySummary.absentCount}</span>
                        </div>
                        <div className="progress-track">
                            <motion.div
                                className="progress-fill absent-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${absentBarWidth}%` }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Streak Section */}
            <div className="stats-section streak-section">
                <div className="card-header">
                    <div className="header-left">
                        <span className="header-icon">🔥</span>
                        <h3>Current Streak</h3>
                    </div>
                </div>
                
                <div className="streak-card">
                    <div className="streak-content">
                        <motion.span 
                            className="streak-icon"
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                        >
                            🔥
                        </motion.span>
                        <div className="streak-info">
                            <h2>{streak}</h2>
                            <p>Days</p>
                        </div>

                    </div>
                </div>

                {streak >= 7 && (
                    <motion.div
                        className="streak-message"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        You're on fire! 🔥
                    </motion.div>
                )}
            </div>

            {/* Perfect Attendance Badge */}
            {hasPerfectBadge && (
                <motion.div
                    className="badge-section"
                    initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 1, type: 'spring', stiffness: 120 }}
                >
                    <div className="perfect-badge">
                        <motion.div
                            className="badge-icon"
                            animate={{
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.05, 1]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                        >
                            🏅
                        </motion.div>
                        <div className="badge-content">
                            <div className="badge-title">Perfect Month!</div>
                            <div className="badge-subtitle">30+ Days Streak</div>
                        </div>
                    </div>

                    {/* Star Explosion Animation */}
                    <motion.div
                        className="star-explosion"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        ✨
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}

export default AttendanceStatsCard;
