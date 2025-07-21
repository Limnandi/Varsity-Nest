# 🔥 Complete Email Setup Guide

## 🚀 OPTION 1: Resend (RECOMMENDED - Easiest!)

### Step 1: Sign Up
1. Go to https://resend.com
2. Click "Get Started" 
3. Sign up with your email
4. Verify your email address

### Step 2: Get Your API Key
1. After login, go to "API Keys" in sidebar
2. Click "Create API Key"
3. Name it "Bloemfontein Stays"
4. Copy the key (starts with `re_`)

### Step 3: Add to Your Project
\`\`\`env
RESEND_API_KEY=re_your_key_here_123abc
\`\`\`

### Step 4: Verify Domain (Optional but Recommended)
1. Go to "Domains" in Resend dashboard
2. Add your domain (e.g., yourdomain.com)
3. Add DNS records they provide
4. Wait for verification

**Cost:** FREE for 3,000 emails/month, then $20/month
**Delivery Time:** 1-5 seconds
**Reliability:** 99.9%

---

## 📧 OPTION 2: Gmail SMTP (Free but Limited)

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com
2. Security → 2-Step Verification
3. Turn it ON

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Bloemfontein Stays"
4. Copy the 16-character password

### Step 3: Add to Your Project
\`\`\`env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_16_char_app_password
\`\`\`

**Cost:** FREE (500 emails/day limit)
**Delivery Time:** 5-30 seconds
**Reliability:** 95%

---

## ⚡ OPTION 3: SendGrid (Enterprise Grade)

### Step 1: Sign Up
1. Go to https://sendgrid.com
2. Click "Start for Free"
3. Complete signup process
4. Verify your email

### Step 2: Create API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Choose "Restricted Access"
4. Enable "Mail Send" permissions
5. Copy the key (starts with `SG.`)

### Step 3: Add to Your Project
\`\`\`env
SENDGRID_API_KEY=SG.your_key_here_123abc
\`\`\`

### Step 4: Verify Sender Identity
1. Go to Settings → Sender Authentication
2. Add your email as verified sender
3. Check email and click verify link

**Cost:** FREE for 100 emails/day, then $15/month
**Delivery Time:** 1-3 seconds
**Reliability:** 99.95%

---

## 🎯 QUICK RECOMMENDATION

**For Testing/Small Scale:** Use Gmail SMTP (Free)
**For Production/Business:** Use Resend (Best balance)
**For Enterprise:** Use SendGrid (Most features)

---

## 🔧 Implementation Steps

### 1. Choose Your Service (I recommend Resend)

### 2. Get Credentials (follow guide above)

### 3. Add Environment Variables
Create `.env.local` in your project root:
\`\`\`env
# For Resend (RECOMMENDED)
RESEND_API_KEY=re_your_actual_key_here

# OR for Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_app_password

# OR for SendGrid
SENDGRID_API_KEY=SG.your_actual_key_here
\`\`\`

### 4. Install Package
\`\`\`bash
# For Resend
npm install resend

# For Gmail/SMTP
npm install nodemailer @types/nodemailer

# For SendGrid
npm install @sendgrid/mail
\`\`\`

### 5. Update Code
Uncomment the email service code in `/app/api/send-otp/route.ts`

---

## 🚨 SECURITY TIPS

1. **Never commit .env files** - Add `.env.local` to `.gitignore`
2. **Use environment variables** - Never hardcode keys in code
3. **Rotate keys regularly** - Change API keys every few months
4. **Monitor usage** - Set up alerts for unusual activity

---

## 🧪 TESTING

### Demo Mode (Current)
- OTP shows in browser alert
- Perfect for development
- No setup required

### Real Email Mode
- OTP sent to actual email
- Production ready
- Requires setup above

---

## 💡 PRO TIPS

1. **Start with Resend** - Easiest setup, great docs
2. **Test with your own email first** - Make sure it works
3. **Set up domain verification** - Improves delivery rates
4. **Monitor bounce rates** - Keep them under 5%
5. **Use templates** - Consistent branding

---

## 🆘 TROUBLESHOOTING

### "Authentication failed"
- Check API key is correct
- Ensure no extra spaces
- Verify environment variable name

### "Domain not verified"
- Add DNS records provided by service
- Wait 24-48 hours for propagation
- Use default domain for testing

### "Rate limit exceeded"
- Check your plan limits
- Implement retry logic
- Consider upgrading plan

### "Emails going to spam"
- Verify your domain
- Set up SPF/DKIM records
- Avoid spammy words in subject

---

## 📞 NEED HELP?

1. **Resend Docs:** https://resend.com/docs
2. **Gmail SMTP Guide:** https://support.google.com/mail/answer/7126229
3. **SendGrid Docs:** https://docs.sendgrid.com

Ready to send real emails? Pick a service and follow the steps! 🚀
\`\`\`

Now let me update the API route to show you exactly how to implement each service:
