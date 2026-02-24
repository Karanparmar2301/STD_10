import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { selectGamificationProgress, selectStreak } from '../store/gamificationSlice';
import { triggerGamificationEvent } from '../store/insightsSlice';
import AIInsightCard from './AIInsightCard';
import AnalyticsDashboard from './AnalyticsDashboard';
import './Rewards.css';

/* ─── Milestone definitions ─────────────────────────────────────── */
const MILESTONES = [
    { points: 100,  label: 'Bronze',   icon: '🥉', color: '#cd7f32', glow: '#cd7f3260' },
    { points: 300,  label: 'Silver',   icon: '🥈', color: '#a8a9ad', glow: '#a8a9ad60' },
    { points: 500,  label: 'Gold',     icon: '🥇', color: '#ffd700', glow: '#ffd70060' },
    { points: 1000, label: 'Diamond',  icon: '💎', color: '#a855f7', glow: '#a855f760' },
];

const EARN_METHODS = [
    {
        icon: '🎮',
        title: 'Play Games',
        desc: 'Complete learning games to earn XP',
        xp: '+20 XP',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        bg: '#eef2ff',
    },
    {
        icon: '📚',
        title: 'Complete Homework',
        desc: 'Submit answers on time for bonus XP',
        xp: '+15 XP',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
        bg: '#fdf2f8',
    },
    {
        icon: '📅',
        title: 'Perfect Attendance',
        desc: 'Attend every class to earn daily XP',
        xp: '+10 XP',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        bg: '#ecfdf5',
    },
];

/* ─── Animated count-up hook ────────────────────────────────────── */
function useCountUp(target, duration = 1.4) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = null;
        const from = 0;
        const step = (ts) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / (duration * 1000), 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(from + (target - from) * ease));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration]);
    return display;
}

/* ─── Sparkle component ─────────────────────────────────────────── */
const Sparkle = ({ style }) => (
    <motion.div
        className="rw-sparkle"
        style={style}
        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 180, 360] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: style.animationDelay || 0, ease: 'easeInOut' }}
    >✦</motion.div>
);

const SPARKLE_POSITIONS = [
    { top: '15%', left: '8%',  fontSize: 14, animationDelay: 0 },
    { top: '70%', left: '5%',  fontSize: 10, animationDelay: 0.6 },
    { top: '25%', right: '6%', fontSize: 16, animationDelay: 1.1 },
    { top: '65%', right: '8%', fontSize: 12, animationDelay: 0.3 },
    { top: '45%', left: '12%', fontSize: 8,  animationDelay: 1.7 },
    { top: '50%', right: '12%',fontSize: 10, animationDelay: 0.9 },
];

