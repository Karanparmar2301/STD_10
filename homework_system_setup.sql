-- ============================================
-- HOMEWORK SYSTEM - CLASS 1 COMPLETE SETUP
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Table: homework
CREATE TABLE IF NOT EXISTS homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL CHECK (subject IN ('math', 'english')),
    question TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    class_section TEXT DEFAULT '1-A',
    xp_reward INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT now()
);

-- Table: homework_submissions
CREATE TABLE IF NOT EXISTS homework_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homework_id UUID NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
    student_uid UUID NOT NULL,
    student_answer TEXT NOT NULL,
    completed_at TIMESTAMP DEFAULT now(),
    UNIQUE(homework_id, student_uid)
);

-- Add reward_points to parents if not exists
ALTER TABLE parents ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0;

-- ============================================
-- 2. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view homework for their class
DROP POLICY IF EXISTS "Students can view class homework" ON homework;
CREATE POLICY "Students can view class homework"
ON homework FOR SELECT
USING (
    class_section IN (
        SELECT class_section FROM parents WHERE uid = auth.uid()
    )
);

-- Policy: Students can view their own submissions
DROP POLICY IF EXISTS "Students view own submissions" ON homework_submissions;
CREATE POLICY "Students view own submissions"
ON homework_submissions FOR SELECT
USING (student_uid = auth.uid());

-- Policy: Students can insert their own submissions
DROP POLICY IF EXISTS "Students insert own submissions" ON homework_submissions;
CREATE POLICY "Students insert own submissions"
ON homework_submissions FOR INSERT
WITH CHECK (student_uid = auth.uid());

-- ============================================
-- 3. SEED CLASS-1 HOMEWORK (if table empty)
-- ============================================

-- Check if homework already exists, insert only if empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM homework LIMIT 1) THEN
        
        -- MATH HOMEWORK (10 tasks)
        INSERT INTO homework (title, subject, question, correct_answer, class_section, xp_reward) VALUES
        ('Addition 1', 'math', '2 + 3 = ?', '5', '1-A', 5),
        ('Subtraction 1', 'math', '5 − 2 = ?', '3', '1-A', 5),
        ('Addition 2', 'math', '1 + 6 = ?', '7', '1-A', 5),
        ('Addition 3', 'math', '4 + 4 = ?', '8', '1-A', 5),
        ('Subtraction 2', 'math', '9 − 3 = ?', '6', '1-A', 5),
        ('Subtraction 3', 'math', '10 − 5 = ?', '5', '1-A', 5),
        ('Addition 4', 'math', '3 + 2 = ?', '5', '1-A', 5),
        ('Addition 5', 'math', '6 + 1 = ?', '7', '1-A', 5),
        ('Subtraction 4', 'math', '8 − 4 = ?', '4', '1-A', 5),
        ('Addition 6', 'math', '7 + 0 = ?', '7', '1-A', 5);
        
        -- ENGLISH HOMEWORK (10 tasks)
        INSERT INTO homework (title, subject, question, correct_answer, class_section, xp_reward) VALUES
        ('Spelling 1', 'english', 'Fill the blank: A _ P L E', 'P', '1-A', 5),
        ('Opposites 1', 'english', 'Opposite of BIG', 'Small', '1-A', 5),
        ('Spelling 2', 'english', 'Spell CAT', 'cat', '1-A', 5),
        ('First Letter 1', 'english', 'First letter of Ball', 'B', '1-A', 5),
        ('Spelling 3', 'english', 'Fill the blank: D O G', 'dog', '1-A', 5),
        ('Opposites 2', 'english', 'Opposite of HOT', 'Cold', '1-A', 5),
        ('Spelling 4', 'english', 'Spell SUN', 'sun', '1-A', 5),
        ('First Letter 2', 'english', 'First letter of Apple', 'A', '1-A', 5),
        ('Opposites 3', 'english', 'Opposite of UP', 'Down', '1-A', 5),
        ('Spelling 5', 'english', 'Spell BAT', 'bat', '1-A', 5);
        
    END IF;
END $$;

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_homework_class ON homework(class_section);
CREATE INDEX IF NOT EXISTS idx_homework_subject ON homework(subject);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON homework_submissions(student_uid);
CREATE INDEX IF NOT EXISTS idx_submissions_homework ON homework_submissions(homework_id);

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Run this script in Supabase SQL Editor
-- 20 homework assignments created (10 Math + 10 English)
-- RLS policies enabled
-- Indexes created for performance
