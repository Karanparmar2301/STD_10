import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectGamificationProgress } from '../store/gamificationSlice';
import { selectAttendanceStats } from '../store/attendanceSlice';
import { selectHomeworkStats } from '../store/homeworkSlice';
import StatCard from './StatCard';
import './DashboardHeader.css';

const DashboardHeader = () => {
    const user = useSelector((state) => state.auth.user);
    const studentData = useSelector((state) => state.student.profile);
    const gamification = useSelector(selectGamificationProgress);
    const attendanceStats = useSelector(selectAttendanceStats);
    const homeworkStats = useSelector(selectHomeworkStats);
    const unreadCount = useSelector((state) => state.announcements.unreadCount);

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = () => {
        return currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = () => {
        return currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Calculate engagement score (weighted average)
    const calculateEngagementScore = () => {
        const attendance = attendanceStats.percentage || 0;
        const homework = homeworkStats.completionRate || 0;
        const xpProgress = gamification.progressPercentage || 0;

        return Math.round((attendance * 0.4) + (homework * 0.4) + (xpProgress * 0.2));
    };

    return (
        <div className="dashboard-header-container">
            {/* Top Section: Greeting & User Info */}
            <div className="header-top">
                <div className="header-left">
                    <div className="user-avatar-large">
                        {getInitials(studentData?.student_name || user?.email || 'Student')}
                    </div>
                    <div className="greeting-section">
                        <h1 className="greeting-text">
                            {getGreeting()}, {studentData?.student_name || user?.email?.split('@')[0] || 'Student'}! 👋
                        </h1>
                        <p className="greeting-subtitle">Ready to learn and grow today?</p>
                    </div>
                </div>

                <div className="header-right">
                    <div className="datetime-display">
                        <div className="date-text">{formatDate()}</div>
                        <div className="time-text">{formatTime()}</div>
                    </div>

                    <div className="level-badge-large">
                        <span className="level-icon">⭐</span>
                        <div className="level-info">
                            <span className="level-label">Level</span>
                            <span className="level-number">{gamification.level}</span>
                        </div>
                    </div>

                    {attendanceStats.streak > 0 && (
                        <div className="streak-badge">
                            <span className="streak-icon">🔥</span>
                            <div className="streak-info">
                                <span className="streak-number">{attendanceStats.streak}</span>
                                <span className="streak-label">Day Streak</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Stats Grid */}
            <div className="kpi-stats-grid">
                <StatCard
                    title="Attendance"
                    value={Math.round(attendanceStats.percentage)}
                    unit="%"
                    icon="📊"
                    gradient="attendance"
                    trend={attendanceStats.monthlyTrend}
                    riskLevel={attendanceStats.riskLevel}
                />

                <StatCard
                    title="Homework Completion"
                    value={Math.round(homeworkStats.completionRate)}
                    unit="%"
                    icon="📚"
                    gradient="homework"
                    trend={null}
                    riskLevel={homeworkStats.completionRate < 70 ? 'high' : 'low'}
                />

                <StatCard
                    title="XP Points"
                    value={gamification.currentLevelXP}
                    unit={`/ ${100}`}
                    icon="⭐"
                    gradient="points"
                    trend={null}
                />

                <StatCard
                    title="Current Streak"
                    value={attendanceStats.streak}
                    unit="days"
                    icon="🔥"
                    gradient="streak"
                    trend={null}
                />

                <StatCard
                    title="Pending Tasks"
                    value={homeworkStats.pending + homeworkStats.overdue}
                    unit=""
                    icon="📝"
                    gradient="tasks"
                    riskLevel={homeworkStats.overdue > 0 ? 'high' : 'low'}
                />

                <StatCard
                    title="Engagement Score"
                    value={calculateEngagementScore()}
                    unit="%"
                    icon="🎯"
                    gradient="engagement"
                    trend={null}
                />
            </div>

            {/* Quick Alerts */}
            {(attendanceStats.riskLevel === 'high' || homeworkStats.overdue > 0) && (
                <div className="quick-alerts">
                    {attendanceStats.riskLevel === 'high' && (
                        <div className="alert alert-warning">
                            ⚠️ <strong>Attendance Alert:</strong> Your attendance is below 75%. Please improve to avoid academic issues.
                        </div>
                    )}
                    {homeworkStats.overdue > 0 && (
                        <div className="alert alert-danger">
                            🚨 <strong>Overdue Homework:</strong> You have {homeworkStats.overdue} overdue assignment{homeworkStats.overdue > 1 ? 's' : ''}. Complete them soon!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardHeader;
