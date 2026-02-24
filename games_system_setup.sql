-- =====================================================
-- LEARNING GAMES SYSTEM - DATABASE SETUP
-- Complete schema for 9 Class-1 educational games
-- =====================================================

-- 1. Create game_sessions table (if not exists)
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_uid UUID NOT NULL,
    game_name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER DEFAULT 10,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    badge_earned TEXT,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    CONSTRAINT fk_student FOREIGN KEY (student_uid) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Add badges column to parents table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parents' AND column_name = 'badges'
    ) THEN
        ALTER TABLE parents ADD COLUMN badges JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. Add games_played column to parents table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parents' AND column_name = 'games_played'
    ) THEN
        ALTER TABLE parents ADD COLUMN games_played INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Add total_game_xp column to parents table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parents' AND column_name = 'total_game_xp'
    ) THEN
        ALTER TABLE parents ADD COLUMN total_game_xp INTEGER DEFAULT 0;
    END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_student ON game_sessions(student_uid);
CREATE INDEX IF NOT EXISTS idx_game_sessions_played_at ON game_sessions(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_name ON game_sessions(game_name);

-- 6. Enable Row Level Security
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view own game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Students can insert own game sessions" ON game_sessions;

-- 8. Create RLS policies
CREATE POLICY "Students can view own game sessions"
    ON game_sessions FOR SELECT
    USING (student_uid = auth.uid());

CREATE POLICY "Students can insert own game sessions"
    ON game_sessions FOR INSERT
    WITH CHECK (student_uid = auth.uid());

-- 9. Create game configuration table (optional - for extensibility)
CREATE TABLE IF NOT EXISTS game_config (
    id SERIAL PRIMARY KEY,
    game_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    base_xp INTEGER DEFAULT 5,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Insert game configurations
INSERT INTO game_config (game_name, display_name, description, difficulty, base_xp, icon) VALUES
('number_match', 'Number Match', 'Match numbers with their word forms', 'Easy', 5, '🔢'),
('alphabet_race', 'Alphabet Race', 'Identify letters quickly and correctly', 'Medium', 8, '🔤'),
('math_quest', 'Math Quest', 'Solve simple addition and subtraction', 'Easy', 10, '➕'),
('shape_finder', 'Shape Finder', 'Identify circles, squares, and triangles', 'Easy', 5, '🔺'),
('color_match', 'Color Match', 'Match color names with colored boxes', 'Easy', 5, '🎨'),
('spelling_bee', 'Spelling Bee', 'Spell simple 3-letter words', 'Medium', 10, '🐝'),
('word_builder', 'Word Builder', 'Arrange letters to form words', 'Medium', 12, '📝'),
('counting_stars', 'Counting Stars', 'Count objects and numbers', 'Easy', 6, '⭐'),
('memory_flip', 'Memory Flip', 'Match pairs of cards', 'Medium', 15, '🃏')
ON CONFLICT (game_name) DO NOTHING;

-- 11. Create badge definitions table
CREATE TABLE IF NOT EXISTS badge_definitions (
    id SERIAL PRIMARY KEY,
    badge_key TEXT UNIQUE NOT NULL,
    badge_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    requirement_type TEXT, -- 'games_played', 'total_xp', 'specific_game'
    requirement_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Insert badge definitions
INSERT INTO badge_definitions (badge_key, badge_name, description, icon, requirement_type, requirement_value) VALUES
('starter_star', 'Starter Star', 'Completed your first game!', '⭐', 'games_played', 1),
('rising_learner', 'Rising Learner', 'Played 5 different games', 'games_played', 5),
('math_hero', 'Math Hero', 'Completed 10 games successfully', 'games_played', 10),
('super_scholar', 'Super Scholar', 'Achieved 20 game completions!', 'games_played', 20),
('speed_demon', 'Speed Demon', 'Completed a game in under 30 seconds', 'speed', 30),
('perfect_score', 'Perfect Score', 'Got 100% on any game', 'perfect', 100)
ON CONFLICT (badge_key) DO NOTHING;

-- 13. Create function to update student stats after game
CREATE OR REPLACE FUNCTION update_student_game_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update games_played and total_game_xp in parents table
    UPDATE parents
    SET 
        games_played = games_played + 1,
        total_game_xp = total_game_xp + NEW.xp_earned,
        reward_points = reward_points + NEW.xp_earned
    WHERE uid = NEW.student_uid;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create trigger to auto-update stats
DROP TRIGGER IF EXISTS trigger_update_game_stats ON game_sessions;
CREATE TRIGGER trigger_update_game_stats
    AFTER INSERT ON game_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_student_game_stats();

-- 15. Create function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_student_uid UUID)
RETURNS JSONB AS $$
DECLARE
    v_games_played INTEGER;
    v_total_xp INTEGER;
    v_current_badges JSONB;
    v_new_badges JSONB := '[]'::jsonb;
    v_badge RECORD;
BEGIN
    -- Get current stats
    SELECT games_played, total_game_xp, COALESCE(badges, '[]'::jsonb)
    INTO v_games_played, v_total_xp, v_current_badges
    FROM parents
    WHERE uid = p_student_uid;
    
    -- Check each badge definition
    FOR v_badge IN 
        SELECT * FROM badge_definitions 
        WHERE NOT (v_current_badges @> jsonb_build_array(jsonb_build_object('key', badge_key)))
    LOOP
        -- Check if badge should be awarded
        IF v_badge.requirement_type = 'games_played' AND v_games_played >= v_badge.requirement_value THEN
            v_new_badges := v_new_badges || jsonb_build_array(
                jsonb_build_object(
                    'key', v_badge.badge_key,
                    'name', v_badge.badge_name,
                    'icon', v_badge.icon,
                    'earned_at', NOW()
                )
            );
        END IF;
    END LOOP;
    
    -- Add new badges to existing badges
    IF jsonb_array_length(v_new_badges) > 0 THEN
        UPDATE parents
        SET badges = COALESCE(badges, '[]'::jsonb) || v_new_badges
        WHERE uid = p_student_uid;
    END IF;
    
    RETURN v_new_badges;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SETUP COMPLETE
-- 
-- Tables Created:
-- - game_sessions (stores all game play history)
-- - game_config (game definitions)
-- - badge_definitions (badge requirements)
--
-- Columns Added to parents:
-- - badges (JSONB array of earned badges)
-- - games_played (total count)
-- - total_game_xp (XP from games only)
--
-- Functions Created:
-- - update_student_game_stats() - Auto-updates stats
-- - check_and_award_badges() - Awards badges
--
-- RLS Enabled:
-- - Students can only see/insert their own sessions
-- =====================================================
