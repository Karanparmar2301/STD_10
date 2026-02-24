import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MiniGame.css';

const QUESTIONS = [
  { number: 1, word: 'ONE', options: ['ONE', 'TWO', 'THREE', 'FOUR'] },
  { number: 2, word: 'TWO', options: ['FIVE', 'TWO', 'SIX', 'NINE'] },
  { number: 3, word: 'THREE', options: ['EIGHT', 'ONE', 'THREE', 'SEVEN'] },
  { number: 4, word: 'FOUR', options: ['FOUR', 'TEN', 'TWO', 'FIVE'] },
  { number: 5, word: 'FIVE', options: ['SIX', 'THREE', 'NINE', 'FIVE'] },
];

const XP_REWARD = 5;

export default function NumberMatchGame({ onBack, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'

  const question = QUESTIONS[current];

  const handleAnswer = (option) => {
    if (selected !== null) return;
    setSelected(option);
    const correct = option === question.word;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      if (current + 1 >= QUESTIONS.length) {
        setFinished(true);
        const finalScore = correct ? score + 1 : score;
        const xpEarned = Math.round((finalScore / QUESTIONS.length) * XP_REWARD);
        onComplete({ gameName: 'Number Match', score: finalScore, total: QUESTIONS.length, xpEarned });
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
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((current) / QUESTIONS.length) * 100}%` }} />
          </div>
        </div>
        <div className="score-chip">⭐ {score}</div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="question-card"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="question-label">Match the number with its word!</p>
          <div className="number-display">{question.number}</div>
          <div className="options-grid">
            {question.options.map(opt => (
              <motion.button
                key={opt}
                className={`option-btn ${selected === opt ? (feedback === 'correct' ? 'correct' : 'wrong') : ''} ${selected && opt === question.word ? 'correct' : ''}`}
                onClick={() => handleAnswer(opt)}
                whileHover={!selected ? { scale: 1.05 } : {}}
                whileTap={!selected ? { scale: 0.95 } : {}}
                disabled={!!selected}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
