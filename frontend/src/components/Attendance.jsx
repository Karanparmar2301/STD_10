import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import AttendanceCalendar from './attendance/AttendanceCalendar';
import AttendanceProgress from './attendance/AttendanceProgress';
import AttendanceStatsCard from './attendance/AttendanceStatsCard';
import AttendanceHeatmap from './attendance/AttendanceHeatmap';
import WeeklyGoalTracker from './attendance/WeeklyGoalTracker';
import AttendanceReminder from './notifications/AttendanceReminder';
import {
    fetchAttendance,
    initializeAttendance,
    selectAttendanceLoading,
    selectAttendanceError
} from '../store/attendanceSlice';
import './Attendance.css';

/**
 * Attendance - Advanced Attendance Intelligence System
 * Features: Heatmap, Calendar, Progress, Weekly Goals, Smart Reminders
 */
function Attendance({ profile }) {
    const dispatch = useDispatch();
    const loading = useSelector(selectAttendanceLoading);
    const error = useSelector(selectAttendanceError);

    useEffect(() => {
        if (profile) {
            // Initialize attendance from profile data
            dispatch(initializeAttendance({
                percentage: profile.attendance_percentage || 0,
                presentDays: profile.present_days || 0,
                absentDays: profile.absent_days || 0,
                totalDays: profile.total_days || 0,
                streak: profile.attendance_streak || 0
            }));

            // Fetch detailed attendance records
            if (profile.uid) {
                dispatch(fetchAttendance(profile.uid));
            }
        }
    }, [profile, dispatch]);

    if (!profile) {
        return (
            <div className="attendance-loading">
                <div className="spinner"></div>
                <p>Loading attendance...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="attendance-error">
                <h3>⚠️ Unable to load attendance</h3>
                <p>{error}</p>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="attendance-section"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header with Decorative Elements */}
            <motion.div
                className="attendance-header"
                variants={itemVariants}
            >
                <motion.h1
                    className="section-title"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="title-icon">📊</span>
                    Attendance Tracker
                </motion.h1>
                
                <motion.div
                    className="header-decoration"
                    animate={{
                        y: [0, -10, 0],
                        rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                >
                    📚
                </motion.div>
            </motion.div>

            {/* Smart Reminder */}
            <AttendanceReminder />

            {/* Main Content Grid */}
            <div className="attendance-grid">
                {/* Top Row - Progress & Weekly Goal */}
                <div className="attendance-top-row">
                    <motion.div
                        className="progress-card"
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <AttendanceProgress />
                    </motion.div>

                    <motion.div
                        className="weekly-goal-card-wrapper"
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <WeeklyGoalTracker />
                    </motion.div>
                </div>

                {/* Heatmap - Full Width */}
                <motion.div
                    className="heatmap-wrapper"
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <AttendanceHeatmap />
                </motion.div>

                {/* Bottom Row - Calendar & Stats */}
                <div className="attendance-bottom-row">
                    <motion.div
                        className="calendar-card"
                        variants={itemVariants}
                    >
                        <h2 className="card-title">
                            <span className="title-icon">📅</span>
                            Monthly Calendar
                        </h2>
                        <AttendanceCalendar />
                    </motion.div>

                    <motion.div
                        className="stats-card"
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <AttendanceStatsCard />
                    </motion.div>
                </div>
            </div>

            {/* Floating Cloud Decoration */}
            <motion.div
                className="floating-cloud"
                animate={{
                    x: [0, 20, 0],
                    y: [0, -15, 0]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            >
                ☁️
            </motion.div>
        </motion.div>
    );
}

export default Attendance;
