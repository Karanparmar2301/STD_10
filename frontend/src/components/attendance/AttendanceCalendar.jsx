import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { selectCalendarData } from '../../store/attendanceSlice';
import './AttendanceCalendar.css';

/**
 * AttendanceCalendar - Beautiful Interactive Monthly Calendar
 * Shows present/absent days with animations
 */
function AttendanceCalendar() {
    const calendarData = useSelector(selectCalendarData);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Calendar helpers
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatDate = (year, month, day) => {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    };

    const isToday = (year, month, day) => {
        const today = new Date();
        return (
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day
        );
    };

    const isFutureDate = (year, month, day) => {
        const date = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date > today;
    };

    // Month navigation
    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    // Generate calendar days
    const calendarDays = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = formatDate(currentYear, currentMonth, day);
        const status = calendarData[dateKey];
        const today = isToday(currentYear, currentMonth, day);
        const future = isFutureDate(currentYear, currentMonth, day);

        let dayClass = 'calendar-day';
        let emoji = '';

        if (future) {
            dayClass += ' future';
        } else if (status === 'present') {
            dayClass += ' present';
            emoji = '🟢';
        } else if (status === 'absent') {
            dayClass += ' absent';
            emoji = '🔴';
        }

        if (today) {
            dayClass += ' today';
        }

        calendarDays.push(
            <motion.div
                key={day}
                className={dayClass}
                whileHover={!future ? { scale: 1.1, y: -2 } : {}}
                whileTap={!future ? { scale: 0.95 } : {}}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: day * 0.01, duration: 0.2 }}
            >
                <span className="day-number">{day}</span>
                {emoji && <span className="day-status">{emoji}</span>}
            </motion.div>
        );
    }

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="attendance-calendar">
            {/* Calendar Header */}
            <div className="calendar-header">
                <motion.button
                    className="month-nav"
                    onClick={previousMonth}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    ←
                </motion.button>
                
                <AnimatePresence mode="wait">
                    <motion.h3
                        key={`${currentMonth}-${currentYear}`}
                        className="calendar-title"
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        transition={{ duration: 0.3 }}
                    >
                        {monthNames[currentMonth]} {currentYear}
                    </motion.h3>
                </AnimatePresence>

                <motion.button
                    className="month-nav"
                    onClick={nextMonth}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    →
                </motion.button>
            </div>

            {/* Decorative Elements */}
            <motion.div
                className="calendar-decoration"
                animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            >
                ☀️
            </motion.div>

            {/* Week Days */}
            <div className="calendar-weekdays">
                {weekDays.map(day => (
                    <div key={day} className="weekday-label">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${currentMonth}-${currentYear}`}
                    className="calendar-grid"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                >
                    {calendarDays}
                </motion.div>
            </AnimatePresence>

            {/* Legend */}
            <div className="calendar-legend">
                <div className="legend-item">
                    <span className="legend-indicator present">🟢</span>
                    <span className="legend-label">Present</span>
                </div>
                <div className="legend-item">
                    <span className="legend-indicator absent">🔴</span>
                    <span className="legend-label">Absent</span>
                </div>
                <div className="legend-item">
                    <span className="legend-indicator today">📅</span>
                    <span className="legend-label">Today</span>
                </div>
            </div>
        </div>
    );
}

export default AttendanceCalendar;
