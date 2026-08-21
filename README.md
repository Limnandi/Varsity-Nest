# Varsity Nest: Comprehensive Developer Guide

Varsity Nest is a production-ready Next.js 16 platform for student accommodation discovery and management. Designed for universities in South Africa (UFS and CUT), it enables students to find verified accommodations, make bookings, leave reviews, and manage wishlists. Providers can list properties with advanced analytics, and admins have comprehensive dashboards for platform oversight.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Key Features](#key-features)
3. [Project Structure](#project-structure)
4. [Environment Setup](#environment-setup)
5. [Installation & Quick Start](#installation--quick-start)
6. [API Documentation](#api-documentation)
7. [Feature Deep Dives](#feature-deep-dives)
8. [Authentication & Authorization](#authentication--authorization)
9. [Database Schema](#database-schema)
10. [Code Style & Conventions](#code-style--conventions)
11. [Deployment](#deployment)
12. [SEO & Discoverability](#seo--discoverability)
13. [Troubleshooting](#troubleshooting)

---

## Tech Stack

### Core Framework
- **Next.js 16:** React framework with App Router and Server Components
- **TypeScript:** Strict typing for type safety
- **React 19:** Latest UI library

### Database & ORM
- **PostgreSQL** via Neon: Serverless database
- **Drizzle ORM:** Type-safe query builder
- **Database-secure layer:** Parameterized queries and validation

### Authentication
- **StackFrame Stack:** Authentication and user management
- **Session management:** Server-side session resolution
- **Role-based access control:** Student, Provider, Admin

### UI & Styling
- **Tailwind CSS:** Utility-first CSS framework
- **shadcn/ui:** Accessible React components
- **Lucide React:** SVG icon library
- **Embla Carousel:** Image carousel library

### Data Management & Caching
- **Upstash Redis:** Serverless Redis (OTP, caching, rate limiting)
- **TanStack Query:** Client-side data fetching and caching

### File & Media Management
- **Cloudinary:** Image uploads, transformations, and optimization
- **next-cloudinary:** Cloudinary integration for Next.js

### Payment Processing
- **Paystack:** Payment gateway with recurring charges support
- **Card tokenization:** For recurring payments

### Email & Communication
- **Resend:** Email sending service
- **React Email:** Email templates

### Observability & Monitoring
- **Sentry:** Error tracking and monitoring
- **Vercel Analytics:** Performance metrics
- **Vercel Speed Insights:** Core Web Vitals monitoring
- **Winston:** Logging library

### Development Tools
- **pnpm:** Fast package manager
- **ESLint:** Code linting
- **TypeScript:** Static type checking
- **Playwright:** E2E testing
- **Vitest:** Unit testing
- **Zod:** Schema validation

---

## Key Features

### Student System
- **Authentication:** Stack-based login with email verification
- **Profile Management:** Academic info, emergency contacts, preferences
- **Profile Image Upload:** Cloudinary integration with cropping
- **Wishlist:** Save/unsave accommodations with persistent storage
- **Review System:** Rate accommodations (1-5 stars), leave comments
- **Settings:** Notification preferences, privacy controls, visibility settings
- **Booking History:** Track reservations and payment status
- **Dashboard:** Personalized student dashboard with stats

### Provider System
- **Accommodation Management:** Create, edit, delete listings
- **Advanced Analytics:** Revenue tracking, booking metrics, review stats
- **Booking Management:** View and manage student reservations
- **Review Insights:** Respond to student reviews
- **Featured Listings:** Promote accommodations
- **Revenue Reports:** Monthly and annual revenue tracking
- **Dashboard:** Provider-specific metrics and analytics

### Admin Dashboard
- **Platform Analytics:** Revenue, accommodations, providers, students
- **User Management:** Browse and manage all users
- **Provider Verification:** Approve/reject provider registrations
- **Report Moderation:** Handle user reports on listings
- **Accommodation Reports:** View and investigate problematic listings
- **Domain Management:** Configure domains and subdomains
- **System Settings:** Global platform configuration
- **Rating Sync:** Manual accommodation rating synchronization

### Accommodation Discovery
- **Advanced Search:** Search by name, location, price range
- **Filtering:** By university, accreditation status, amenities, price
- **Sorting:** By rating, reviews, distance, price
- **Detailed Listings:** Images, amenities, room types, availability
- **Ratings & Reviews:** Community-driven ratings display
- **Map Integration:** Geolocation-based discovery (latitude/longitude)
- **Wishlist Integration:** One-click save functionality
- **Share Functionality:** Social sharing of listings

### Booking System
- **Calendar-based Booking:** Select check-in and check-out dates
- **Real-time Availability:** Show available room types
- **Payment Integration:** Paystack payment processing
- **Booking Status:** pending, confirmed, cancelled, completed states
- **Payment Tracking:** Separate payment status per booking

### Review & Rating System
- **User Reviews:** Students rate accommodations (1-5 stars)
- **Rich Comments:** Text feedback on accommodation experience
- **Anonymous Option:** Optional anonymous reviews
- **Automatic Aggregation:** Rating and review count calculation
- **Moderation:** Admin controls for inappropriate reviews
- **Helpful Voting:** Mark reviews as helpful (future)

### Reporting System
- **Listing Reports:** Users can report inappropriate accommodations
- **Report Categories:** Fraud, spam, inappropriate content, other
- **Admin Workflow:** pending → investigating → resolved/dismissed
- **Rate Limiting:** Prevent spam report submissions

---

## Project Structure

### Root Level
```
.
├── app/                    # Next.js App Router
├── components/             # React components
├── hooks/                  # Custom React hooks
├── lib/                    # Core services and utilities
├── database/               # Database schema
├── scripts/                # Utility scripts
├── public/                 # Static assets
├── styles/                 # Global styles
├── types/                  # TypeScript type definitions
├── tests/                  # Unit test files
├── e2e/                    # End-to-end tests
├── .env.local              # Local environment variables (not committed)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── next.config.mjs         # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # This file
```

### `app/` Directory Structure
```
app/
├── api/                         # REST API routes
│   ├── accommodations/
│   │   ├── route.ts             # GET: Search accommodations
│   │   ├── [id]/
│   │   │   ├── route.ts         # GET: Single accommodation
│   │   │   ├── reviews/         # Review endpoints
│   │   │   └── report/          # Report listing endpoint
│   ├── admin/
│   │   ├── analytics/           # Analytics endpoints
│   │   ├── students/            # Student management
│   │   ├── providers/           # Provider management
│   │   └── listing-reports/     # Report moderation
│   ├── agent/                   # Agent/provider stats
│   ├── auth/
│   │   └── ensure-user/         # Create user after Stack auth
│   ├── student/
│   │   ├── profile/             # GET/POST student profile
│   │   ├── settings/            # GET/POST preferences
│   │   ├── profile-image/       # POST profile image upload
│   │   └── wishlist/            # Wishlist operations
│   ├── provider/
│   │   ├── stats/               # Provider statistics
│   │   └── accommodations/      # Provider's accommodations
│   ├── paystack/
│   │   └── webhook/             # Webhook handler
│   ├── reviews/                 # Review management
│   ├── cloudinary/              # Cloudinary operations
│   ├── contact/                 # Contact form
│   ├── health/                  # Health check
│   └── docs/                    # API documentation
├── accommodations/              # Public browse pages
├── listing/[id]/
│   └── page.tsx                 # Listing detail page
├── student/                     # Student dashboard routes
│   ├── dashboard/
│   ├── profile/
│   ├── settings/
│   └── wishlist/
├── provider/                    # Provider dashboard
├── admin/                       # Admin dashboard
│   ├── dashboard/
│   ├── analytics/
│   ├── providers/
│   ├── students/
│   ├── reports/
│   ├── listing-reports/
│   └── settings/
├── auth/                        # Auth pages
├── handler/[...stack]/          # Stack authentication handler
├── layout.tsx                   # Root layout
├── page.tsx                     # Home page
└── [pages]/                     # Other public pages (terms, privacy, etc)
```

### `lib/` Directory Structure
```
lib/
├── database.ts                  # Raw SQL queries via Neon
├── database-secure.ts           # Secure DB wrapper with validation
├── database-optimized.ts        # Performance optimizations and caching
├── database-migration.ts        # Migration utilities
├── schema.ts                    # Drizzle ORM schema definitions
├── stackauth.ts                 # Stack authentication helpers
├── stack.ts                     # Stack client initialization
├── paystack.ts                  # Paystack integration
├── paystack-api-client.ts       # Paystack API client wrapper
├── cloudinary.ts                # Cloudinary utilities
├── redis.ts                     # Upstash Redis client
├── email.ts                     # Email service
├── email-utils.ts               # Email template utilities
├── otp.ts                       # OTP generation and storage
├── auth-middleware.ts           # Authentication checks
├── auth-constants.ts            # Auth constants and paths
├── validation-middleware.ts     # Request validation
├── error-handler.ts             # Error handling utilities
├── sentry.ts                    # Sentry initialization
├── cache.ts                     # Caching layer
├── admin.ts                     # Admin operations
├── payments.ts                  # Payment helpers
├── analytics.ts                 # Analytics tracking
├── api-documentation.ts         # API docs generation
├── api-middleware.ts            # API middleware
├── api-versioning.ts            # API version management
├── api-error-response.ts        # Standardized error responses
├── domain-validation.ts         # Domain validation
├── password-strength.ts         # Password validation
├── recaptcha.ts                 # reCAPTCHA verification
├── security-config.ts           # Security configuration
├── env.ts                       # Server-side env validation
├── env.client.ts                # Client-side env validation
├── types.ts                     # TypeScript types
├── definitions.ts               # Constant definitions
├── utils.ts                     # General utilities
├── wishlist-utils.ts            # Wishlist utilities
├── wishlist-status-batcher.ts   # Batch wishlist status checks
├── subscription-plans.ts        # Subscription plan definitions
├── subscription.ts              # Subscription management
├── repos/
│   ├── accommodations.ts        # Accommodation queries
│   └── ...
├── services/                    # Business logic services
├── actions/                     # Server actions
├── types/                       # Type definitions
├── schemas/                     # Zod validation schemas
├── middleware/                  # Request middleware
├── monitoring/                  # Monitoring utilities
├── logging/                     # Logging utilities
├── errors/                      # Error definitions
├── cache/                       # Cache implementations
└── security/                    # Security utilities
```

### `components/` Directory Structure
```
components/
├── AccommodationCard.tsx        # Listing card component
├── OptimizedAccommodationCard.tsx # Virtualized card version
├── AdvancedFilters.tsx          # Search filters component
├── AuthGuard.tsx                # Auth protection wrapper
├── BookingCalendar.tsx          # Date picker for bookings
├── ConfirmDialog.tsx            # Confirmation dialog
├── ContactAgent.tsx             # Contact agent form
├── CustomImageCrop.tsx          # Image cropping component
├── DashboardLayout.tsx          # Dashboard layout
├── DocumentViewer.tsx           # Document viewing
├── EmailVerificationModal.tsx   # Email verification
├── ErrorBoundary.tsx            # Error boundary
├── FloatingActionButton.tsx     # FAB component
├── Footer.tsx                   # Footer component
├── ForgotPasswordModal.tsx      # Password reset modal
├── GoogleAnalytics.tsx          # GA integration
├── HeroSection.tsx              # Hero banner
├── ImageCarousel.tsx            # Multi-image carousel
├── Layout.tsx                   # Layout wrapper
├── ListingQuickActions.tsx      # Quick action buttons
├── ListingReportModal.tsx       # Report listing modal
├── LoadingSpinner.tsx           # Loading indicator
├── Navbar.tsx                   # Navigation bar
├── OptimizedImage.tsx           # Optimized image component
├── PasswordStrengthIndicator.tsx # Password strength meter
├── PaystackPaymentForm.tsx      # Payment form
├── PlanSelectionModal.tsx       # Plan selection
├── ProfileImageUpload.tsx       # Profile image uploader
├── ReviewCard.tsx               # Review display card
├── ReviewForm.tsx               # Review submission form
├── ReviewsModal.tsx             # Reviews modal
├── ReviewsSection.tsx           # Reviews collection
├── RoomTypeCard.tsx             # Room type display
├── RoomTypesSection.tsx         # Room types collection
├── SearchBar.tsx                # Search component
├── ShareSection.tsx             # Share buttons
├── SkeletonCard.tsx             # Loading skeleton
├── StudentAuthModal.tsx         # Student auth modal
├── StudentAuthProvider.tsx      # Auth context provider
├── StudentAuthSection.tsx       # Student auth UI
├── StudentDetailsModal.tsx      # Student details form
├── StudentProfileDropdown.tsx   # Profile dropdown menu
├── SubscriptionModal.tsx        # Subscription selection
├── TabFilter.tsx                # Tab-based filters
├── TestimonialsSection.tsx      # Testimonials display
├── TrustedBy.tsx                # Trusted by section
├── VirtualizedAccommodationList.tsx # Virtualized list
├── WishlistButton.tsx           # Heart/wishlist button
├── theme-provider.tsx           # Theme context
├── ui/                          # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── calendar.tsx
│   ├── accordion.tsx
│   └── ...
└── ...
```

### `database/` Directory
```
database/
└── schema.sql               # Complete PostgreSQL schema
                             # Tables, indexes, triggers
```

**Key Tables:**
- `users`: User accounts (email, role, verification status)
- `students`: Student profiles (student number, university, emergency contacts)
- `providers`: Provider information (business details, verification)
- `accommodations`: Accommodation listings (details, pricing, images, amenities)
- `bookings`: Reservations (dates, payment status)
- `reviews`: Ratings and reviews
- `student_wishlist`: Saved accommodations
- `student_preferences`: Notification and privacy settings
- `listing_reports`: Reports on inappropriate listings
- `payments`: Payment records
- `reports`: General user reports
- `webhook_events`: Webhook idempotency tracking

---

## Environment Setup

### Required Services & Accounts

Before starting, you need accounts and credentials from:

1. **Neon:** Database hosting
2. **Upstash:** Redis for caching
3. **Cloudinary:** Image management
4. **Paystack:** Payment processing
5. **StackFrame Stack:** Authentication
6. **Resend:** Email sending
7. **Google reCAPTCHA:** Spam protection
8. **Sentry:** Error tracking
9. **Vercel:** Deployment (optional but recommended)

### Create `.env.local` File

```bash
# Copy template
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

### Environment Variables Reference

#### Database & Caching
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=ABCDxyz...
```

#### Authentication (StackFrame Stack)
```env
STACK_SECRET_SERVER_KEY=xxx
NEXT_PUBLIC_STACK_PROJECT_ID=yyy
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=zzz
```

#### Cloudinary
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abcdef...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=123456789
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=student_profile_unsigned
```

#### Paystack
```env
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PUBLIC_KEY=pk_live_yyy
```

#### Email (Resend)
```env
RESEND_API_KEY=re_xxx
CONTACT_RECIPIENT_EMAIL=support@varsitynest.space
```

Contact form submissions are delivered to `CONTACT_RECIPIENT_EMAIL` (defaults to `support@varsitynest.space` if unset). **Never hardcode personal emails in source code.**

#### Security
```env
RECAPTCHA_SECRET_KEY=xxx
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=yyy
SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/123456
GOOGLE_SITE_VERIFICATION=optional_google_search_console_token
BING_SITE_VERIFICATION=optional_bing_webmaster_token
```

#### Application
```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,https://varsitynest.space
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Installation & Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Limnandi/Varsity-Nest.git
cd varsity-nest
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 4. Set Up Database
```bash
# Create tables and indexes
pnpm db:migrate

```

### 5. Start Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Common Development Commands

```bash
# Type checking
pnpm exec tsc --noEmit

# Linting
pnpm lint

# Run tests
pnpm test
pnpm test:watch
pnpm test:coverage

# E2E tests
pnpm e2e
pnpm e2e:report

# Build for production
pnpm build

# Start production server
pnpm start

# Database maintenance
pnpm db:maintenance
pnpm db:optimize
```

---

## API Documentation

### Base URL
```
Development: http://localhost:3000/api
Production: https://www.varsitynest.space/api
```

### Authentication

Include authentication token in request headers:
```
Authorization: Bearer <token>
```

Token is automatically managed by StackFrame Stack.

### Response Format

Success response:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error response:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error description",
  "status": 400
}
```

### Student Endpoints

#### GET `/api/student/profile`
Retrieve authenticated student's profile.

**Auth:** Required (student)

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "studentNumber": "2024001",
  "university": "UFS",
  "yearOfStudy": 2,
  "course": "Computer Science",
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "+27123456789",
  "user": {
    "email": "student@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+27987654321",
    "profileImageUrl": "https://res.cloudinary.com/...",
    "emailVerified": true
  }
}
```

#### GET `/api/student/settings`
Get student notification and privacy preferences.

**Auth:** Required (student)

**Response:**
```json
{
  "id": "uuid",
  "emailNotifications": true,
  "smsNotifications": false,
  "marketingEmails": true,
  "profileVisibility": "public",
  "showPhoneNumber": false,
  "showStudentNumber": false,
  "showEmail": false,
  "twoFactorAuth": true
}
```

#### POST `/api/student/settings`
Update student preferences.

**Request:**
```json
{
  "emailNotifications": true,
  "marketingEmails": false,
  "profileVisibility": "private",
  "twoFactorAuth": true
}
```

#### POST `/api/student/profile-image`
Upload profile image to Cloudinary.

**Request:** Form data with `file` field

**Response:**
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/xxx/image/upload/...",
  "publicId": "student-profiles/uuid"
}
```

#### GET `/api/student/wishlist?search=&status=accredited&accommodationId=`
Get student's wishlist with filters.

**Query Parameters:**
- `search`: Search by accommodation name or address
- `status`: Filter by accreditation (accredited, provisionally_accredited, non_accredited)
- `accommodationId`: Get specific accommodation from wishlist
- `page`: Pagination (default: 1)
- `limit`: Results per page (default: 20)

**Response:**
```json
{
  "wishlist": [
    {
      "id": "uuid",
      "accommodationId": "uuid",
      "addedAt": "2024-01-15T10:30:00Z",
      "accommodation": {
        "id": "uuid",
        "name": "Student Haven",
        "address": "123 Campus St",
        "price": 2500,
        "images": [...],
        "rating": 4.5,
        "reviewCount": 12,
        "accreditationStatus": "accredited"
      }
    }
  ],
  "total": 15,
  "page": 1
}
```

#### POST `/api/student/wishlist`
Add accommodation to wishlist.

**Request:**
```json
{
  "accommodationId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "id": "uuid",
  "accommodationId": "uuid"
}
```

#### DELETE `/api/student/wishlist/:accommodationId`
Remove from wishlist.

**Response:**
```json
{
  "success": true,
  "message": "Removed from wishlist"
}
```

### Accommodation Endpoints

#### GET `/api/accommodations`
Search accommodations with filters.

**Query Parameters:**
```
search=query
university=UFS
minPrice=1000
maxPrice=5000
amenities=wifi,laundry,parking
accreditation=accredited
featured=true
page=1
limit=20
sort=rating|price|distance
```

**Response:**
```json
{
  "accommodations": [
    {
      "id": "uuid",
      "name": "Student Haven",
      "address": "123 Campus St",
      "price": 2500,
      "rating": 4.5,
      "reviewCount": 12,
      "images": [...],
      "amenities": ["WiFi", "Laundry"],
      "accreditationStatus": "accredited"
    }
  ],
  "total": 245,
  "page": 1,
  "totalPages": 13
}
```

#### GET `/api/accommodations/:id`
Get single accommodation details.

**Response:**
```json
{
  "id": "uuid",
  "name": "Student Haven",
  "description": "Modern student accommodation...",
  "address": "123 Campus St, Bloemfontein",
  "price": 2500,
  "images": [
    {
      "url": "https://res.cloudinary.com/...",
      "alt": "Front view"
    }
  ],
  "amenities": ["WiFi", "Laundry", "Parking", "Security"],
  "roomTypes": [
    {
      "type": "single",
      "price": 2500,
      "available": 3
    },
    {
      "type": "double",
      "price": 3500,
      "available": 2
    }
  ],
  "rating": 4.5,
  "reviewCount": 12,
  "providerId": "uuid",
  "providerName": "ABC Properties",
  "providerPhone": "+27123456789",
  "providerEmail": "contact@abc.co.za",
  "accreditationStatus": "accredited",
  "latitude": -28.2344,
  "longitude": 25.9267,
  "maxOccupancy": 2,
  "availableFrom": "2024-01-15",
  "availableUntil": "2024-12-31"
}
```

#### GET `/api/accommodations/:id/reviews`
Get reviews for an accommodation.

**Query Parameters:**
```
page=1
limit=10
sort=recent|helpful|rating
```

**Response:**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "accommodationId": "uuid",
      "rating": 5,
      "title": "Excellent accommodation!",
      "comment": "Very clean and safe...",
      "reviewer": "J. Doe",
      "isAnonymous": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "helpful": 3
    }
  ],
  "total": 12,
  "page": 1,
  "averageRating": 4.5
}
```

#### POST `/api/accommodations/:id/reviews`
Submit a review.

**Auth:** Required (student)

**Request:**
```json
{
  "rating": 5,
  "title": "Great place!",
  "comment": "Clean, safe, and well-located...",
  "isAnonymous": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "rating": 5,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### POST `/api/accommodations/:id/report`
Report an inappropriate listing.

**Request:**
```json
{
  "reason": "inappropriate_content|fraud|spam|other",
  "description": "The listing contains misleading information...",
  "reporterName": "John Doe",
  "reporterEmail": "user@example.com",
  "reporterPhone": "+27123456789"
}
```

**Response:**
```json
{
  "success": true,
  "reportId": "uuid",
  "message": "Report submitted successfully"
}
```

### Provider Endpoints

#### GET `/api/provider/stats`
Get provider dashboard statistics.

**Auth:** Required (provider)

**Response:**
```json
{
  "stats": {
    "totalAccommodations": 5,
    "activeAccommodations": 4,
    "averageRating": 4.3,
    "featuredCount": 2,
    "totalBookings": 32,
    "activeBookings": 8,
    "pendingBookings": 3,
    "totalRevenue": 125000.50,
    "totalReviews": 24,
    "averageReviewRating": 4.25
  }
}
```

#### GET `/api/provider/accommodations`
Get provider's accommodations.

**Auth:** Required (provider)

**Query Parameters:**
```
page=1
limit=20
sort=name|price|rating|created
```

#### POST `/api/provider/accommodations`
Create new accommodation.

**Auth:** Required (provider)

**Request:**
```json
{
  "name": "Student Haven",
  "description": "Modern student accommodation...",
  "address": "123 Campus St",
  "price": 2500,
  "amenities": ["WiFi", "Laundry"],
  "roomTypes": [
    {
      "type": "single",
      "price": 2500,
      "available": 5
    }
  ],
  "images": [
    {
      "url": "https://res.cloudinary.com/...",
      "alt": "Front view"
    }
  ]
}
```

### Admin Endpoints

#### GET `/api/admin/analytics/overview`
Get platform-wide analytics.

**Auth:** Required (admin)

**Response:**
```json
{
  "revenue": {
    "total": 1500000,
    "thisMonth": 125000,
    "lastMonth": 110000,
    "growth": 13.6
  },
  "accommodations": {
    "total": 450,
    "active": 380,
    "pending": 70,
    "growth": 8
  },
  "providers": {
    "total": 120,
    "active": 95
  },
  "students": {
    "total": 5200,
    "activeThisMonth": 1800
  },
  "bookings": {
    "total": 8500,
    "thisMonth": 750,
    "lastMonth": 680
  }
}
```

#### GET `/api/admin/students`
List all students.

**Auth:** Required (admin)

**Query Parameters:**
```
search=name/email
university=UFS
page=1
limit=50
```

#### GET `/api/admin/providers`
List all providers.

**Auth:** Required (admin)

#### GET `/api/admin/listing-reports`
Get accommodation reports.

**Auth:** Required (admin)

**Query Parameters:**
```
status=pending|investigating|resolved|dismissed
page=1
limit=50
```

**Response:**
```json
{
  "reports": [
    {
      "id": "uuid",
      "accommodationId": "uuid",
      "accommodation": {
        "name": "Student Haven",
        "address": "123 Campus St"
      },
      "reason": "inappropriate_content",
      "description": "...",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00Z",
      "reportCount": 3
    }
  ],
  "total": 25,
  "page": 1
}
```

#### PATCH `/api/admin/listing-reports/:id`
Update report status.

**Auth:** Required (admin)

**Request:**
```json
{
  "status": "investigating|resolved|dismissed",
  "notes": "Verified as spam listing"
}
```

#### POST `/api/admin/sync-ratings`
Sync accommodation ratings.

**Auth:** Required (admin)

---

## Feature Deep Dives

### Student Profile & Image Upload

The student profile system integrates image management with Cloudinary:

**Flow:**
1. Student uploads image via `components/ProfileImageUpload.tsx`
2. Client-side cropping with `react-easy-crop`
3. Direct upload to Cloudinary (no server proxy)
4. Image metadata stored in database
5. Profile image displayed with fallback to initials

**Database Fields:**
- `profile_image_url`: Cloudinary CDN URL
- `profile_image_cloudinary_id`: Public ID for updates/deletion

**Key Files:**
- `components/ProfileImageUpload.tsx`: Upload UI
- `app/api/student/profile-image`: Upload handler
- `lib/cloudinary.ts`: Cloudinary utilities

### Wishlist System

Students can save and manage favorite accommodations:

**Features:**
- Heart button on accommodation cards
- Dedicated wishlist page with search/filter
- Batch status checks for better performance
- Persistent storage in `student_wishlist` table
- Optional filtering by accreditation status

**Key Files:**
- `components/WishlistButton.tsx`: Heart button component
- `app/student/wishlist/`: Wishlist page
- `app/api/student/wishlist/`: Wishlist API
- `lib/wishlist-status-batcher.ts`: Batch status checking

### Review & Rating System

Students can review and rate accommodations:

**Features:**
- 1-5 star ratings with comments
- Optional anonymous reviews
- Single review per student per accommodation
- Automatic rating aggregation
- Admin sync for ratings

**Database:**
- `reviews` table with triggers for auto-aggregation
- Accommodation `rating` and `review_count` auto-updated

**Key Files:**
- `components/ReviewForm.tsx`: Review submission
- `components/ReviewCard.tsx`: Review display
- `app/api/accommodations/[id]/reviews/`: Review endpoints

### Cloudinary Integration

Comprehensive image management:

**Setup:**
1. Create unsigned upload preset in Cloudinary console
2. Set preset to "Unsigned" signing mode
3. Add environment variables

**Features:**
- Direct client-side uploads
- Automatic format conversion (WebP)
- Quality optimization
- Responsive image delivery
- Security tags and access control

**Key Files:**
- `lib/cloudinary.ts`: Cloudinary facade
- `components/OptimizedImage.tsx`: Image display
- `components/ProfileImageUpload.tsx`: Image upload

### Paystack Payment Integration

Production payment processing:

**Flow:**
1. Student initiates payment
2. First payment: Minimum ZAR 1 charge for card tokenization
3. Card stored on success (with 2FA in South Africa)
4. Webhook notification on payment completion
5. Booking status updated based on payment status

**Key Files:**
- `lib/paystack.ts`: Paystack helpers
- `lib/paystack-api-client.ts`: API wrapper
- `app/api/paystack/webhook/`: Webhook handler

### Admin Dashboard

Platform management interface:

**Features:**
- Revenue and accommodation analytics
- User and provider management
- Listing report moderation workflow
- Domain configuration
- Rating synchronization

**Key Files:**
- `app/admin/analytics/`: Analytics pages
- `app/api/admin/`: Admin endpoints
- `lib/admin.ts`: Admin operations

---

## Authentication & Authorization

### StackFrame Stack Setup

**Initialize Clients:**
```typescript
// lib/stack.ts
const serverApp = getStackServerApp()  // Server operations
const clientApp = getStackClientApp()  // Browser client
```

**Session Resolution:**
```typescript
// lib/stackauth.ts
const session = await getSession()    // Current user session
const user = await getCurrentUser()   // Authenticated user
```

**Protected Routes:**
```typescript
// In API routes
const user = await getCurrentUser()
if (!user || user.role !== 'student') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

### Role-Based Access Control

| Role | Capabilities |
|------|-------------|
| **Student** | Browse accommodations, reviews, wishlist, profile management, booking |
| **Provider** | Accommodation management, bookings, analytics, reviews |
| **Admin** | Platform analytics, user management, report moderation, settings |

---

## Database Schema

### Key Tables

**users**
- Central identity table
- Fields: id, email, password_hash, first_name, last_name, role, phone, profile_image_url, email_verified, created_at

**students**
- Student profile extension
- Fields: id, user_id (FK), student_number, university, year_of_study, course, emergency_contact_name/phone
- Unique constraint: (student_number, university)

**accommodations**
- Property listings
- Fields: id, provider_id, name, description, address, price, images (JSONB), amenities, room_types, rating, review_count, accreditation_status, is_active, featured, created_at

**student_wishlist**
- Saved accommodations
- Fields: id, student_id (FK), accommodation_id (FK), created_at
- Unique constraint: (student_id, accommodation_id)

**reviews**
- Ratings and comments
- Fields: id, student_id, accommodation_id, rating, title, comment, is_anonymous, created_at
- Constraint: One review per student per accommodation

**bookings**
- Reservations and payments
- Fields: id, student_id, accommodation_id, check_in_date, check_out_date, total_amount, status, payment_status, created_at

**listing_reports**
- User reports on listings
- Fields: id, accommodation_id, user_id, reason, description, status, created_at

### Indexes & Performance

Key indexes for query performance:
- `users` → (email, role)
- `students` → (university, user_id)
- `accommodations` → (provider_id, accreditation_status, is_active, created_at)
- `student_wishlist` → (student_id, accommodation_id, created_at)
- `reviews` → (accommodation_id, rating)
- `bookings` → (student_id, accommodation_id, status)
- `listing_reports` → (accommodation_id, status, created_at)

### Database Triggers

Auto-update triggers:
- `reviews` → Update accommodation `rating` and `review_count` on insert/update/delete
- `student_profile_audit` → Track profile changes
- Auto-timestamp triggers → Update `updated_at` on row changes

---

## Code Style & Conventions

### TypeScript
```typescript
// Strict typing - avoid any
const getUser = (id: string): Promise<User | null> => { ... }

// Guard clauses - early returns
if (!userId) return null
if (user.role !== 'student') throw new Forbidden()

// Explicit error types
type Result = Success<Data> | Error<Errors>
```

### React Components
```typescript
// Server components by default
// Use 'use client' only for interactivity

// Props typing
interface AccommodationCardProps {
  accommodation: Accommodation
  isWishlisted?: boolean
  onWishlistChange?: (isWishlisted: boolean) => void
}

// Keep components small and focused
export function AccommodationCard(props: AccommodationCardProps) {
  // Implementation
}
```

### API Routes
```typescript
// Type-safe request/response
export async function POST(req: NextRequest) {
  const body = await req.json()
  const validated = RequestSchema.parse(body)
  
  const user = await getCurrentUser()
  if (!user) return unauthorized()
  
  return NextResponse.json({ success: true, data })
}
```

### Comments
```typescript
// One-line past-tense comments only
// Calculated average rating from all reviews

// Avoid inline comments - use clear naming
const isOwnerOrAdmin = userRole === 'admin' || userRole === 'provider'
```

---

## Deployment

### Vercel Deployment

**1. Connect Repository**
- Link GitHub repo to Vercel
- Auto-deploy on push to main

**2. Environment Variables**
- Add all vars in Vercel project settings
- No quotes needed in Vercel UI

**3. Build Configuration**
- Framework: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`
- Install Command: `pnpm install`

**4. Health Checks**
- Verify `/api/health` endpoint
- Check database connectivity
- Test payment webhooks

### Pre-Deployment Checklist

```bash
# Lint and type check
pnpm lint
pnpm exec tsc --noEmit

# Build locally
pnpm build

# Test critical paths
pnpm e2e

# Verify environment variables
cat .env.local | grep "^[A-Z_]" | wc -l
```

### Public repository notes

This project is intended to be shared publicly (e.g. portfolio / bursary review). Before pushing:

- Copy `.env.example` → `.env.local` locally; **never commit `.env.local`**
- Set `CONTACT_RECIPIENT_EMAIL` to a team inbox, not a personal Gmail
- Do not commit audit files such as `download.pdf` (already in `.gitignore`)
- Enable GitHub **Secret scanning** and **Push protection** after making the repo public

---

## SEO & Discoverability

Varsity Nest implements SEO using the **Next.js Metadata API**, centralized helpers in `lib/site-metadata.ts`, JSON-LD structured data, and crawler files (`robots.ts`, `sitemap.ts`).

**Highlights:**

- Global metadata, Open Graph, Twitter Cards, and favicons in `app/layout.tsx`
- Per-page metadata via `createPageMetadata()` for static routes
- Dynamic `generateMetadata()` for listing pages with property-specific titles and images
- JSON-LD: `Organization`, `WebSite`, `Apartment`, `BreadcrumbList`
- Public routes optimized for Core Web Vitals (server-rendered hero, lightweight public shell)

**Required env for SEO:**

```env
NEXT_PUBLIC_APP_URL=https://varsitynest.space
GOOGLE_SITE_VERIFICATION=optional
BING_SITE_VERIFICATION=optional
```

After deploy, submit `https://your-domain/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

---

## Troubleshooting

### Common Issues

**"NEXT_PUBLIC_APP_URL not set"**
```
→ Add NEXT_PUBLIC_APP_URL to .env.local
→ Value: http://localhost:3000 (dev) or https://varsitynest.space (prod)
```

**"Database connection failed"**
```
→ Verify DATABASE_URL is correct
→ Check Neon database is active
→ Test connectivity: psql $DATABASE_URL -c "SELECT 1"
```

**"Cloudinary upload failing"**
```
→ Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
→ Verify upload preset exists in Cloudinary console
→ Ensure preset is set to "Unsigned" mode
→ Check rate limits haven't been exceeded
```

**"Paystack webhook not firing"**
```
→ Verify PAYSTACK_SECRET_KEY is correct
→ Check webhook URL in Paystack dashboard
→ Test locally with ngrok: pnpm dev + ngrok tunnel
→ Check signature verification in logs
```

**"Student profile not saving"**
```
→ Clear browser cache and auth session
→ Check database constraints
→ Verify student record exists in database
→ Check foreign key relationships
```

---

## Contributing

1. Create feature branch: `git checkout -b feature/description`
2. Make changes following code style above
3. Add tests for new features
4. Commit: `git commit -m "feat: add wishlist filtering"`
5. Push: `git push origin feature/description`
6. Create Pull Request on GitHub
7. Ensure CI checks pass

---

## Additional Resources

- [StackFrame Stack Documentation](https://stackframe.co)
- [Cloudinary API Reference](https://cloudinary.com/documentation)
- [Paystack Documentation](https://paystack.com/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Neon Documentation](https://neon.tech)
- [Upstash Documentation](https://upstash.com)

---

## License

This project is licensed under the PolyForm Noncommercial License 1.0.0. See [LICENSE.md](./LICENSE.md) for the full terms.

## Support

For questions or issues:
- Create an issue on GitHub
- Contact the development team
- Review documentation and existing code

---

**Last Updated:** April 13, 2026
