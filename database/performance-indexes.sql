-- Performance optimization indexes for the project
-- These indexes are designed to improve query performance for common operations

-- Accommodations table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_status_active 
ON accommodations(accreditation_status, is_active) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_featured_created 
ON accommodations(featured, created_at DESC) 
WHERE is_active = true AND featured = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_provider_status 
ON accommodations(provider_id, accreditation_status, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_price_range 
ON accommodations(price) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_rating_reviews 
ON accommodations(rating DESC, review_count DESC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_area_status 
ON accommodations(area, accreditation_status, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_availability 
ON accommodations(is_open, available_rooms) 
WHERE is_active = true;

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON users(email) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_active 
ON users(role, is_active);

-- Students table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_university_user 
ON students(university, user_id);

-- Providers table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_providers_user_verified 
ON providers(user_id, is_verified, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_providers_status_created 
ON providers(registration_status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_providers_subscription_status 
ON providers(subscription_status, is_active);

-- Bookings table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_student_status 
ON bookings(student_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_accommodation_status 
ON bookings(accommodation_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_dates 
ON bookings(check_in_date, check_out_date) 
WHERE status IN ('confirmed', 'pending');

-- Reviews table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_accommodation_rating 
ON reviews(accommodation_id, rating DESC, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_student_created 
ON reviews(student_id, created_at DESC);

-- Payments table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_booking_status 
ON payments(booking_id, status, created_at DESC);

-- Payment transactions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_transactions_provider_status 
ON payment_transactions(provider_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_transactions_m_payment_id 
ON payment_transactions(m_payment_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_transactions_pf_payment_id 
ON payment_transactions(pf_payment_id);

-- Reports table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_status_created 
ON reports(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_accommodation 
ON reports(reported_accommodation_id, status);

-- Admin activities indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_activities_admin_created 
ON admin_activities(admin_id, created_at DESC);

-- File upload audits indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_audits_user_purpose 
ON file_upload_audits(user_id, purpose, created_at DESC);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_search 
ON accommodations(accreditation_status, is_active, featured, rating DESC, price) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_provider_search 
ON accommodations(provider_id, accreditation_status, is_active, created_at DESC);

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_active_featured 
ON accommodations(created_at DESC) 
WHERE is_active = true AND featured = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_active_verified 
ON accommodations(rating DESC, review_count DESC) 
WHERE is_active = true AND is_verified = true;

-- Text search indexes (if using full-text search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_name_search 
ON accommodations USING gin(to_tsvector('english', name));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_address_search 
ON accommodations USING gin(to_tsvector('english', address));

-- Update table statistics
ANALYZE accommodations;
ANALYZE users;
ANALYZE students;
ANALYZE providers;
ANALYZE bookings;
ANALYZE reviews;
ANALYZE payments;
ANALYZE payment_transactions;
ANALYZE reports;
ANALYZE admin_activities;
ANALYZE file_upload_audits;
