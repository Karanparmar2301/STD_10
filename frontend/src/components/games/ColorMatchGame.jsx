import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MiniGame.css';

const QUESTIONS = [
  { colorName: 'Red', hex: '#ef4444', options: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'] },
  { colorName: 'Blue', hex: '#3b82f6', options: ['#ef4444', '#8b5cf6', '#3b82f6', '#6b7280'] },
  { colorName: 'Green', hex: '#10b981', options: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'] },
  { colorName: 'Yellow', hex: '#fbbf24', options: ['#8b5cf6', '#fbbf24', '#3b82f6', '#ef4444'] },
  { colorName: 'Purple', hex: '#8b5cf6', options: ['#10b981', '#ef4444', '#fbbf24', '#8b5cf6'] },
];

const COLOR_NAMES = {
  '#ef4444': 'Red', '#3b82f6': 'Blue', '#10b981': 'Green',
  '#f59e0b': 'Orange', '#fbbf24': 'Yellow', '#8b5cf6': 'Purple',
  '#6b7280': 'Gray',
};

const XP_REWARD = 5;

export default function ColorMatchGame({ onBack, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);

  const question = QUESTIONS[current];

  const handleAnswer = (hex) => {
    if (selected !== null) return;
    setSelected(hex);
    const correct = hex === question.hex;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      if (current + 1 >= QUESTIONS.length) {
        setFinished(true);
        const finalScore = correct ? score + 1 : score;
        onComplete({ gameName: 'Color Match', score: finalScore, total: QUESTIONS.length, xpEarned: Math.round((finalScore / QUESTIONS.length) * XP_REWARD) });
      } else {
        setCurrent(c => c + 1);
        setSelected(null);
        setFeedback(null);
      }
    }, 900);
  };

  if (finished) return null;

  return (
    <div className="mini-game">
      <div className="game-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="game-progress">
          <span>{current + 1} / {QUESTIONS.length}</span>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${(current / QUESTIONS.length) * 100}%` }} /></div>
        </div>
        <div className="score-chip">⭐ {score}</div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current} className="question-card" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} transition={{ duration: 0.3 }}>
          <p className="question-label">Pick the <strong>{question.colorName}</strong> color!</p>
          <div className="color-options">
            {question.options.map(hex => (
              <motion.button
                key={hex}
                className={`color-btn ${selected === hex ? (feedback === 'correct' ? 'correct' : 'wrong') : ''} ${selected && hex === question.hex ? 'correct' : ''}`}
                style={{ background: hex }}
                onClick={() => handleAnswer(hex)}
                whileHover={!selected ? { scale: 1.1 } : {}}
                whileTap={!selected ? { scale: 0.9 } : {}}
                disabled={!!selected}
              >
                {selected && <span className="color-label">{COLOR_NAMES[hex] || ''}</span>}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
