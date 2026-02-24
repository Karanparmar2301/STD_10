import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { selectGamificationProgress, selectStreak } from '../../store/gamificationSlice';
import './GameResultModal.css';

/**
 * GameResultModal — shown after every game via Games.jsx.
 *
 * Props:
 *   result    — local result from game component: { gameName, score, total, xpEarned }
 *   onBack    — navigate back to games grid
 *   onPlayAgain — restart the same game
 */
export default function GameResultModal({ result, onBack, onPlayAgain }) {
    // Server-authoritative data from Redux (updated by completeGame.fulfilled)
    const lastGame  = useSelector(state => state.games.lastCompletedGame);
    const { level, currentLevelXP, xpToNextLevel } = useSelector(selectGamificationProgress);
    const streak    = useSelector(selectStreak);
    const leveled_up = useSelector(state => state.gamification.showLevelUpModal);
    const newBadge   = useSelector(state => state.gamification.newBadge);

    // Use server XP if available, fallback to local calc
    const xpEarned  = lastGame?.xp_earned ?? result.xpEarned ?? 0;
    const score     = result.score;
    const total     = result.total;
    const pct       = total > 0 ? Math.round((score / total) * 100) : 100;
    const isWin     = pct >= 80;
    const emoji     = pct === 100 ? '🌟' : pct >= 80 ? '😄' : pct >= 60 ? '😊' : '💪';

    // XP counter animation
    const xpRef = useRef(null);
    useEffect(() => {
        if (!xpRef.current || !xpEarned) return;
        let start = 0;
        const step = Math.ceil(xpEarned / 20);
        const timer = setInterval(() => {
            start = Math.min(start + step, xpEarned);
            if (xpRef.current) xpRef.current.textContent = `+${start} XP`;
            if (start >= xpEarned) clearInterval(timer);
        }, 40);
        return () => clearInterval(timer);
    }, [xpEarned]);

    return (
        <div className="grm-backdrop" onClick={onBack}>
            <motion.div
                className={`grm-card ${isWin ? 'win' : 'try-again'}`}
                initial={{ scale: 0.4, opacity: 0, y: 60 }}
                animate={{ scale: 1,   opacity: 1, y: 0  }}
                exit={{   scale: 0.4, opacity: 0, y: 60  }}
                transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Confetti dots for wins */}
                {isWin && (
                    <div className="grm-confetti" aria-hidden>
                        {[...Array(18)].map((_, i) => (
                            <motion.span
                                key={i}
                                className="grm-dot"
                                initial={{ x: 0, y: 0, opacity: 1 }}
                                animate={{
                                    x: (Math.random() - 0.5) * 260,
                                    y: (Math.random() - 0.5) * 260,
                                    opacity: 0,
                                }}
                                transition={{ duration: 0.9, delay: i * 0.04 }}
                                style={{
                                    background: ['#f59e0b','#10b981','#6366f1','#ec4899','#3b82f6'][i % 5]
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Emoji & Title */}
                <motion.div
                    className="grm-emoji"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                >
                    {emoji}
                </motion.div>

                <motion.h2
                    className="grm-title"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {isWin ? 'Amazing! 🎉' : 'Nice Try! Keep Going!'}
                </motion.h2>

                <p className="grm-game-name">{result.gameName}</p>

                {/* Score */}
                <motion.div
                    className="grm-score-row"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                >
                    <span className="grm-score-label">Score</span>
                    <span className="grm-score-value">{score} / {total}</span>
                    <span className={`grm-pct-badge ${pct >= 80 ? 'good' : 'meh'}`}>{pct}%</span>
                </motion.div>

                {/* XP earned counter */}
                <motion.div
                    className="grm-xp-block"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <span className="grm-xp-label">XP Earned</span>
                    <span className="grm-xp-value" ref={xpRef}>+{xpEarned} XP</span>
                </motion.div>

                {/* Level-up banner */}
                <AnimatePresence>
                    {leveled_up && (
                        <motion.div
                            className="grm-levelup"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            ⭐ Level Up! Now Level {level}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* New badge banner */}
                <AnimatePresence>
                    {newBadge && (
                        <motion.div
                            className="grm-badge"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.55 }}
                        >
                            🏆 New Badge: <strong>{newBadge.name || newBadge}</strong>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* XP progress bar */}
                <motion.div
                    className="grm-progress-wrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="grm-progress-row">
                        <span>Level {level}</span>
                        <span>{currentLevelXP} / {currentLevelXP + xpToNextLevel} XP</span>
                    </div>
                    <div className="grm-progress-bar">
                        <motion.div
                            className="grm-progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round((currentLevelXP / (currentLevelXP + xpToNextLevel)) * 100)}%` }}
                            transition={{ duration: 0.9, delay: 0.45 }}
                        />
                    </div>
                </motion.div>

                {/* Streak */}
                <motion.p
                    className="grm-streak"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    🔥 {streak}-day streak{streak >= 7 ? ' — On Fire!' : ''}
                </motion.p>

                {/* Buttons */}
                <motion.div
                    className="grm-buttons"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                >
                    <button className="grm-btn-secondary" onClick={onPlayAgain}>
                        Play Again
                    </button>
                    <button className="grm-btn-primary" onClick={onBack}>
                        Back to Games →
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
