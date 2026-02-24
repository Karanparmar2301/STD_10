import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MiniGame.css';

const PAIRS = [
  { id: 'a1', value: '🐱', pairId: 'a' },
  { id: 'a2', value: '🐱', pairId: 'a' },
  { id: 'b1', value: '🐶', pairId: 'b' },
  { id: 'b2', value: '🐶', pairId: 'b' },
  { id: 'c1', value: '🍎', pairId: 'c' },
  { id: 'c2', value: '🍎', pairId: 'c' },
  { id: 'd1', value: '⭐', pairId: 'd' },
  { id: 'd2', value: '⭐', pairId: 'd' },
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const XP_REWARD = 15;

export default function MemoryFlipGame({ onBack, onComplete }) {
  const [cards] = useState(() => shuffle(PAIRS));
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [finished, setFinished] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleFlip = (id) => {
    if (checking || flipped.includes(id) || matched.includes(id)) return;
    if (flipped.length === 1) {
      const newFlipped = [...flipped, id];
      setFlipped(newFlipped);
      setMoves(m => m + 1);
      setChecking(true);

      const card1 = cards.find(c => c.id === newFlipped[0]);
      const card2 = cards.find(c => c.id === id);

      setTimeout(() => {
        if (card1.pairId === card2.pairId) {
          const newMatched = [...matched, card1.id, card2.id];
          setMatched(newMatched);
          setFlipped([]);
          if (newMatched.length === PAIRS.length) {
            setFinished(true);
            const score = Math.max(1, PAIRS.length / 2 - Math.floor((moves + 1) / 2));
            const xpEarned = Math.round((score / (PAIRS.length / 2)) * XP_REWARD);
            onComplete({ gameName: 'Memory Flip', score: Math.floor(score), total: PAIRS.length / 2, xpEarned });
          }
        } else {
          setFlipped([]);
        }
        setChecking(false);
      }, 900);
    } else {
      setFlipped([id]);
    }
  };

  const isFlipped = (id) => flipped.includes(id) || matched.includes(id);
  const isMatched = (id) => matched.includes(id);

  if (finished) return null;

  return (
    <div className="mini-game">
      <div className="game-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="game-progress">
          <span>{matched.length / 2} / {PAIRS.length / 2} pairs</span>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${(matched.length / PAIRS.length) * 100}%` }} /></div>
        </div>
        <div className="score-chip">🔄 {moves}</div>
      </div>

      <div className="question-card">
        <p className="question-label">Find all matching pairs!</p>
        <div className="memory-grid">
          {cards.map(card => (
            <motion.button
              key={card.id}
              className={`memory-card ${isFlipped(card.id) ? 'flipped' : ''} ${isMatched(card.id) ? 'matched' : ''}`}
              onClick={() => handleFlip(card.id)}
              whileHover={!isFlipped(card.id) ? { scale: 1.05 } : {}}
              whileTap={!isFlipped(card.id) ? { scale: 0.95 } : {}}
            >
              <span className="card-back">?</span>
              <span className="card-front">{card.value}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
