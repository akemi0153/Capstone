# User Profiles Database Schema

## Overview
This schema creates a `profiles` table that works seamlessly with Supabase Authentication to store user registration data.

## Features

### 🔐 Security
- **Password Hashing**: Supabase Auth automatically hashes passwords using bcrypt (10 rounds)
- **Row Level Security (RLS)**: Users can only view/edit their own profile
- **Automatic Sync**: Trigger ensures auth data is copied to profiles table

### 📋 Data Stored

**In Supabase Authentication (auth.users):**
- Email (primary identifier)
- Hashed password (bcrypt)
- User metadata (full_name, age, office_unit, position, birthday, contact)
- Email verification status
- Authentication timestamps

**In Profiles Table (public.profiles):**
- All registration form fields for easy querying
- Linked to auth.users via UUID
- Indexed for performance
- Protected by RLS policies

## Setup Instructions

### Step 1: Run SQL Schema
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `create-profiles-table.sql`
4. Paste and click **Run**

### Step 2: Verify Setup
Run this query to check the trigger is active:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Step 3: Test Registration
1. Register a new user through the Registration.html form
2. Check **Authentication → Users** panel (user should appear)
3. Run this query to verify profile was created:
```sql
SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 1;
```

## Database Schema

```sql
public.profiles
├── id (UUID, PRIMARY KEY) → references auth.users(id)
├── full_name (TEXT, NOT NULL)
├── age (INTEGER, NOT NULL, CHECK 18-100)
├── office_unit (TEXT, NOT NULL)
├── position (TEXT, NOT NULL, CHECK 'Teaching' or 'Non-Teaching')
├── birthday (DATE, NOT NULL)
├── contact (TEXT, NOT NULL)
├── email (TEXT, NOT NULL)
├── created_at (TIMESTAMPTZ, DEFAULT now())
└── updated_at (TIMESTAMPTZ, DEFAULT now())

Indexes:
- PRIMARY KEY on id
- INDEX on email
- INDEX on office_unit

Triggers:
- on_auth_user_created (AFTER INSERT on auth.users)
- on_profile_updated (BEFORE UPDATE on profiles)
```

## How It Works

1. **User Registers** → Form submits to `supabase.auth.signUp()`
2. **Auth Creates User** → Supabase creates user in `auth.users` with hashed password
3. **Trigger Fires** → `on_auth_user_created` trigger executes
4. **Profile Created** → User data copied to `public.profiles` table
5. **User Can Login** → `supabase.auth.signInWithPassword()` verifies credentials

## Data Flow Diagram

```
Registration Form
       ↓
supabase.auth.signUp({
  email: "user@example.com",
  password: "plaintext",  ← Hashed by Supabase (bcrypt)
  options: {
    data: { full_name, age, ... }
  }
})
       ↓
auth.users table
├── id: UUID
├── email: "user@example.com"
├── encrypted_password: "$2a$10$..." (bcrypt hash)
└── raw_user_meta_data: { full_name, age, ... }
       ↓
Trigger: on_auth_user_created
       ↓
public.profiles table
├── id: UUID (same as auth.users)
├── full_name: "John Doe"
├── age: 30
├── office_unit: "IT Department"
├── position: "Teaching"
├── birthday: "1995-01-15"
├── contact: "09171234567"
└── email: "user@example.com"
```

## Querying User Data

### Get Current User's Profile
```javascript
// In your app (runs with user's auth context)
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', (await supabase.auth.getUser()).data.user.id)
  .single();
```

### Get All Users (Admin Query)
```sql
-- Run in SQL Editor (requires service_role privileges)
SELECT 
    p.full_name,
    p.email,
    p.office_unit,
    p.position,
    p.age,
    p.birthday,
    p.contact,
    u.email_confirmed_at,
    p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;
```

## Security Notes

### Password Security
- ✅ Passwords are **NEVER** stored in plain text
- ✅ Supabase uses **bcrypt** with 10 salt rounds (industry standard)
- ✅ Passwords are hashed **server-side** (secure)
- ✅ Original password cannot be recovered (only reset)

### Row Level Security (RLS)
```sql
-- Users can only SELECT their own profile
POLICY "Users can view own profile"
  FOR SELECT USING (auth.uid() = id)

-- Users can only UPDATE their own profile
POLICY "Users can update own profile"
  FOR UPDATE USING (auth.uid() = id)

-- Only the system can INSERT (via trigger)
POLICY "Service role can insert profiles"
  FOR INSERT WITH CHECK (true)
```

## Troubleshooting

### Issue: Profile not created after registration
**Solution**: Check if trigger exists
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue: "permission denied for table profiles"
**Solution**: User trying to access another user's profile (RLS working correctly)

### Issue: Cannot query profiles table
**Solution**: Ensure you're authenticated
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Logged in:', !!session);
```

## Migration from Old System

If you have existing users in a custom `users` table:

```sql
-- Backup old users
CREATE TABLE users_backup AS SELECT * FROM users;

-- Migrate to new system (contact admin to run this)
-- This requires creating auth users first, then linking profiles
```

## Additional Features

### Email Verification
Enable in Supabase Dashboard:
1. **Authentication → Settings**
2. Enable "Confirm email"
3. Configure email templates

### Password Reset
```javascript
// Send reset email
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  { redirectTo: 'https://yourapp.com/reset-password' }
);
```

### Profile Updates
```javascript
// Update profile
const { error } = await supabase
  .from('profiles')
  .update({ 
    contact: '09181234567',
    office_unit: 'New Department' 
  })
  .eq('id', user.id);
```

## Support

For issues or questions:
1. Check Supabase logs in Dashboard → Logs
2. Verify RLS policies are enabled
3. Test queries in SQL Editor with service_role
4. Check trigger execution logs
