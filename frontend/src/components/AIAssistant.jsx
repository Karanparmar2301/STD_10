import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  sendChatMessage,
  loadHistory,
  addUserMessage,
  clearChat,
  selectMessages,
  selectIsTyping,
  selectSuggestions,
  selectHistoryLoaded,
} from '../store/aiSlice';
import { useTheme } from '../store/ThemeContext';
import './AIAssistant.css';

// ─── Suggestion card data ──────────────────────────────────────────────────────
const SUGGESTION_CARDS = [
  { icon: '🧮', label: 'Help with Math',        prompt: 'Help me with math',                  desc: 'Solve equations, tips & tricks'  },
  { icon: '📚', label: 'Homework Help',          prompt: 'How is my homework going?',          desc: 'Check progress & pending tasks'  },
  { icon: '🎮', label: 'Suggest Best Game',      prompt: 'Which game gives the most XP?',      desc: 'Maximize your XP earnings'       },
  { icon: '📊', label: 'Check My Progress',      prompt: 'Show my progress',                   desc: 'XP, level, streak & badges'      },
  { icon: '🏆', label: 'How to Level Up',        prompt: 'How do I level up faster?',          desc: 'Tips to earn more XP fast'       },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatContent = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );

const bubbleVariants = {
  hidden:  { opacity: 0, y: 14, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.22, ease: 'easeOut' } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const TypingIndicator = memo(() => (
  <div className="aia-bubble aia-bubble-ai">
    <div className="aia-avatar">🤖</div>
    <div className="aia-typing">
      <span /><span /><span />
    </div>
  </div>
));
TypingIndicator.displayName = 'TypingIndicator';

const MessageBubble = memo(({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      className={`aia-bubble ${isUser ? 'aia-bubble-user' : 'aia-bubble-ai'}`}
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
    >
      {!isUser && <div className="aia-avatar">🤖</div>}
      <div className={`aia-bubble-text${msg.isError ? ' aia-bubble-error' : ''}`}>
        {msg.content.split('\n').map((line, i, arr) => (
          <span key={i}>
            {formatContent(line)}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </div>
      {isUser && <div className="aia-avatar aia-avatar-user">🧒</div>}
    </motion.div>
  );
});
MessageBubble.displayName = 'MessageBubble';

// ─── Hero Header ──────────────────────────────────────────────────────────────
const HeroHeader = memo(({ level, streak, xpToNextLevel, currentLevelXP, progressPercentage }) => {
  const totalLevelXP = currentLevelXP + xpToNextLevel;
  return (
    <div className="aia-hero">
      {/* Decorative floating blobs */}
      <div className="aia-hero-blob aia-hero-blob-1" />
      <div className="aia-hero-blob aia-hero-blob-2" />
      <div className="aia-hero-blob aia-hero-blob-3" />

      <div className="aia-hero-inner">
        {/* Left: animated bot icon */}
        <motion.div
          className="aia-hero-bot"
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          🤖
          <div className="aia-hero-bot-glow" />
        </motion.div>

        {/* Right: title + sub + stats bar + progress */}
        <div className="aia-hero-text">
          <h1 className="aia-hero-title">AI Learning Assistant</h1>
          <p className="aia-hero-sub">
            Personalised learning powered by your XP, homework &amp; games.
          </p>

          {/* Glass stat bar — horizontal single row */}
          <div className="aia-hero-statsbar">
            <div className="aia-hero-statitem">
              <span className="aia-hero-stat-icon">🔥</span>
              <div className="aia-hero-stat-body">
                <span className="aia-hero-stat-val">{streak} Days</span>
                <span className="aia-hero-stat-lbl">Streak</span>
              </div>
            </div>
            <div className="aia-hero-divider" />
            <div className="aia-hero-statitem">
              <span className="aia-hero-stat-icon">⭐</span>
              <div className="aia-hero-stat-body">
                <span className="aia-hero-stat-val">Level {level}</span>
                <span className="aia-hero-stat-lbl">Current</span>
              </div>
            </div>
            <div className="aia-hero-divider" />
            <div className="aia-hero-statitem">
              <span className="aia-hero-stat-icon">⚡</span>
              <div className="aia-hero-stat-body">
                <span className="aia-hero-stat-val">{xpToNextLevel} XP</span>
                <span className="aia-hero-stat-lbl">To next level</span>
              </div>
            </div>
          </div>

          {/* XP progress bar */}
          <div className="aia-hero-xpwrap">
            <div className="aia-hero-xplabels">
              <span>{currentLevelXP} XP earned</span>
              <span>{totalLevelXP} XP total</span>
            </div>
            <div className="aia-hero-xptrack">
              <motion.div
                className="aia-hero-xpfill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
HeroHeader.displayName = 'HeroHeader';

// ─── Suggestion Cards (Welcome State) ─────────────────────────────────────────
const SuggestionCards = memo(({ onSend }) => (
  <div className="aia-welcome">
    <p className="aia-welcome-prompt">What would you like to explore today?</p>
    <div className="aia-cards-grid">
      {SUGGESTION_CARDS.map((card, i) => (
        <motion.button
          key={card.label}
          className="aia-card"
          onClick={() => onSend(card.prompt)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.3 }}
          whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(99,102,241,0.25)' }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="aia-card-icon">{card.icon}</span>
          <span className="aia-card-label">{card.label}</span>
          <span className="aia-card-desc">{card.desc}</span>
        </motion.button>
      ))}
    </div>
  </div>
));
SuggestionCards.displayName = 'SuggestionCards';

// ─── Main Component ───────────────────────────────────────────────────────────
function AIAssistant({ data }) {
  const dispatch  = useDispatch();
  const { theme } = useTheme();

  const messages      = useSelector(selectMessages);
  const isTyping      = useSelector(selectIsTyping);
  const suggestions   = useSelector(selectSuggestions);
  const historyLoaded = useSelector(selectHistoryLoaded);

  const [input, setInput] = useState('');
  const chatRef  = useRef(null);
  const inputRef = useRef(null);

  const uid = data?.uid || data?.id || null;

  // Load history on mount
  useEffect(() => {
    if (uid && !historyLoaded) dispatch(loadHistory(uid));
  }, [uid, historyLoaded, dispatch]);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = useCallback(
    (textOverride) => {
      const text = (typeof textOverride === 'string' ? textOverride : input).trim();
      if (!text || isTyping) return;
      dispatch(addUserMessage(text));
      dispatch(sendChatMessage({ uid, message: text }));
      setInput('');
      inputRef.current?.focus();
    },
    [input, isTyping, uid, dispatch]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className={`aia-page${theme === 'dark' ? ' aia-dark' : ''}`}>

      {/* ── Body: Suggestion cards OR Chat area ── */}
      <div className="aia-body">
        {!hasMessages && !isTyping ? (
          <SuggestionCards onSend={handleSend} />
        ) : (
          <div className="aia-chat-area" ref={chatRef}>
            {/* Active suggestion chips (compact row) */}
            {hasMessages && (
              <div className="aia-chips-row">
                {suggestions.slice(0, 3).map((s, i) => (
                  <button key={i} className="aia-chip-sm" onClick={() => handleSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {isTyping && <TypingIndicator key="typing" />}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Sticky Input ── */}
      <div className="aia-input-zone">
        {hasMessages && (
          <button className="aia-clear-btn" onClick={() => dispatch(clearChat())}>
            🗑 Clear
          </button>
        )}
        <div className="aia-input-box">
          <textarea
            ref={inputRef}
            className="aia-textarea"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything… (Enter to send, Shift+Enter for newline)"
            disabled={isTyping}
          />
          <motion.button
            className={`aia-send-btn${(!input.trim() || isTyping) ? ' aia-send-disabled' : ''}`}
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            whileHover={input.trim() && !isTyping ? { scale: 1.08 } : {}}
            whileTap={input.trim() && !isTyping ? { scale: 0.95 } : {}}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </div>
        <p className="aia-hint">Your assistant uses live XP, level &amp; homework data for personalised replies.</p>
      </div>
    </div>
  );
}

export default AIAssistant;
