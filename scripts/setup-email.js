// Run this with: node scripts/setup-email.js
console.log(`
🔥 BLOEMFONTEIN STAYS - EMAIL SETUP GUIDE

Choose your email service:

1️⃣  RESEND (RECOMMENDED)
   ✅ Easiest setup
   ✅ Great documentation  
   ✅ 3,000 free emails/month
   ✅ Fast delivery (1-5 seconds)
   
   Steps:
   1. Go to https://resend.com
   2. Sign up and get API key
   3. Add RESEND_API_KEY=re_xxx to .env.local
   4. Run: npm install resend

2️⃣  GMAIL SMTP (FREE)
   ✅ Completely free
   ✅ 500 emails/day limit
   ⚠️  Slower delivery (5-30 seconds)
   ⚠️  More setup steps
   
   Steps:
   1. Enable 2FA on Gmail
   2. Generate App Password
   3. Add SMTP variables to .env.local
   4. Run: npm install nodemailer @types/nodemailer

3️⃣  SENDGRID (ENTERPRISE)
   ✅ Most reliable
   ✅ Advanced features
   ✅ 100 free emails/day
   💰 $15/month after free tier
   
   Steps:
   1. Go to https://sendgrid.com
   2. Sign up and get API key
   3. Add SENDGRID_API_KEY=SG.xxx to .env.local
   4. Run: npm install @sendgrid/mail

🚀 QUICK START (Resend):
1. Visit: https://resend.com
2. Sign up with your email
3. Go to "API Keys" → "Create API Key"
4. Copy the key (starts with 're_')
5. Add to .env.local: RESEND_API_KEY=re_your_key_here
6. Run: npm install resend
7. Restart your dev server

That's it! Your OTPs will be sent to real emails! 📧

Need help? Check the full guide in docs/email-setup-guide.md
`)
