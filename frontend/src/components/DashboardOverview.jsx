import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { selectGamificationProgress, selectStreak, selectRecentActivity } from '../store/gamificationSlice';
import { setActiveSection } from '../store/uiSlice';
import './DashboardOverview.css';

// ── Activity icon/label helpers ───────────────────────────────────────────────
const ACTION_META = {
    HOMEWORK_COMPLETE: { icon: '✔', iconClass: 'homework-icon', label: 'Homework Completed' },
    GAME_COMPLETE:     { icon: '🎮', iconClass: 'game-icon',     label: 'Game Completed'    },
    ATTENDANCE_MARK:   { icon: '📊', iconClass: 'attendance-icon', label: 'Attendance Marked' },
    BADGE_UNLOCK:      { icon: '🏆', iconClass: 'badge-icon',    label: 'Badge Unlocked'    },
    LEVEL_UP:          { icon: '⭐', iconClass: 'levelup-icon',  label: 'Level Up!'         },
};

function relativeTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function ActivityItem({ entry, delay }) {
    const meta = ACTION_META[entry.action_type] || { icon: '⚡', iconClass: 'default-icon', label: entry.action_type };
    return (
        <motion.div
            className="timeline-item live"
            layout
            initial={{ opacity: 0, x: -24, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.9 }}
            transition={{ duration: 0.3, delay }}
        >
            <div className={`timeline-icon ${meta.iconClass}`}>{meta.icon}</div>
            <div className="timeline-content">
                <h4>{entry.description || meta.label}</h4>
                {entry.xp_earned > 0 && (
                    <span className="timeline-xp">+{entry.xp_earned} XP</span>
                )}
                <span className="timeline-time">{relativeTime(entry.timestamp)}</span>
            </div>
        </motion.div>
    );
}

// Placeholder shown before any real activity is recorded this session
const PLACEHOLDER_ACTIVITY = [
    { id: 'p1', icon: '✔', iconClass: 'homework-icon', title: 'Complete homework',    description: 'Earn XP for each correct answer', time: 'Pending' },
    { id: 'p2', icon: '🎮', iconClass: 'game-icon',     title: 'Play a learning game', description: 'Win games to build your streak',    time: 'Pending' },
    { id: 'p3', icon: '📊', iconClass: 'attendance-icon', title: 'Mark attendance',   description: 'Show up every day to earn badges',  time: 'Pending' },
];

/**
 * DashboardOverview - Professional Interactive Dashboard
 * 
 * Features:
 * - Clickable cards with auto-navigation
 * - Real-time status badges
 * - Progress overview bar
 * - Activity timeline (live Redux feed)
 * - Smart motivation messages
 */
