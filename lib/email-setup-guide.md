# 🔥 Real Email Setup Guide

## Option 1: Resend (Recommended - Easy & Reliable)

### 1. Install Resend
\`\`\`bash
npm install resend
\`\`\`

### 2. Get API Key
- Go to https://resend.com
- Sign up and verify your domain
- Get your API key

### 3. Add Environment Variable
\`\`\`env
RESEND_API_KEY=re_your_api_key_here
\`\`\`

### 4. Update the API route
Uncomment the Resend code in `/app/api/send-otp/route.ts`

---

## Option 2: Nodemailer (More Control)

### 1. Install Nodemailer
\`\`\`bash
npm install nodemailer @types/nodemailer
\`\`\`

### 2. Environment Variables
\`\`\`env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
\`\`\`

### 3. Implementation
\`\`\`typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

await transporter.sendMail({
  from: process.env.SMTP_USER,
  to: email,
  subject: 'Your OTP Code',
  html: emailTemplate,
})
\`\`\`

---

## Option 3: SendGrid

### 1. Install SendGrid
\`\`\`bash
npm install @sendgrid/mail
\`\`\`

### 2. Environment Variable
\`\`\`env
SENDGRID_API_KEY=your_sendgrid_api_key
\`\`\`

### 3. Implementation
\`\`\`typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

await sgMail.send({
  to: email,
  from: 'noreply@yourdomain.com',
  subject: 'Your OTP Code',
  html: emailTemplate,
})
\`\`\`

---

## 🚀 Quick Start (Resend)

1. `npm install resend`
2. Add `RESEND_API_KEY=re_xxx` to `.env.local`
3. Uncomment Resend code in API route
4. Update `sendOTP` to use `sendRealOTP`

That's it! Real emails will be sent! 📧
\`\`\`

To switch to real emails, you just need to:
