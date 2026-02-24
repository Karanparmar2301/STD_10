import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MiniGame.css';

const QUESTIONS = [
  { letter: 'A', answer: 'Apple', image: '🍎', options: ['Apple', 'Ball', 'Cat', 'Dog'] },
  { letter: 'B', answer: 'Ball', image: '⚽', options: ['Fish', 'Ball', 'Hat', 'Egg'] },
  { letter: 'C', answer: 'Cat', image: '🐱', options: ['Cup', 'Dog', 'Cat', 'Bus'] },
  { letter: 'D', answer: 'Dog', image: '🐶', options: ['Dog', 'Egg', 'Ant', 'Kite'] },
  { letter: 'E', answer: 'Egg', image: '🥚', options: ['Fan', 'Jam', 'Egg', 'Ice'] },
];

const XP_REWARD = 8;

export default function AlphabetRaceGame({ onBack, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);

  const question = QUESTIONS[current];

  const handleAnswer = (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    const correct = opt === question.answer;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      if (current + 1 >= QUESTIONS.length) {
        setFinished(true);
        const finalScore = correct ? score + 1 : score;
        const xpEarned = Math.round((finalScore / QUESTIONS.length) * XP_REWARD);
        onComplete({ gameName: 'Alphabet Race', score: finalScore, total: QUESTIONS.length, xpEarned });
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
          <p className="question-label">What starts with the letter?</p>
          <div className="letter-display">{question.letter}</div>
          <div className="options-grid">
            {question.options.map(opt => (
              <motion.button
                key={opt}
                className={`option-btn ${selected === opt ? (feedback === 'correct' ? 'correct' : 'wrong') : ''} ${selected && opt === question.answer ? 'correct' : ''}`}
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
