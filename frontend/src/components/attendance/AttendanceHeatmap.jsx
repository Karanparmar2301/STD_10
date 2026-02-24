import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { selectHeatmapData, selectAttendanceStreak } from '../../store/attendanceSlice';
import './AttendanceHeatmap.css';

const AttendanceHeatmap = () => {
    const heatmapData = useSelector(selectHeatmapData);
    const streak = useSelector(selectAttendanceStreak);

    // Generate 365 days of data (52 weeks * 7 days)
    const heatmapGrid = useMemo(() => {
        const grid = [];
        const today = new Date();
        
        // Start from 364 days ago to today
        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            const dateString = date.toISOString().split('T')[0];
            const status = heatmapData[dateString] || 'no-record';
            const isToday = i === 0;
            
            grid.push({
                date: dateString,
                status,
                isToday,
                displayDate: date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                })
            });
        }
        
        return grid;
    }, [heatmapData]);

    // Group by weeks (7 days per week)
    const weeks = useMemo(() => {
        const weekGroups = [];
        for (let i = 0; i < heatmapGrid.length; i += 7) {
            weekGroups.push(heatmapGrid.slice(i, i + 7));
        }
        return weekGroups;
    }, [heatmapGrid]);

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'present':
                return 'heatmap-present';
            case 'absent':
                return 'heatmap-absent';
            default:
                return 'heatmap-no-record';
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.002,
                delayChildren: 0.1
            }
        }
    };

    const cellVariants = {
        hidden: { opacity: 0, scale: 0.5 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 20
            }
        }
    };

    return (
        <motion.div 
            className="attendance-heatmap-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="heatmap-header">
                <div className="header-left">
                    <span className="header-icon">📅</span>
                    <h3>365-Day Attendance History</h3>
                </div>
                <div className="header-badges">
                {streak >= 7 && (
                    <motion.div 
                        className="streak-badge"
                        animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1
                        }}
                    >
                        🔥 {streak} Day Streak!
                    </motion.div>
                )}
                {streak >= 30 && (
                    <motion.div 
                        className="fire-animation"
                        animate={{ 
                            y: [-5, -10, -5],
                            opacity: [0.8, 1, 0.8]
                        }}
                        transition={{ 
                            duration: 1.5,
                            repeat: Infinity
                        }}
                    >
                        🔥
                    </motion.div>
                )}
                </div>
            </div>

            <motion.div 
                className="heatmap-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="heatmap-months">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                        <div key={idx} className="month-label">{month}</div>
                    ))}
                </div>

                <div className="heatmap-days-wrapper">
                    <div className="heatmap-weekdays">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>

                    <div className="heatmap-weeks">
                        {weeks.map((week, weekIdx) => (
                            <div key={weekIdx} className="heatmap-week">
                                {week.map((day, dayIdx) => (
                                    <motion.div
                                        key={`${weekIdx}-${dayIdx}`}
                                        className={`heatmap-day ${getStatusColor(day.status)} ${day.isToday ? 'today' : ''}`}
                                        variants={cellVariants}
                                        whileHover={{ 
                                            scale: 1.3, 
                                            zIndex: 10,
                                            transition: { type: 'spring', stiffness: 300 }
                                        }}
                                        title={`${day.displayDate} – ${day.status === 'no-record' ? 'No Record' : day.status === 'present' || day.status === 'Present' ? 'Present ✅' : 'Absent ❌'}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            <div className="heatmap-legend">
                <span>Less</span>
                <div className="legend-boxes">
                    <div className="legend-box heatmap-no-record" title="No Record"></div>
                    <div className="legend-box heatmap-present" title="Present"></div>
                    <div className="legend-box heatmap-absent" title="Absent"></div>
                </div>
                <span>More</span>
            </div>
        </motion.div>
    );
};

export default AttendanceHeatmap;
