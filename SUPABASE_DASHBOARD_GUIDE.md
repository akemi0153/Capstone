# 📧 Supabase Email Confirmation - Step by Step Guide

## 🎯 What You Need to Do in Supabase Dashboard

### Part 1: Enable Email Confirmation (5 minutes)

#### 1️⃣ Access Your Supabase Project
```
1. Go to: https://supabase.com/dashboard
2. Click on: "ASCOT IGP SmartStock" project
```

#### 2️⃣ Navigate to Email Settings
```
Left Sidebar:
  → Click "Authentication" 🔐
  → Click "Providers"
  → Click "Email" tab
```

#### 3️⃣ Enable Confirmation
```
Find the toggle switch:
  [ ] Confirm email
  
Change to:
  [✓] Confirm email  ← Enable this!
  
Click [Save] button at the bottom
```

#### 4️⃣ Configure URLs
```
In the same Email provider settings:

Site URL:
┌──────────────────────────────────────┐
│ http://localhost:5500                │  ← For local development
└──────────────────────────────────────┘

Redirect URLs (add these):
┌──────────────────────────────────────┐
│ http://localhost:5500/index.html     │
│ http://localhost:5500/Log In.html    │
│ http://localhost:5500/Log%20In.html  │
└──────────────────────────────────────┘

Click [Save]
```

---

### Part 2: Customize Email Template (10 minutes)

#### 1️⃣ Go to Email Templates
```
Left Sidebar:
  → Authentication 🔐
  → Email Templates ✉️
```

#### 2️⃣ Select Confirm Signup Template
```
You'll see several templates:
  • Invite user
  • Confirm signup  ← Click this one
  • Reset password
  • Magic Link
  • Change Email Address
```

#### 3️⃣ Replace the Template
```
You'll see an editor with:

Subject:
┌──────────────────────────────────┐
│ Confirm Your Signup              │  ← Leave as is or customize
└──────────────────────────────────┘

Body:
┌──────────────────────────────────┐
│ <h2>Confirm your signup</h2>     │
│                                   │  ← Delete all this
│ <p>Follow this link...</p>       │
│ ...                               │
└──────────────────────────────────┘

Replace with the custom template from
SUPABASE_EMAIL_SETUP.md file
```

#### 4️⃣ Use This Custom Subject (Optional)
```
Subject:
┌──────────────────────────────────┐
│ 🔐 Confirm Your IGP SmartStock Account │
└──────────────────────────────────┘
```

#### 5️⃣ Paste Custom Body
```
Copy the HTML template from:
SUPABASE_EMAIL_SETUP.md

Paste into the Body editor

Click [Save] at the bottom
```

---

### Part 3: Test Configuration (5 minutes)

#### 1️⃣ Test Registration
```
1. Open: Registration.html
2. Register with your real email
3. Submit form
```

#### 2️⃣ Verify Toast Notification
```
You should see:
┌─────────────────────────────────────────────┐
│ ✅ Registration Successful!                  │
│                                              │
│ Your account has been created successfully! │
│                                              │
│ 📧 Verify Your Email                        │
│ A confirmation link has been sent to        │
│ your-email@example.com                      │
│                                              │
│ [Open Gmail]  [Go to Login]                 │
└─────────────────────────────────────────────┘
```

#### 3️⃣ Check Your Email
```
Check inbox for email from:
┌──────────────────────────────────┐
│ From: noreply@mail.app.supabase.co │
│ Subject: Confirm Your Signup      │
└──────────────────────────────────┘

Or your custom SMTP email if configured
```

#### 4️⃣ Click Confirmation Link
```
Email contains:
┌──────────────────────────────────┐
│  [Confirm Your Email]            │  ← Click this button
└──────────────────────────────────┘

Should redirect to: index.html or Log In.html
```

#### 5️⃣ Test Login
```
1. Go to: Log In.html
2. Enter: your-email@example.com
3. Enter: your-password
4. Click: [Log In]

Should see:
✅ Login Successful
   Welcome back, Your Name!
```

---

## 🎨 Visual Guide: Where Things Are

### Supabase Dashboard Layout:
```
┌──────────────────────────────────────────────────────┐
│ [Supabase Logo] ASCOT IGP SmartStock        Profile ▼│
├─────────────┬────────────────────────────────────────┤
│             │                                         │
│  🏠 Home     │  Main Content Area                     │
│  📊 Table    │                                         │
│  🔐 Auth ◄── │  ← YOU ARE HERE                        │
│    Users     │                                         │
│    Policies  │  Authentication Settings               │
│  → Providers │                                         │
│  → Templates │  [Email Provider Settings]             │
│  📧 Email    │                                         │
│  🔧 Sett     │  □ Confirm email  ← Enable this       │
│             │                                         │
│             │  Site URL: ___________________         │
│             │  Redirect URLs: ______________         │
│             │                                         │
│             │  [Save]                                │
└─────────────┴────────────────────────────────────────┘
```

---

## 🚨 Important Configuration Values

### Copy These Exactly:

#### For Local Development:
```javascript
Site URL:
http://localhost:5500

Redirect URLs:
http://localhost:5500/index.html
http://localhost:5500/Log In.html
http://localhost:5500/Log%20In.html
```

#### For Production (Replace with your domain):
```javascript
Site URL:
https://yourdomain.com

Redirect URLs:
https://yourdomain.com/index.html
https://yourdomain.com/Log In.html
https://yourdomain.com/
```

---

## ✅ Verification Checklist

After completing setup, verify:

- [ ] "Confirm email" toggle is ON in Supabase
- [ ] Site URL is correctly set
- [ ] All redirect URLs are added
- [ ] Email template is customized and saved
- [ ] Test registration sends email
- [ ] Confirmation email arrives in inbox
- [ ] Email design looks correct (IGP branding)
- [ ] Confirmation link works and redirects
- [ ] Unverified users cannot login
- [ ] Error message shows for unverified accounts
- [ ] "Resend Link" button works
- [ ] "Open Gmail" button works

---

## 📞 Need Help?

### If emails aren't sending:
1. Check spam/junk folder
2. Verify Supabase project status
3. Check email provider limits
4. Consider custom SMTP setup

### If confirmation link doesn't work:
1. Verify redirect URLs match exactly
2. Check browser console for errors
3. Clear browser cache
4. Test in incognito mode

### If users can login without confirming:
1. Verify "Confirm email" toggle is ON
2. Save settings and wait 1-2 minutes
3. Test with new registration
4. Check auth policies

---

**Quick Access Links:**
- Supabase Dashboard: https://supabase.com/dashboard
- Email Templates Docs: https://supabase.com/docs/guides/auth/auth-email
- SMTP Setup Guide: https://supabase.com/docs/guides/auth/auth-smtp

**Files to Reference:**
- Custom Email Template: `SUPABASE_EMAIL_SETUP.md`
- Complete Checklist: `EMAIL_CONFIRMATION_CHECKLIST.md`
- This Guide: `SUPABASE_DASHBOARD_GUIDE.md`

---

**Setup Time**: ~20 minutes  
**Difficulty**: Easy ⭐  
**Status**: Ready to Configure ✅
