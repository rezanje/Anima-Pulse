-- Add login_code unique text column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_code text UNIQUE;

-- Update seeded users with default login codes
UPDATE public.users SET login_code = 'SUPER123' WHERE email = 'rezarezanje@gmail.com';
UPDATE public.users SET login_code = 'ADMIN123' WHERE email = 'devi@animacompanion.com';
UPDATE public.users SET login_code = 'MGR123' WHERE email = 'reza@animacompanion.com';
UPDATE public.users SET login_code = 'STAFF123' WHERE email = 'adit@animacompanion.com';
UPDATE public.users SET login_code = 'STAFF2' WHERE email = 'salsa@animacompanion.com';
UPDATE public.users SET login_code = 'STAFF3' WHERE email = 'rina@animacompanion.com';
UPDATE public.users SET login_code = 'STAFF4' WHERE email = 'bagas@animacompanion.com';
UPDATE public.users SET login_code = 'STAFF5' WHERE email = 'putri@animacompanion.com';
