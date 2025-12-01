# Supabase Email Confirmation Setup Guide

## 🎯 Overview
This guide will help you customize the email confirmation message that users receive when they register for IGP SmartStock.

## 📧 Step 1: Access Email Templates in Supabase

1. **Log in to your Supabase Dashboard**: https://supabase.com/dashboard
2. Navigate to your project: **ASCOT IGP SmartStock**
3. Click on **Authentication** in the left sidebar
4. Click on **Email Templates** (under the Authentication section)

## ✏️ Step 2: Edit the Confirmation Email Template

### Find the "Confirm signup" Template
Look for the template titled **"Confirm signup"** or **"Confirm Your Signup"**

### Replace the Email Content

Copy and paste this custom email template:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

### Recommended Custom Template for IGP SmartStock:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 2px solid #FFD700;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #e6b800; font-size: 28px; margin: 0;">IGP SmartStock</h1>
      <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Inventory Management System</p>
    </div>

    <!-- Main Content -->
    <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 15px;">Confirm Your Account</h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Welcome to <strong>IGP SmartStock</strong>! You're almost ready to start managing your inventory and operations efficiently.
    </p>

    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
      Please click the button below to verify your email address and activate your account:
    </p>

    <!-- Confirmation Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; padding: 14px 32px; background-color: #FFD700; color: #000; 
                text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Confirm Your Email
      </a>
    </div>

    <!-- Alternative Link -->
    <p style="color: #6b7280; font-size: 14px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="color: #3b82f6; font-size: 13px; word-break: break-all;">
      <a href="{{ .ConfirmationURL }}" style="color: #3b82f6;">{{ .ConfirmationURL }}</a>
    </p>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.5;">
        <strong>Note:</strong> This link will expire in 24 hours. If you didn't create an account with IGP SmartStock, you can safely ignore this email.
      </p>
    </div>

  </div>

  <!-- Security Notice -->
  <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 20px;">
    This is an automated message from IGP SmartStock. Please do not reply to this email.
  </p>
</div>
```

## 📝 Step 3: Save the Template

1. After pasting your custom template, click **Save** at the bottom of the page
2. The changes will take effect immediately

## ✅ Step 4: Test the Email

### Enable Email Confirmations (if not already enabled)

1. Go to **Authentication** → **Providers** → **Email**
2. Enable **Confirm email** toggle
3. Click **Save**

### Test Registration

1. Go to your Registration page: `Registration.html`
2. Create a test account with a valid email
3. Check your inbox for the confirmation email with the new design

## 🎨 Customization Options

### Available Variables in Email Templates:

- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .Token }}` - The confirmation token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address
- `{{ .Data }}` - User metadata (like full_name)
- `{{ .RedirectTo }}` - Redirect URL after confirmation

### Example: Include User's Name

```html
<p>Hi {{ .Data.full_name }},</p>
<p>Welcome to IGP SmartStock!</p>
```

## 🔧 Email Provider Configuration

### Using SMTP (Recommended for Production)

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Enable Custom SMTP**
3. Enter your SMTP credentials:
   - **Host**: smtp.gmail.com (for Gmail)
   - **Port**: 587
   - **Username**: your-email@gmail.com
   - **Password**: Your app-specific password
   - **Sender email**: noreply@yourdomain.com
   - **Sender name**: IGP SmartStock

### Gmail App Password Setup

If using Gmail:
1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Use this password in Supabase SMTP settings

## 📋 Additional Email Templates to Customize

You can also customize these templates:

1. **Invite User** - When inviting team members
2. **Reset Password** - Password reset emails
3. **Change Email Address** - Email change confirmation
4. **Magic Link** - Passwordless login emails

## 🔒 Security Best Practices

1. ✅ Always use HTTPS for confirmation URLs
2. ✅ Set appropriate token expiration (24 hours recommended)
3. ✅ Use custom SMTP for production (not Supabase default)
4. ✅ Add SPF and DKIM records to your domain
5. ✅ Test emails in spam checkers before going live

## 🎯 Current Implementation Features

Your registration system now includes:

✅ Email confirmation requirement before login  
✅ Toast notification with Gmail link after registration  
✅ Email verification check on login  
✅ Resend confirmation link option  
✅ Custom error messages for unverified accounts  

## 📞 Support

If you need help with email setup:
- Supabase Docs: https://supabase.com/docs/guides/auth/auth-email
- SMTP Testing: https://www.mail-tester.com/

---

**Last Updated**: December 1, 2025  
**System**: IGP SmartStock - Inventory Management System
