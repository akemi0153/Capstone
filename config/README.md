# Security Configuration Guide

## 🔒 Supabase Credentials

This project uses a secure credential management system to protect sensitive Supabase configuration.

### File Structure

```
config/
├── credentials.js         # ⚠️ ACTUAL CREDENTIALS (git-ignored)
└── credentials.example.js # Template file (safe to commit)
```

### Setup Instructions

1. **The credentials are already configured** in `config/credentials.js`
2. **Never commit `credentials.js`** to version control (it's already in `.gitignore`)
3. If you need to share the project, others should:
   - Copy `credentials.example.js` to `credentials.js`
   - Add their own Supabase URL and anon key

### Current Configuration

✅ Supabase credentials are stored in: `config/credentials.js`  
✅ Protected by `.gitignore`  
✅ Template available at: `config/credentials.example.js`

### How It Works

The system imports credentials from the secure location:

```javascript
// scripts/config.js
import { SUPABASE_CONFIG } from '../config/credentials.js';

// Initialize Supabase Client
export const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url, 
    SUPABASE_CONFIG.anonKey
);
```

### Security Best Practices

✅ **DO**:
- Keep `credentials.js` in `.gitignore`
- Use environment variables for production
- Share `credentials.example.js` as a template

❌ **DON'T**:
- Commit actual credentials to git
- Share credentials in public channels
- Hard-code credentials in main application files

### Database Tables

The system expects the following Supabase tables:

- `inventory` - Product inventory management
- `rooms` - Room/unit information
- `bookings` - Lease/rental bookings
- `transactions` - Financial transactions

### Verifying Setup

To verify your Supabase connection is working:

1. Open the application in a browser
2. Open Developer Console (F12)
3. Check for "✅ Loaded X items from Supabase" messages
4. No authentication errors should appear

### Need Help?

If you encounter connection issues:

1. Verify your Supabase URL in `config/credentials.js`
2. Check your anon key is correct
3. Ensure Supabase tables exist
4. Check browser console for specific errors
