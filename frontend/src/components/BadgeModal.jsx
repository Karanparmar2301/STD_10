import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { closeBadgeModal, selectNewBadges, selectShowBadgeModal } from '../store/gamesSlice';
import './BadgeModal.css';

export default function BadgeModal() {
  const dispatch = useDispatch();
  const show = useSelector(selectShowBadgeModal);
  const badges = useSelector(selectNewBadges);

  const badge = badges?.[0];

  return (
    <AnimatePresence>
      {show && badge && (
        <motion.div
          className="badge-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dispatch(closeBadgeModal())}
        >
          <motion.div
            className="badge-modal"
            initial={{ scale: 0.4, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.4, opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 14, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Confetti dots */}
            <div className="confetti-wrap" aria-hidden="true">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="confetti-dot"
                  style={{
                    left: `${Math.random() * 100}%`,
                    background: ['#fbbf24','#6366f1','#10b981','#ef4444','#8b5cf6'][i % 5],
                  }}
                  initial={{ y: -10, opacity: 1 }}
                  animate={{ y: 80 + Math.random() * 60, opacity: 0 }}
                  transition={{ duration: 1 + Math.random(), delay: Math.random() * 0.5 }}
                />
              ))}
            </div>

            <div className="badge-icon-wrap">
              <span className="badge-icon">{badge.icon || '🏅'}</span>
            </div>
            <p className="badge-new-text">NEW BADGE UNLOCKED!</p>
            <h2 className="badge-name">{badge.name}</h2>
            <p className="badge-desc">{badge.description || 'Keep playing to earn more!'}</p>
            <motion.button
              className="badge-close-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(closeBadgeModal())}
            >
              Awesome! 🎉
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