function DashboardOverview() {
    const dispatch = useDispatch();
    const studentData = useSelector((state) => state.student.profile);
    const streak = useSelector(selectStreak);
    const { level, totalXP, currentLevelXP, xpToNextLevel } = useSelector(selectGamificationProgress);
    
    const recentActivity = useSelector(selectRecentActivity);

    // Get homework and announcements data
    const homeworkPending = useSelector((state) => state.homework.pending || []);
    const homeworkStats = useSelector((state) => state.homework.stats);
    const unreadAnnouncements = useSelector((state) => state.announcements.unreadCount || 0);

    // Calculate stats
    const attendancePercentage = studentData?.attendance_percentage || 95;
    const homeworkCompleted = homeworkStats?.completed || studentData?.homework_completed || 12;
    const homeworkTotal = homeworkStats?.total || studentData?.homework_total || 15;
    const homeworkPercentage = homeworkTotal > 0 
        ? Math.round((homeworkCompleted / homeworkTotal) * 100) 
        : 0;
    const pendingHomeworkCount = homeworkPending.length || (homeworkTotal - homeworkCompleted);
    
    // Calculate XP progress for the current level (100 XP per level)
    const XP_PER_LEVEL = 100;
    const xpProgress = Math.round((currentLevelXP / XP_PER_LEVEL) * 100);
    
    // Handler for card navigation
    const handleNavigate = (section) => {
        dispatch(setActiveSection(section));
    };

    // Quick stats with navigation - Now clickable!
    const quickStats = [
        {
            icon: '⭐',
            label: 'Current Level',
            value: `Level ${level}`,
            color: '#f59e0b',
            description: `${totalXP} Total XP`,
            section: 'rewards',
            badge: null
        },
        {
            icon: '🔥',
            label: 'Learning Streak',
            value: `${streak} Days`,
            color: '#ef4444',
            description: streak >= 7 ? 'Amazing!' : 'Keep it up!',
            section: 'rewards',
            badge: null
        },
        {
            icon: '📊',
            label: 'Attendance',
            value: `${attendancePercentage}%`,
            color: attendancePercentage >= 80 ? '#10b981' : '#f59e0b',
            description: attendancePercentage >= 80 ? 'On track' : 'Needs attention',
            section: 'attendance',
            badge: attendancePercentage < 80 ? { type: 'warning', text: '!' } : null
        },
        {
            icon: '📝',
            label: 'Homework',
            value: `${homeworkCompleted}/${homeworkTotal}`,
            color: '#6366f1',
            description: `${homeworkPercentage}% complete`,
            section: 'homework',
            badge: pendingHomeworkCount > 0 ? { type: 'pending', text: pendingHomeworkCount } : null
        }
    ];

    // Smart Action Cards - 6 primary actions
    const actionCards = [
        {
            icon: '📊',
            title: 'View Attendance',
            description: 'Track your presence',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            section: 'attendance'
        },
        {
            icon: '📚',
            title: 'Check Homework',
            description: 'Pending assignments',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            section: 'homework',
            badge: pendingHomeworkCount
        },
        {
            icon: '📢',
            title: 'View Announcements',
            description: 'School updates',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            section: 'announcements',
            badge: unreadAnnouncements
        },
        {
            icon: '🏆',
            title: 'View Rewards',
            description: 'Your achievements',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            section: 'rewards'
        },
        {
            icon: '🎮',
            title: 'Play Games',
            description: 'Learning games',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            section: 'games'
        },
        {
            icon: '🤖',
            title: 'Ask AI',
            description: 'Get study help',
            gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            section: 'ai-assistant'
        }
    ];

    // Smart Motivation Message - Dynamic based on performance
    const getMotivation = () => {
        if (attendancePercentage >= 95 && streak >= 7) {
            return {
                icon: '🌟',
                message: "Outstanding! You're crushing it with perfect attendance and an amazing streak!",
                type: 'excellent'
            };
        } else if (pendingHomeworkCount > 3) {
            return {
                icon: '📚',
                message: `You have ${pendingHomeworkCount} pending assignments. Let's tackle them together!`,
                type: 'reminder'
            };
        } else if (attendancePercentage < 80) {
            return {
                icon: '⏰',
                message: "Your attendance needs a boost. Every day counts!",
                type: 'warning'
            };
        } else if (streak < 3) {
            return {
                icon: '🔥',
                message: "Start building your streak! Consistency is the key to success.",
                type: 'encourage'
            };
        } else {
            return {
                icon: '💡',
                message: "Every day is a chance to learn something new. Keep up the great work!",
                type: 'default'
            };
        }
    };

    const motivation = getMotivation();

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const cardHover = {
        scale: 1.03,
        y: -6,
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
        transition: { duration: 0.3 }
    };

    return (
        <div className="dashboard-overview">
            {/* Welcome Section */}
            <motion.div 
                className="welcome-section"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="welcome-title">
                    Welcome Back, {studentData?.student_name || 'Student'}! 🎯
                </h1>
                <p className="welcome-subtitle">
                    Here's your personalized learning dashboard
                </p>
            </motion.div>

            {/* Progress Overview Bar */}
            <motion.div 
                className="progress-overview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <div className="progress-item">
                    <div className="progress-header">
                        <span className="progress-icon">⚡</span>
                        <span className="progress-label">XP Progress</span>
                        <span className="progress-value">{xpProgress}%</span>
                    </div>
                    <div className="progress-bar">
                        <motion.div 
                            className="progress-fill xp"
                            initial={{ width: 0 }}
                            animate={{ width: `${xpProgress}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                        />
                    </div>
                    <span className="progress-subtitle">{currentLevelXP} / {XP_PER_LEVEL} XP to next level</span>
                </div>

                <div className="progress-item">
                    <div className="progress-header">
                        <span className="progress-icon">📚</span>
                        <span className="progress-label">Homework</span>
                        <span className="progress-value">{homeworkPercentage}%</span>
                    </div>
                    <div className="progress-bar">
                        <motion.div 
                            className="progress-fill homework"
                            initial={{ width: 0 }}
                            animate={{ width: `${homeworkPercentage}%` }}
                            transition={{ duration: 1, delay: 0.4 }}
                        />
                    </div>
                    <span className="progress-subtitle">{homeworkCompleted} of {homeworkTotal} completed</span>
                </div>

                <div className="progress-item">
                    <div className="progress-header">
                        <span className="progress-icon">📊</span>
                        <span className="progress-label">Attendance</span>
                        <span className="progress-value">{attendancePercentage}%</span>
                    </div>
                    <div className="progress-bar">
                        <motion.div 
                            className={`progress-fill attendance ${attendancePercentage < 80 ? 'warning' : ''}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${attendancePercentage}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                        />
                    </div>
                    <span className="progress-subtitle">
                        {attendancePercentage >= 80 ? 'Great attendance!' : 'Needs improvement'}
                    </span>
                </div>

                <div className="progress-item">
                    <div className="progress-header">
                        <span className="progress-icon">🔥</span>
                        <span className="progress-label">Streak</span>
                        <span className="progress-value">{streak} Days</span>
                    </div>
                    <div className="streak-flames">
                        {[...Array(Math.min(streak, 7))].map((_, i) => (
                            <motion.span 
                                key={i}
                                className="flame"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
                            >
                                🔥
                            </motion.span>
                        ))}
                    </div>
                    <span className="progress-subtitle">
                        {streak >= 7 ? 'On fire! 🔥' : 'Keep the momentum!'}
                    </span>
                </div>
            </motion.div>

            {/* Quick Stats Grid - Now Clickable! */}
            <motion.div 
                className="stats-grid"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {quickStats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        className="stat-card clickable"
                        variants={item}
                        whileHover={cardHover}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigate(stat.section)}
                        transition={{ duration: 0.3 }}
                    >
                        <div 
                            className="stat-icon"
                            style={{ 
                                background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}40)`,
                                color: stat.color
                            }}
                        >
                            {stat.icon}
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">{stat.label}</span>
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-description">{stat.description}</span>
                        </div>
                        {stat.badge && (
                            <span className={`stat-badge ${stat.badge.type}`}>
                                {stat.badge.text}
                            </span>
                        )}
                        <div className="click-hint">Click to view →</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Quick Actions Grid - Enhanced with 6 cards */}
            <motion.div 
                className="quick-actions-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
            >
                <h2 className="section-title">Quick Actions</h2>
                <div className="action-cards-grid">
                    {actionCards.map((action, index) => (
                        <motion.div
                            key={action.title}
                            className="action-card"
                            style={{ background: action.gradient }}
                            whileHover={{ scale: 1.05, y: -8 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleNavigate(action.section)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                        >
                            <span className="action-icon">{action.icon}</span>
                            <div className="action-content">
                                <h3>{action.title}</h3>
                                <p>{action.description}</p>
                            </div>
                            {action.badge && action.badge > 0 && (
                                <span className="action-badge">{action.badge}</span>
                            )}
                            <div className="action-arrow">→</div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Live Activity Timeline */}
            <motion.div 
                className="activity-timeline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
            >
                <div className="section-title-row">
                    <h2 className="section-title">Recent Activity</h2>
                    {recentActivity.length > 0 && (
                        <span className="live-badge">● LIVE</span>
                    )}
                </div>
                <div className="timeline-container">
                    <AnimatePresence mode="popLayout">
                        {recentActivity.length > 0 ? (
                            // Live entries from Redux (newest first, max 5)
                            [...recentActivity].reverse().slice(0, 5).map((entry, index) => (
                                <ActivityItem key={entry.id || index} entry={entry} delay={index * 0.08} />
                            ))
                        ) : (
                            // Placeholder skeleton while no activity logged yet
                            PLACEHOLDER_ACTIVITY.map((entry, index) => (
                                <motion.div
                                    key={entry.id}
                                    className="timeline-item placeholder"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8 + index * 0.1 }}
                                >
                                    <div className={`timeline-icon ${entry.iconClass}`}>{entry.icon}</div>
                                    <div className="timeline-content">
                                        <h4>{entry.title}</h4>
                                        <p>{entry.description}</p>
                                        <span className="timeline-time">{entry.time}</span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Smart Motivation Message - Dynamic */}
            <motion.div 
                className={`motivation-card ${motivation.type}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.9 }}
                whileHover={{ scale: 1.02 }}
            >
                <span className="motivation-icon">{motivation.icon}</span>
                <p className="motivation-text">{motivation.message}</p>
            </motion.div>
        </div>
    );
}

export default DashboardOverview;
