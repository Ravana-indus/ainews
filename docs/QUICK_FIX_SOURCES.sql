-- Quick Fix for Failing Sources
-- Execute these SQL commands in Supabase SQL Editor

-- Step 1: Fix domain constraints (allow multiple sources from same domain)
-- Ada Derana Tamil
UPDATE sources
SET domain = 'tamil.adaderana.lk'
WHERE name = 'Ada Derana Tamil';

-- Hirunews Tamil
UPDATE sources
SET domain = 'tamil.hirunews.lk'
WHERE name = 'Hirunews Tamil';

-- Step 2: Add working RSS URLs (test these first!)
-- Daily Mirror - WordPress RSS feed
UPDATE sources
SET rss_url = 'https://www.dailymirror.lk/feed/'
WHERE name = 'Daily Mirror';

-- Hirunews English
UPDATE sources
SET rss_url = 'https://www.hirunews.lk/rss.php'
WHERE name = 'Hirunews English';

-- Hirunews Tamil
UPDATE sources
SET rss_url = 'https://www.hirunews.lk/tamil/rss.php'
WHERE name = 'Hirunews Tamil';

-- Newsfirst Sinhala
UPDATE sources
SET rss_url = 'https://www.newsfirst.lk/sinhala/feed/'
WHERE name = 'Newsfirst Sinhala';

-- Ada Derana Tamil
UPDATE sources
SET rss_url = 'https://tamil.adaderana.lk/rss.php'
WHERE name = 'Ada Derana Tamil';

-- Step 3: Verify all sources have RSS URLs
SELECT name, domain, rss_url, enabled
FROM sources
WHERE enabled = true
ORDER BY name;

-- Expected: All sources should have rss_url populated
