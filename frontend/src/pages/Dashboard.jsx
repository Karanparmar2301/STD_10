import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logoutUser } from '../store/authSlice';
import { fetchStudentData, checkProfile } from '../store/studentSlice';
import { setActiveSection } from '../store/uiSlice';
import { initializeGamification } from '../store/gamificationSlice';
import { initializeAttendance } from '../store/attendanceSlice';
import { fetchInsights, fetchAnalytics } from '../store/insightsSlice';

// Components
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SkeletonLoader from '../components/SkeletonLoader';
import ProfileCompletionModal from '../components/ProfileCompletionModal';
import ProfileEditDrawer from '../components/ProfileEditDrawer';

// Eager-loaded sections
import DashboardOverview from '../components/DashboardOverview';
import Attendance from '../components/Attendance';
import Homework from '../components/Homework';
import Announcements from '../components/Announcements';
import Rewards from '../components/Rewards';
import CelebrationScreen from '../components/CelebrationScreen';

// Lazy-loaded sections
const Games = lazy(() => import('../components/Games'));
const AIAssistant = lazy(() => import('../components/AIAssistant'));

import './Dashboard.css';

function Dashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const user = useSelector((state) => state.auth.user);
    const studentData = useSelector((state) => state.student.profile);
    const { loading, error, profileExists } = useSelector((state) => state.student);
    const activeSection = useSelector((state) => state.ui.activeSection);

    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [showEditDrawer, setShowEditDrawer] = useState(false);

    useEffect(() => {
        // Check profile existence on mount (database-driven)
        if (user?.uid && typeof user.uid === 'string' && user.uid.length > 0) {
            if (profileExists === null && !loading) {
                dispatch(checkProfile(user.uid));
            }
        }
    }, [user, dispatch, profileExists, loading]);

    useEffect(() => {
        // Show completion modal if database confirms profile doesn't exist
        if (profileExists === false) {
            setShowCompletionModal(true);
        }
    }, [profileExists]);

    useEffect(() => {
        // Initialize all KPIs when student data loads
        if (studentData) {
            // Calculate streak from attendance data (default to 5 if not present)
            const calculatedStreak = studentData.attendance_streak || studentData.streak || 5;
            
            // Initialize gamification
            dispatch(initializeGamification({
                totalXP: studentData.reward_points || 0,
                streak: calculatedStreak,
                badges: studentData.badges || [],
                achievements: studentData.achievements || []
            }));

            // Initialize attendance stats
            dispatch(initializeAttendance({
                percentage: studentData.attendance_percentage || 95,
                presentDays: studentData.present_days || 0,
                absentDays: studentData.absent_days || 0,
                totalDays: studentData.total_days || 0,
                streak: calculatedStreak
            }));

            // Homework is now database-driven and fetched in Homework component
        }
    }, [studentData, dispatch]);

    useEffect(() => {
        // Listen for custom event to open edit profile drawer
        const handleOpenEditProfile = () => {
            setShowEditDrawer(true);
        };

        window.addEventListener('openEditProfile', handleOpenEditProfile);

        return () => {
            window.removeEventListener('openEditProfile', handleOpenEditProfile);
        };
    }, []);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/');
    };

    const handleSectionChange = (section) => {
        dispatch(setActiveSection(section));
    };

    const handleProfileComplete = () => {
        setShowCompletionModal(false);
        // Refresh student data after profile completion
        if (user?.uid) {
            dispatch(fetchStudentData(user.uid));
        }
    };

    const handleEditProfile = () => {
        setShowEditDrawer(true);
    };

    const handleEditDrawerClose = () => {
        setShowEditDrawer(false);
        // Refresh student data after edit
        if (user?.uid) {
            dispatch(fetchStudentData(user.uid));
        }
    };

    const renderSection = () => {
        if (loading && !studentData) {
            return <SkeletonLoader type="profile" count={1} />;
        }

        if (error) {
            return (
                <div className="error-container">
                    <h3>Unable to load dashboard</h3>
                    <p>{typeof error === 'string' ? error : 'Server connection failed'}</p>
                    <button
                        className="retry-btn"
                        onClick={() => user?.uid && dispatch(fetchStudentData(user.uid))}
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (!studentData) return null;

        // Animation variants for section transitions
        const pageVariants = {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -20 }
        };

        const pageTransition = {
            duration: 0.3,
            ease: 'easeInOut'
        };

        switch (activeSection) {
            case 'dashboard':
                return (
                    <motion.div
                        key="dashboard"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <DashboardOverview />
                    </motion.div>
                );
            case 'attendance':
                return (
                    <motion.div
                        key="attendance"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <Attendance profile={studentData} />
                    </motion.div>
                );
            case 'homework':
                return (
                    <motion.div
                        key="homework"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <Homework data={studentData} />
                    </motion.div>
                );
            case 'announcements':
                return (
                    <motion.div
                        key="announcements"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <Announcements data={studentData} />
                    </motion.div>
                );
            case 'rewards':
                return (
                    <motion.div
                        key="rewards"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <Rewards data={studentData} />
                    </motion.div>
                );
            case 'games':
                return (
                    <motion.div
                        key="games"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <Suspense fallback={<SkeletonLoader type="card" count={3} />}>
                            <Games data={studentData} />
                        </Suspense>
                    </motion.div>
                );
            case 'ai-assistant':
                return (
                    <motion.div
                        key="ai-assistant"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <Suspense fallback={<SkeletonLoader type="card" count={1} />}>
                            <AIAssistant data={studentData} />
                        </Suspense>
                    </motion.div>
                );
            default:
                return (
                    <motion.div
                        key="default"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                    >
                        <DashboardOverview />
                    </motion.div>
                );
        }
    };

    if (loading && !studentData) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    if (error && !studentData) {
        return (
            <div className="dashboard-layout error-layout">
                <div className="error-container full-page">
                    <h2>Oops! Something went wrong</h2>
                    <p>{typeof error === 'string' ? error : 'Could not connect to server'}</p>
                    <button
                        className="retry-btn"
                        onClick={() => user?.uid && dispatch(fetchStudentData(user.uid))}
                    >
                        Try Again
                    </button>
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        Log Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar onLogout={handleLogout} />

            <div className="main-content">
                <Topbar onEditProfile={handleEditProfile} />

                <div className={`content${activeSection === 'ai-assistant' ? ' content--ai' : ''}`}>
                    <AnimatePresence mode="wait">
                        {renderSection()}
                    </AnimatePresence>
                </div>
            </div>

            {/* Level-up Celebration Screen (global overlay) */}
            <CelebrationScreen />

            {/* Profile Completion Modal (First Login) */}
            <ProfileCompletionModal
                isOpen={showCompletionModal}
                onComplete={handleProfileComplete}
            />

            {/* Profile Edit Drawer */}
            <ProfileEditDrawer
                isOpen={showEditDrawer}
                onClose={handleEditDrawerClose}
            />
        </div>
    );
}

export default Dashboard;
