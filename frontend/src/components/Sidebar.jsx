import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { setActiveSection, setSidebarOpen } from '../store/uiSlice';
import { selectUnreadCount } from '../store/announcementsSlice';
import XPProgressBar from './XPProgressBar';
import './Sidebar.css';

function Sidebar({ onLogout }) {
    const dispatch = useDispatch();
    const activeSection = useSelector((state) => state.ui.activeSection);
    const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
    const unreadCount = useSelector(selectUnreadCount);
    // Live homework pending count — same source as topbar bell
    const homeworkPendingCount = useSelector((state) => state.homework.pending?.length || 0);

    const menuItems = [
        { id: 'dashboard',    icon: '🏠', label: 'Dashboard',      badge: null },
        { id: 'attendance',   icon: '📊', label: 'Attendance',     badge: null },
        { id: 'homework',     icon: '📚', label: 'Homework',       badge: homeworkPendingCount },
        { id: 'announcements',icon: '📢', label: 'Announcements',  badge: unreadCount },
        { id: 'rewards',      icon: '🏆', label: 'Rewards',        badge: null },
        { id: 'games',        icon: '🎮', label: 'Learning Games', badge: null },
        { id: 'ai-assistant', icon: '🤖', label: 'AI Assistant',   badge: null }
    ];

    const handleMenuClick = (sectionId) => {
        dispatch(setActiveSection(sectionId));
        dispatch(setSidebarOpen(false));
    };

    const handleCloseSidebar = () => {
        dispatch(setSidebarOpen(false));
    };

    return (
        <>
            <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-icon">📚</div>
                    <div className="logo-text">
                        <h2>Student ERP</h2>
                        <p>Class 1 Portal</p>
                    </div>
                </div>

                {/* XP Progress in Sidebar */}
                <div className="sidebar-xp">
                    <XPProgressBar compact={true} />
                </div>

                <nav className="menu">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            className={`menu-item ${activeSection === item.id ? 'active' : ''}`}
                            onClick={() => handleMenuClick(item.id)}
                        >
                            <span className="menu-icon">{item.icon}</span>
                            <span className="menu-label">{item.label}</span>
                            <AnimatePresence mode="wait">
                                {item.badge && item.badge > 0 && (
                                    <motion.span
                                        key={item.badge}
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0, rotate: 180 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 500,
                                            damping: 15
                                        }}
                                        className="menu-badge"
                                    >
                                        {item.badge}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={onLogout}>
                        <span>🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {sidebarOpen && (
                <div
                    className="sidebar-overlay active"
                    onClick={handleCloseSidebar}
                />
            )}
        </>
    );
}

export default Sidebar;