/* ─── Main Component ────────────────────────────────────────────── */
function Rewards() {
    const dispatch = useDispatch();
    const { rewardPoints, achievementStars, currentLevel } = useSelector((s) => s.student);
    const uid = useSelector((s) => s.auth.user?.uid);
    const { totalXP, level, currentLevelXP, xpToNextLevel } = useSelector(selectGamificationProgress);
    const streak = useSelector(selectStreak);

    // Use rewardPoints if available, fallback to totalXP
    const points = rewardPoints || totalXP || 0;
    const lvl    = currentLevel || level || 1;
    const lvlXP  = currentLevelXP || 0;
    const toNext = xpToNextLevel || 100;
    const progressPct = Math.round((lvlXP / (lvlXP + toNext)) * 100);

    const animatedPoints = useCountUp(points);
    const [unlockedBadge, setUnlockedBadge] = useState(null);

    // Detect newly unlocked badge
    const prevPoints = useRef(0);
    useEffect(() => {
        MILESTONES.forEach((m) => {
            if (prevPoints.current < m.points && points >= m.points) {
                setUnlockedBadge(m);
                setTimeout(() => setUnlockedBadge(null), 3500);
            }
        });
        prevPoints.current = points;
    }, [points]);

    const earnedMilestones = useMemo(() => MILESTONES.filter((m) => points >= m.points), [points]);

    const cardVariants = {
        hidden: { opacity: 0, y: 28 },
        show:   { opacity: 1, y: 0 },
    };

    return (
        <div className="rw-root">

            {/* ── Badge Unlock Toast ── */}
            <AnimatePresence>
                {unlockedBadge && (
                    <motion.div
                        className="rw-toast"
                        initial={{ opacity: 0, y: -60, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0,   scale: 1   }}
                        exit={{   opacity: 0, y: -60, scale: 0.8  }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        <span className="rw-toast-icon">{unlockedBadge.icon}</span>
                        <div>
                            <p className="rw-toast-title">New Badge Unlocked!</p>
                            <p className="rw-toast-sub">{unlockedBadge.label} Badge achieved 🎉</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <h1 className="rw-page-title">Rewards & Achievements</h1>

            {/* ── AI Performance Coach card ── */}
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                style={{ marginBottom: '1.5rem' }}
            >
                <AIInsightCard uid={uid} />
            </motion.div>

            <motion.div
                className="rw-content"
                variants={{ show: { transition: { staggerChildren: 0.1 } } }}
                initial="hidden"
                animate="show"
            >

                {/* ══════════════ SECTION 1 — HERO CARD ══════════════ */}
                <motion.div className="rw-hero" variants={cardVariants} transition={{ duration: 0.5 }}>
                    {SPARKLE_POSITIONS.map((s, i) => <Sparkle key={i} style={s} />)}

                    {/* Left */}
                    <div className="rw-hero-left">
                        <motion.div
                            className="rw-trophy"
                            animate={{ rotate: [-4, 4, -4], y: [0, -6, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >🏆</motion.div>
                        <div>
                            <p className="rw-hero-label">Total Points</p>
                            <motion.p
                                className="rw-hero-points"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1,   opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                            >
                                {animatedPoints.toLocaleString()}
                            </motion.p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="rw-hero-divider" />

                    {/* Right */}
                    <div className="rw-hero-right">
                        <div className="rw-hero-stat">
                            <span className="rw-hero-stat-icon">⭐</span>
                            <div>
                                <p className="rw-hero-stat-val">{Math.min(achievementStars || earnedMilestones.length * 3, 23)}</p>
                                <p className="rw-hero-stat-lbl">Achievement Stars</p>
                            </div>
                        </div>
                        <div className="rw-hero-stat">
                            <span className="rw-hero-stat-icon">🎯</span>
                            <div>
                                <p className="rw-hero-stat-val">Level {lvl}</p>
                                <p className="rw-hero-stat-lbl">Current Level</p>
                            </div>
                        </div>
                        <div className="rw-hero-stat">
                            <span className="rw-hero-stat-icon">🔥</span>
                            <div>
                                <p className="rw-hero-stat-val">{streak} Days</p>
                                <p className="rw-hero-stat-lbl">Active Streak</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ══════════════ SECTION 2 — LEVEL PROGRESS ══════════════ */}
                <motion.div className="rw-card" variants={cardVariants} transition={{ duration: 0.5 }}>
                    <div className="rw-card-header">
                        <span className="rw-card-icon-bg">📊</span>
                        <div>
                            <h2 className="rw-card-title">Level Progress</h2>
                            <p className="rw-card-sub">Keep earning XP to reach Level {lvl + 1}</p>
                        </div>
                        <div className="rw-level-pill">Lvl {lvl}</div>
                    </div>

                    <div className="rw-progress-wrap">
                        <div className="rw-progress-track">
                            <motion.div
                                className="rw-progress-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPct}%` }}
                                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                            >
                                <div className="rw-progress-glow" />
                            </motion.div>
                        </div>
                        <motion.span
                            className="rw-progress-rocket"
                            style={{ left: `${progressPct}%` }}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >🚀</motion.span>
                    </div>

                    <div className="rw-progress-labels">
                        <span>{lvlXP} XP</span>
                        <span className="rw-progress-hint">🎯 {toNext} XP to next level</span>
                        <span>{lvlXP + toNext} XP</span>
                    </div>
                </motion.div>

                {/* ══════════════ SECTION 3 — HOW TO EARN ══════════════ */}
                <motion.div variants={cardVariants} transition={{ duration: 0.5 }}>
                    <h2 className="rw-section-title">How to Earn Points</h2>
                    <div className="rw-earn-grid">
                        {EARN_METHODS.map((m, i) => (
                            <motion.div
                                key={m.title}
                                className="rw-earn-card"
                                style={{ background: m.bg }}
                                whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
                                whileTap={{ scale: 0.97 }}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                            >
                                <div className="rw-earn-icon-wrap" style={{ background: m.gradient }}>
                                    <span className="rw-earn-icon">{m.icon}</span>
                                </div>
                                <h3 className="rw-earn-title">{m.title}</h3>
                                <p className="rw-earn-desc">{m.desc}</p>
                                <div className="rw-earn-xp" style={{ background: m.gradient }}>
                                    {m.xp} per day
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ══════════════ SECTION 4 — MILESTONES TIMELINE ══════════════ */}
                <motion.div variants={cardVariants} transition={{ duration: 0.5 }}>
                    <h2 className="rw-section-title">Achievement Milestones</h2>
                    <div className="rw-timeline">
                        <div className="rw-timeline-line" />
                        {MILESTONES.map((m, i) => {
                            const achieved = points >= m.points;
                            return (
                                <motion.div
                                    key={m.label}
                                    className={`rw-milestone ${achieved ? 'rw-milestone--achieved' : 'rw-milestone--locked'}`}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 * i, duration: 0.45 }}
                                >
                                    {/* Dot */}
                                    <motion.div
                                        className="rw-milestone-dot"
                                        style={achieved ? { background: m.color, boxShadow: `0 0 14px ${m.glow}` } : {}}
                                        animate={achieved ? { scale: [1, 1.15, 1] } : {}}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        {achieved ? m.icon : '🔒'}
                                    </motion.div>

                                    {/* Card */}
                                    <div
                                        className="rw-milestone-card"
                                        style={achieved ? { borderColor: m.color, boxShadow: `0 4px 18px ${m.glow}` } : {}}
                                    >
                                        <div className="rw-milestone-left">
                                            <p className="rw-milestone-name" style={achieved ? { color: m.color, WebkitTextFillColor: m.color } : {}}>
                                                {m.label} Badge
                                            </p>
                                            <p className="rw-milestone-req">{m.points.toLocaleString()} points required</p>
                                        </div>
                                        <div className="rw-milestone-right">
                                            {achieved ? (
                                                <motion.span
                                                    className="rw-milestone-status rw-milestone-status--done"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                                                >✓ Unlocked</motion.span>
                                            ) : (
                                                <span className="rw-milestone-status rw-milestone-status--locked">
                                                    {m.points - points} pts away
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Empty state */}
                {points === 0 && (
                    <motion.div
                        className="rw-empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <span className="rw-empty-icon">🎮</span>
                        <h3>Start earning points!</h3>
                        <p>Play games, complete homework, or attend classes to get your first XP.</p>
                    </motion.div>
                )}

                {/* ── Performance Analytics section ── */}
                <motion.div
                    variants={cardVariants}
                    transition={{ duration: 0.5 }}
                    style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', marginTop: '0.5rem' }}
                >
                    <AnalyticsDashboard uid={uid} />
                </motion.div>

            </motion.div>
        </div>
    );
}

export default Rewards;

