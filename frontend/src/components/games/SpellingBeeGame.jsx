import { useState } from 'react';
import { motion } from 'framer-motion';
import './MiniGame.css';

const WORDS = [
  { word: 'CAT', hint: '🐱' },
  { word: 'DOG', hint: '🐶' },
  { word: 'SUN', hint: '☀️' },
  { word: 'CUP', hint: '☕' },
  { word: 'BAG', hint: '👜' },
];

const XP_REWARD = 10;

export default function SpellingBeeGame({ onBack, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const question = WORDS[current];

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const correct = typed.toUpperCase().trim() === question.word;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      if (current + 1 >= WORDS.length) {
        setFinished(true);
        const finalScore = correct ? score + 1 : score;
        onComplete({ gameName: 'Spelling Bee', score: finalScore, total: WORDS.length, xpEarned: Math.round((finalScore / WORDS.length) * XP_REWARD) });
      } else {
        setCurrent(c => c + 1);
        setTyped('');
        setFeedback(null);
        setSubmitted(false);
      }
    }, 1000);
  };

  if (finished) return null;

  return (
    <div className="mini-game">
      <div className="game-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="game-progress">
          <span>{current + 1} / {WORDS.length}</span>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${(current / WORDS.length) * 100}%` }} /></div>
        </div>
        <div className="score-chip">⭐ {score}</div>
      </div>

      <div className={`question-card spelling-card ${feedback || ''}`}>
        <p className="question-label">Spell the word shown by the hint!</p>
        <div className="spelling-hint">{question.hint}</div>
        <p className="spelling-hint-label">{question.hint} — {question.word.length} letters</p>
        <input
          className={`spelling-input ${feedback || ''}`}
          type="text"
          value={typed}
          maxLength={question.word.length + 2}
          onChange={e => setTyped(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={`_ `.repeat(question.word.length).trim()}
          disabled={submitted}
          autoFocus
          autoComplete="off"
        />
        {feedback && (
          <p className={`spelling-feedback ${feedback}`}>
            {feedback === 'correct' ? '✅ Correct!' : `❌ It was "${question.word}"`}
          </p>
        )}
        {!submitted && (
          <motion.button
            className="submit-btn"
            onClick={handleSubmit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!typed.trim()}
          >
            Check Answer
          </motion.button>
        )}
      </div>
    </div>
  );
}
