import { useState } from 'react';
import { motion } from 'framer-motion';
import './MiniGame.css';

const CHALLENGES = [
  { target: 'SUN', letters: ['S', 'U', 'N', 'X'], hint: '☀️' },
  { target: 'CAP', letters: ['C', 'A', 'P', 'B'], hint: '🧢' },
  { target: 'MAP', letters: ['M', 'A', 'P', 'T'], hint: '🗺️' },
  { target: 'JAM', letters: ['J', 'A', 'M', 'Z'], hint: '🍓' },
  { target: 'BUS', letters: ['B', 'U', 'S', 'K'], hint: '🚌' },
];

const XP_REWARD = 12;

export default function WordBuilderGame({ onBack, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [built, setBuilt] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);
  const [checking, setChecking] = useState(false);

  const challenge = CHALLENGES[current];
  const shuffled = [...challenge.letters];

  const addLetter = (letter, idx) => {
    if (feedback || built.length >= challenge.target.length) return;
    setBuilt(b => [...b, { letter, idx }]);
  };

  const removeLast = () => {
    if (feedback) return;
    setBuilt(b => b.slice(0, -1));
  };

  const handleCheck = () => {
    if (checking || built.length !== challenge.target.length) return;
    setChecking(true);
    const word = built.map(b => b.letter).join('');
    const correct = word === challenge.target;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      if (current + 1 >= CHALLENGES.length) {
        setFinished(true);
        const finalScore = correct ? score + 1 : score;
        onComplete({ gameName: 'Word Builder', score: finalScore, total: CHALLENGES.length, xpEarned: Math.round((finalScore / CHALLENGES.length) * XP_REWARD) });
      } else {
        setCurrent(c => c + 1);
        setBuilt([]);
        setFeedback(null);
        setChecking(false);
      }
    }, 1000);
  };

  if (finished) return null;

  const usedIndices = built.map(b => b.idx);

  return (
    <div className="mini-game">
      <div className="game-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="game-progress">
          <span>{current + 1} / {CHALLENGES.length}</span>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${(current / CHALLENGES.length) * 100}%` }} /></div>
        </div>
        <div className="score-chip">⭐ {score}</div>
      </div>

      <div className={`question-card ${feedback || ''}`}>
        <p className="question-label">Build the word for this hint!</p>
        <div className="wb-hint">{challenge.hint}</div>
        <div className="wb-slots">
          {Array.from({ length: challenge.target.length }).map((_, i) => (
            <div key={i} className={`wb-slot ${built[i] ? 'filled' : ''}`}>
              {built[i]?.letter || ''}
            </div>
          ))}
        </div>
        <div className="wb-letters">
          {shuffled.map((letter, idx) => (
            <motion.button
              key={idx}
              className={`wb-letter-btn ${usedIndices.includes(idx) ? 'used' : ''}`}
              onClick={() => addLetter(letter, idx)}
              whileHover={!usedIndices.includes(idx) ? { scale: 1.1 } : {}}
              whileTap={!usedIndices.includes(idx) ? { scale: 0.9 } : {}}
              disabled={usedIndices.includes(idx) || !!feedback}
            >
              {letter}
            </motion.button>
          ))}
        </div>
        {feedback && (
          <p className={`spelling-feedback ${feedback}`}>
            {feedback === 'correct' ? '✅ Correct!' : `❌ It was "${challenge.target}"`}
          </p>
        )}
        <div className="wb-actions">
          <button className="clear-btn" onClick={removeLast} disabled={!built.length || !!feedback}>⌫ Undo</button>
          <motion.button
            className="submit-btn"
            onClick={handleCheck}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={built.length !== challenge.target.length || !!feedback}
          >
            Check ✓
          </motion.button>
        </div>
      </div>
    </div>
  );
}
