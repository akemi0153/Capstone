-- =====================================================
-- USER PROFILES TABLE SCHEMA
-- =====================================================
-- This schema creates a profiles table that syncs with Supabase Authentication
-- User data from registration is automatically copied to this table via trigger

-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
    office_unit TEXT NOT NULL,
    position TEXT NOT NULL CHECK (position IN ('Teaching', 'Non-Teaching')),
    birthday DATE NOT NULL,
    contact TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Add index on office_unit for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_office_unit ON public.profiles(office_unit);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles
FOR SELECT 
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles
FOR UPDATE 
USING (auth.uid() = id);

-- Policy: Allow service role to insert profiles (for trigger)
CREATE POLICY "Service role can insert profiles" 
ON public.profiles
FOR INSERT 
WITH CHECK (true);

-- =====================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- =====================================================
-- This function automatically creates a profile record when a user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        full_name, 
        age, 
        office_unit, 
        position, 
        birthday, 
        contact,
        email
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'age')::integer, 0),
        COALESCE(NEW.raw_user_meta_data->>'office_unit', ''),
        COALESCE(NEW.raw_user_meta_data->>'position', 'Non-Teaching'),
        COALESCE((NEW.raw_user_meta_data->>'birthday')::date, CURRENT_DATE),
        COALESCE(NEW.raw_user_meta_data->>'contact', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$;

-- Create trigger to execute function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
-- Automatically update the updated_at timestamp when profile is modified

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Grant necessary permissions for authenticated users

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Passwords are automatically hashed by Supabase Auth (bcrypt with 10 rounds)
-- 2. User data is stored in both auth.users (metadata) and public.profiles (accessible table)
-- 3. The trigger ensures data consistency between auth and profiles
-- 4. RLS policies protect user data - users can only access their own profile
-- 5. Email verification can be enabled in Supabase Auth settings

-- =====================================================
-- TESTING QUERIES
-- =====================================================
-- View all profiles (run as service_role or in SQL Editor)
-- SELECT * FROM public.profiles ORDER BY created_at DESC;

-- View user with auth data (run as service_role)
-- SELECT 
--     p.*,
--     u.email as auth_email,
--     u.email_confirmed_at,
--     u.created_at as auth_created_at
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.id
-- ORDER BY p.created_at DESC;

-- Check if trigger is working
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
