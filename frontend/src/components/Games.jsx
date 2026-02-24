import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchGamesStats,
  completeGame,
  setActiveGame,
  clearActiveGame,
  selectAllGames,
  selectActiveGame,
  selectGamesLoading,
  selectShowBadgeModal,
  selectXPAnimation,
} from '../store/gamesSlice';
import { selectUser } from '../store/authSlice';
import GameCard from './GameCard';
import BadgeModal from './BadgeModal';
import XPAnimation from './XPAnimation';
import GameResultModal from './games/GameResultModal';

import NumberMatchGame  from './games/NumberMatchGame';
import AlphabetRaceGame from './games/AlphabetRaceGame';
import MathQuestGame    from './games/MathQuestGame';
import ShapeFinderGame  from './games/ShapeFinderGame';
import ColorMatchGame   from './games/ColorMatchGame';
import SpellingBeeGame  from './games/SpellingBeeGame';
import WordBuilderGame  from './games/WordBuilderGame';
import CountingStarsGame from './games/CountingStarsGame';
import MemoryFlipGame   from './games/MemoryFlipGame';

import './Games.css';

const GAME_COMPONENTS = {
  'number_match':   NumberMatchGame,
  'alphabet_race':  AlphabetRaceGame,
  'math_quest':     MathQuestGame,
  'shape_finder':   ShapeFinderGame,
  'color_match':    ColorMatchGame,
  'spelling_bee':   SpellingBeeGame,
  'word_builder':   WordBuilderGame,
  'counting_stars': CountingStarsGame,
  'memory_flip':    MemoryFlipGame,
};

function Games() {
  const dispatch = useDispatch();
  const user     = useSelector(selectUser);
  const games    = useSelector(selectAllGames);
  const activeGame      = useSelector(selectActiveGame);
  const loading         = useSelector(selectGamesLoading);
  const showBadgeModal  = useSelector(selectShowBadgeModal);
  const xpAnimation     = useSelector(selectXPAnimation);

  // Local state for the result modal
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    if (user?.uid) dispatch(fetchGamesStats(user.uid));
  }, [dispatch, user]);

  // Called by each game component when it finishes
  const handleGameComplete = useCallback((result) => {
    dispatch(completeGame({
      uid:             user?.uid,
      game_name:       result.gameName,
      score:           result.score,
      total_questions: result.total,
      xp_earned:       result.xpEarned,
    }));
    setGameResult(result);
  }, [dispatch, user?.uid]);

  // Back to games grid — clears both the active game and the result modal
  const handleBack = useCallback(() => {
    setGameResult(null);
    dispatch(clearActiveGame());
    if (user?.uid) dispatch(fetchGamesStats(user.uid));
  }, [dispatch, user?.uid]);

  // Play again — keep the same game, just reset result
  const handlePlayAgain = useCallback(() => {
    setGameResult(null);
  }, []);

  const handlePlay = (game) => dispatch(setActiveGame(game));

  const ActiveGameComponent = activeGame ? GAME_COMPONENTS[activeGame.id] : null;

  return (
    <div className="games-page">
      <AnimatePresence mode="wait">
        {!activeGame && (
          <motion.div
            className="games-header"
            key="header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="games-header-left">
              <h1 className="games-title">🎮 Learning Games</h1>
              <p className="games-subtitle">Play, learn &amp; earn XP rewards!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeGame ? (
          <motion.div
            key="active-game"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            {ActiveGameComponent && (
            <ActiveGameComponent
              onBack={handleBack}
              onComplete={handleGameComplete}
            />
          )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="games-grid-wrapper"
          >
            {loading ? (
              <div className="games-loading">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="game-skeleton" />
                ))}
              </div>
            ) : (
              <div className="games-grid">
                {games.map((game, index) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    index={index}
                    onPlay={handlePlay}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showBadgeModal && <BadgeModal />}
      {xpAnimation && <XPAnimation amount={xpAnimation.amount} />}

      {/* Game Result Modal — shown after any game finishes */}
      <AnimatePresence>
        {gameResult && (
          <GameResultModal
            result={gameResult}
            onBack={handleBack}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Games;
