import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { selectWeeklyAttendance } from '../../store/attendanceSlice';
import './WeeklyGoalTracker.css';

const WeeklyGoalTracker = () => {
    const { present, absent, goal, progress } = useSelector(selectWeeklyAttendance);
    const [showConfetti, setShowConfetti] = useState(false);
    const [hasShownConfetti, setHasShownConfetti] = useState(false);

    // Show confetti when goal is reached
    useEffect(() => {
        if (progress >= 100 && !hasShownConfetti) {
            setShowConfetti(true);
            setHasShownConfetti(true);
            
            // Hide confetti after 3 seconds
            setTimeout(() => {
                setShowConfetti(false);
            }, 3000);
        }
    }, [progress, hasShownConfetti]);

    const getProgressMessage = () => {
        if (progress >= 100) {
            return { emoji: '🎉', text: 'Goal Complete! Amazing!' };
        } else if (progress >= 80) {
            return { emoji: '👍', text: 'Almost there!' };
        } else if (progress >= 60) {
            return { emoji: '💪', text: 'Keep going!' };
        } else if (progress >= 40) {
            return { emoji: '🌱', text: 'Making progress!' };
        } else {
            return { emoji: '🚀', text: 'Let\'s do this!' };
        }
    };

    const message = getProgressMessage();

    // Generate confetti particles
    const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        color: confettiColors[i % confettiColors.length],
        x: Math.random() * 100,
        delay: Math.random() * 0.3
    }));

    return (
        <motion.div 
            className="weekly-goal-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
        >
            <div className="goal-header">
                <div className="header-left">
                    <span className="header-icon">🎯</span>
                    <h3>Weekly Goal Tracker</h3>
                </div>
                <div className="header-badges">
                {progress >= 100 && (
                    <motion.div 
                        className="star-badge"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                            type: 'spring', 
                            stiffness: 200,
                            delay: 0.2
                        }}
                    >
                        Weekly Star 🌟
                    </motion.div>
                )}
                </div>
            </div>

            {/* Confetti Animation */}
            <AnimatePresence>
                {showConfetti && (
                    <div className="confetti-container">
                        {confettiParticles.map(particle => (
                            <motion.div
                                key={particle.id}
                                className="confetti-piece"
                                style={{
                                    backgroundColor: particle.color,
                                    left: `${particle.x}%`
                                }}
                                initial={{ y: -20, opacity: 1, rotate: 0 }}
                                animate={{ 
                                    y: 400, 
                                    opacity: 0,
                                    rotate: 360
                                }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 2.5,
                                    delay: particle.delay,
                                    ease: 'easeIn'
                                }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Circular Progress */}
            <div className="circular-progress-container">
                <svg className="circular-progress" viewBox="0 0 200 200">
                    <circle
                        className="progress-bg"
                        cx="100"
                        cy="100"
                        r="85"
                    />
                    <motion.circle
                        className="progress-bar"
                        cx="100"
                        cy="100"
                        r="85"
                        initial={{ strokeDashoffset: 534 }}
                        animate={{ 
                            strokeDashoffset: 534 - (534 * progress / 100)
                        }}
                        transition={{ 
                            duration: 1.5, 
                            ease: 'easeOut',
                            delay: 0.3
                        }}
                    />
                </svg>

                <div className="goal-center">
                    <h2>{present}/{goal}</h2>
                    <p>Days Present</p>
                    <motion.span 
                        className="goal-emoji"
                        animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                        }}
                        transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1
                        }}
                    >
                        {message.emoji}
                    </motion.span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="linear-progress-wrapper">
                <div className="linear-progress-bg">
                    <motion.div 
                        className="linear-progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ 
                            duration: 1.5, 
                            ease: 'easeOut',
                            delay: 0.5
                        }}
                    />
                </div>
                <div className="progress-percentage">{progress}%</div>
            </div>

            {/* Message */}
            <motion.div 
                className="goal-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                {message.text}
            </motion.div>

            {/* Stats */}
            <div className="goal-stats">
                <div className="stat-item">
                    <div className="stat-icon">✅</div>
                    <div className="stat-label">Present</div>
                    <div className="stat-value">{present}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon">❌</div>
                    <div className="stat-label">Absent</div>
                    <div className="stat-value">{absent}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-label">Goal</div>
                    <div className="stat-value">{goal}</div>
                </div>
            </div>
        </motion.div>
    );
};

export default WeeklyGoalTracker;
