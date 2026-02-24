import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { clearXPAnimation } from '../store/gamesSlice';
import './XPAnimation.css';

export default function XPAnimation({ amount }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(clearXPAnimation()), 2200);
    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <AnimatePresence>
      {amount > 0 && (
        <motion.div
          className="xp-anim"
          initial={{ opacity: 0, y: 20, scale: 0.7 }}
          animate={{ opacity: 1, y: -40, scale: 1.15 }}
          exit={{ opacity: 0, y: -80, scale: 0.8 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          +{amount} XP 🎉
        </motion.div>
      )}
    </AnimatePresence>
  );
}
