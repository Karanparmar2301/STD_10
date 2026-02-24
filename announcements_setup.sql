-- ============================================================
-- ANNOUNCEMENTS SYSTEM SETUP
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('student','meeting','sports','holiday','event','important')) DEFAULT 'event',
  priority TEXT CHECK (priority IN ('high','normal')) DEFAULT 'normal',
  class_section TEXT DEFAULT '1-A',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create announcement_reads table
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  student_uid UUID,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(announcement_id, student_uid)
);

-- 3. Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Drop existing policies if any
DROP POLICY IF EXISTS "Students can read announcements" ON announcements;
DROP POLICY IF EXISTS "Students manage own reads" ON announcement_reads;

-- Announcements: All authenticated users can read
CREATE POLICY "Students can read announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (true);

-- Reads: Users can only manage their own read records
CREATE POLICY "Students manage own reads"
  ON announcement_reads
  FOR ALL
  TO authenticated
  USING (student_uid = auth.uid())
  WITH CHECK (student_uid = auth.uid());

-- 5. Seed Data (class-1 friendly announcements)
-- Only insert if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM announcements LIMIT 1) THEN

    INSERT INTO announcements (title, description, category, priority, class_section) VALUES
    (
      'Parent-Teacher Meeting',
      'Dear Parents, we are pleased to invite you to our Parent-Teacher Meeting scheduled for February 25, 2026 at 10:00 AM in the school auditorium. Please bring your ward''s report card. Your presence is important for your child''s academic growth.',
      'meeting',
      'high',
      '1-A'
    ),
    (
      'Annual Sports Day 🏃',
      'Get ready for our Annual Sports Day on March 5, 2026! Students will participate in fun races, relay events, and team games. Please ensure students wear their sports uniform and bring a water bottle. Let''s cheer together! 🎉',
      'sports',
      'normal',
      '1-A'
    ),
    (
      'Holiday Notice — Republic Day',
      'School will remain closed on January 26, 2026 on account of Republic Day. Classes will resume on January 27, 2026 (Monday). Wish you all a Happy Republic Day! 🇮🇳',
      'holiday',
      'high',
      '1-A'
    ),
    (
      'Fancy Dress Competition 🎭',
      'We are organizing a Fancy Dress Competition on March 10, 2026. Students can dress as any national hero, cartoon character, or historical figure. Prizes will be given for Best Costume and Best Performance. Register with your class teacher by March 5.',
      'event',
      'normal',
      '1-A'
    ),
    (
      'Drawing Competition 🎨',
      'An Inter-Class Drawing Competition will be held on February 28, 2026. Theme: "Save the Earth". Students should bring their own drawing materials. Winners will be awarded certificates and prizes at the Annual Day.',
      'event',
      'normal',
      '1-A'
    ),
    (
      'School Picnic to National Zoo 🦁',
      'We are excited to announce a school picnic to the National Zoological Park on March 15, 2026. Bus will depart from school at 8:00 AM sharp. Kindly pack a light lunch and wear comfortable clothes. Consent form must be submitted by March 10.',
      'event',
      'normal',
      '1-A'
    ),
    (
      'Health Checkup Camp 🏥',
      'A free Health Checkup Camp will be organised in school on February 20, 2026. Doctors will check eyesight, dental health, and general wellness. Please ensure your child attends school on this day. Reports will be shared with parents.',
      'important',
      'high',
      '1-A'
    ),
    (
      'School Fee Reminder 💰',
      'This is a gentle reminder that the second-term school fee is due by February 28, 2026. Parents who have not yet paid are requested to do so at the fee counter between 9:00 AM and 1:00 PM on working days. Late fee will be applicable after the due date.',
      'important',
      'high',
      '1-A'
    );

  END IF;
END $$;

-- Done!
SELECT 'Announcements system setup complete!' AS status;
SELECT COUNT(*) AS total_announcements FROM announcements;
