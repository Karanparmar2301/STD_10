import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
    selectAttendancePercentage,
    selectAttendanceStats,
    selectMotivationalMessage
} from '../../store/attendanceSlice';
import './AttendanceProgress.css';

/**
 * AttendanceProgress - Animated Circular Progress Indicator
 * Shows attendance percentage with motivational message
 */
function AttendanceProgress() {
    const percentage = useSelector(selectAttendancePercentage);
    const stats = useSelector(selectAttendanceStats);
    const motivation = useSelector(selectMotivationalMessage);

    // SVG Circle calculations
    const size = 200;
    const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    // Color based on percentage
    const getProgressColor = () => {
        if (percentage >= 95) return '#10b981'; // Green
        if (percentage >= 85) return '#3b82f6'; // Blue
        if (percentage >= 75) return '#f59e0b'; // Orange
        return '#ef4444'; // Red
    };

    const progressColor = getProgressColor();

    return (
        <div className="attendance-summary">
            {/* Circular Progress */}
            <div className="circle-container">
                <svg width={size} height={size} className="progress-ring">
                    {/* Background Circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth={strokeWidth}
                    />
                    
                    {/* Animated Progress Circle */}
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={progressColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        style={{
                            filter: `drop-shadow(0 0 8px ${progressColor}40)`
                        }}
                    />
                </svg>

                {/* Center Content */}
                <div className="circle-center">
                    <motion.span
                        className="percent"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                    >
                        {percentage}%
                    </motion.span>
                    
                    <motion.p
                        className="message"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                    >
                        {motivation.message}
                    </motion.p>
                    
                    <motion.span
                        className="emoji"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.8, type: 'spring', stiffness: 150 }}
                    >
                        {motivation.emoji}
                    </motion.span>
                </div>

                {/* Confetti Animation for 100% */}
                {percentage === 100 && (
                    <motion.div
                        className="confetti"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        🎊
                    </motion.div>
                )}
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <motion.div
                    className="stat present"
                    whileHover={{ scale: 1.05, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <h2>{stats.presentDays}</h2>
                    <p>Present</p>
                </motion.div>

                <motion.div
                    className="stat absent"
                    whileHover={{ scale: 1.05, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <h2>{stats.absentDays}</h2>
                    <p>Absent</p>
                </motion.div>

                <motion.div
                    className="stat total"
                    whileHover={{ scale: 1.05, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <h2>{stats.totalDays}</h2>
                    <p>Total Days</p>
                </motion.div>
            </div>
        </div>
    );
}

export default AttendanceProgress;
