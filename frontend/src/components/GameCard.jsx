import React from 'react';
import { motion } from 'framer-motion';
import './GameCard.css';

const difficultyColors = {
    Easy: '#10b981',
    Medium: '#f59e0b',
    Hard: '#ef4444'
};

const GameCard = ({ game, index, onPlay }) => {
    return (
        <motion.div
            className="game-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
        >
            {/* Gradient header strip */}
            <div
                className="game-card-header"
                style={{ background: game.color }}
            >
                <span className="game-icon">{game.icon}</span>
                <div className="game-badges">
                    <span
                        className="difficulty-badge"
                        style={{ background: difficultyColors[game.difficulty] }}
                    >
                        {game.difficulty}
                    </span>
                    <span className="xp-badge">+{game.xp_reward} XP</span>
                </div>
            </div>

            {/* Card Body */}
            <div className="game-card-body">
                <h3 className="game-title">{game.name}</h3>
                <p className="game-description">{game.description}</p>

                <motion.button
                    className="play-btn"
                    style={{ background: game.color }}
                    onClick={() => onPlay(game)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <span>▶ Play Now</span>
                </motion.button>
            </div>
        </motion.div>
    );
};

export default GameCard;
