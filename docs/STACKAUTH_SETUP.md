# StackAuth Integration Setup

This document outlines the StackAuth integration for Varsity Nest, which replaces the custom authentication system while maintaining the existing custom UI.

## 🔑 Required Environment Variables

Add these to your `.env.local` file:

```bash
# StackAuth Configuration
STACK_PROJECT_ID=your_stack_project_id_here
STACK_SECRET=your_stack_secret_here

# Existing variables (keep these)
NEXTAUTH_SECRET=your_existing_secret
PAYFAST_MERCHANT_ID=your_payfast_merchant_id
PAYFAST_MERCHANT_KEY=your_payfast_merchant_key
PAYFAST_PASSPHRASE=your_payfast_passphrase
NEXT_PUBLIC_APP_URL=your_app_url
NEXT_PUBLIC_PAYFAST_MERCHANT_ID=your_payfast_merchant_id
NEXT_PUBLIC_PAYFAST_MERCHANT_KEY=your_payfast_merchant_key
```

## 🚀 What StackAuth Provides

### **Authentication Features:**
- ✅ **JWT-based sessions** with automatic token management
- ✅ **Secure cookie handling** with httpOnly and secure flags
- ✅ **Automatic session validation** and refresh
- ✅ **Built-in CSRF protection**
- ✅ **Type-safe authentication** with TypeScript

### **Integration Benefits:**
- ✅ **Maintains existing UI** - No visual changes required
- ✅ **Uses existing database** - Same user tables and logic
- ✅ **Seamless migration** - Gradual transition possible
- ✅ **Enhanced security** - Industry-standard authentication patterns

## 🔧 Implementation Details

### **1. StackAuth Configuration (Hosted)**
- `lib/stack.ts`: creates Stack client/server app instances
- `app/handler/[...stack]/page.tsx`: Stack handler for cookies, callbacks, email links
- `app/layout.tsx`: wraps app with `StackProvider` using the app instance

### **2. Custom Credentials Provider (`lib/credentials-provider.ts`)**
- Integrates with existing `authenticateUser` function
- Maintains current password hashing and validation
- Preserves user role and permission system

### **3. React Hook (`hooks/useStackAuth.ts`)**
- Provides authentication state and functions
- Handles login, logout, and registration
- Manages user sessions and redirects

### **4. Routes & Flows**
- `/handler/*` - StackAuth hosted routes (OAuth callbacks, verification, reset, sign-out)
- Google SSO enabled via SDK `OAuthButton` on login page
- Email verification and password reset handled via `/handler/*` links

## 🎯 Migration Benefits

### **Before (Custom Auth):**
- Manual JWT handling
- Custom session management
- Manual cookie operations
- Basic security features

### **After (StackAuth):**
- Automatic JWT management
- Built-in session handling
- Secure cookie operations
- Advanced security features
- Better error handling
- Automatic token refresh

## 🧪 Testing the Integration

### **1. Test Login Flow:**
```bash
# Navigate to login page
# Enter valid credentials
# Should redirect to appropriate dashboard
# Check browser cookies for session
```

### **2. Test Session Persistence:**
```bash
# Login successfully
# Refresh the page
# Session should persist
# User menu should show logged-in state
```

### **3. Test Logout:**
```bash
# Click logout button
# Should clear session
# Redirect to home page
# User menu should show login buttons
```

## 🚨 Troubleshooting

### **Common Issues:**

1. **"STACK_PROJECT_ID is required"**
   - Ensure `STACK_PROJECT_ID` is set in `.env.local`
   - Check for typos in environment variable names

2. **"STACK_SECRET is required"**
   - Ensure `STACK_SECRET` is set in `.env.local`
   - Generate a strong secret if needed

3. **Session not persisting**
   - Check browser cookies
   - Verify domain and path settings
   - Check for HTTPS requirements in production

4. **Login redirects to error page**
   - Check credentials provider configuration
   - Verify database connection
   - Check user table structure

### **Debug Steps:**
1. Check browser console for errors
2. Verify environment variables are loaded
3. Check API route responses
4. Verify database queries are working

## 🔄 Next Steps

### **Phase 1 (Current):**
- ✅ Hosted StackAuth integrated with handler and provider
- ✅ Google SSO wired
- ✅ Email verification and password reset via Resend
- ✅ Custom UI preserved

### **Phase 2 (Future):**
- [ ] Add social login providers (Google, Facebook)
- [ ] Implement password reset functionality
- [ ] Add email verification
- [ ] Enhanced security features

### **Phase 3 (Advanced):**
- [ ] Multi-factor authentication
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Advanced session management

## 📚 Resources

- [StackAuth Documentation](https://docs.stack-auth.com)
- Handler signup: `http://localhost:3000/handler/signup`
- Handler account settings: `http://localhost:3000/handler/account-settings`
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [JWT Best Practices](https://jwt.io/introduction)
- [Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)

## 📝 Production TODO
- Update StackAuth allowed origins and Google OAuth redirect URIs to `https://www.varsitynest.space`
