-- Convert experience and education columns from text to jsonb
ALTER TABLE resumes 
  -- First create backup columns
  ADD COLUMN experience_text TEXT,
  ADD COLUMN education_text TEXT;

-- Copy existing data to backup columns
UPDATE resumes SET 
  experience_text = experience,
  education_text = education;

-- Alter the columns to jsonb type
ALTER TABLE resumes
  ALTER COLUMN experience TYPE JSONB USING 
    CASE 
      WHEN experience ~ '^\[.*\]$' THEN experience::JSONB
      ELSE NULL 
    END,
  ALTER COLUMN education TYPE JSONB USING 
    CASE 
      WHEN education ~ '^\[.*\]$' THEN education::JSONB
      ELSE NULL
    END;

-- For any rows where JSON conversion failed, attempt to manually extract the data
-- We'll update these based on specific patterns after reviewing the data