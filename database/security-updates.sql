-- Database Security and Integrity Updates
-- This file contains critical security and performance improvements

-- 1. Add missing foreign key constraints with proper cascade rules
ALTER TABLE students 
ADD CONSTRAINT fk_students_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE providers 
ADD CONSTRAINT fk_providers_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE accommodations 
ADD CONSTRAINT fk_accommodations_provider_id 
FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE;

ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_student_id 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_accommodation_id 
FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE;

ALTER TABLE reviews 
ADD CONSTRAINT fk_reviews_student_id 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE reviews 
ADD CONSTRAINT fk_reviews_accommodation_id 
FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE;

ALTER TABLE payments 
ADD CONSTRAINT fk_payments_booking_id 
FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE reports 
ADD CONSTRAINT fk_reports_reporter_id 
FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reports 
ADD CONSTRAINT fk_reports_accommodation_id 
FOREIGN KEY (reported_accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE;

ALTER TABLE admin_activities 
ADD CONSTRAINT fk_admin_activities_admin_id 
FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payment_transactions 
ADD CONSTRAINT fk_payment_transactions_provider_id 
FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL;

-- 2. Add critical indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_university_student_number ON students(university, student_number);

CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_registration_status ON providers(registration_status);
CREATE INDEX IF NOT EXISTS idx_providers_is_active ON providers(is_active);
CREATE INDEX IF NOT EXISTS idx_providers_is_verified ON providers(is_verified);

CREATE INDEX IF NOT EXISTS idx_accommodations_provider_id ON accommodations(provider_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_accreditation_status ON accommodations(accreditation_status);
CREATE INDEX IF NOT EXISTS idx_accommodations_is_active ON accommodations(is_active);
CREATE INDEX IF NOT EXISTS idx_accommodations_featured ON accommodations(featured);
CREATE INDEX IF NOT EXISTS idx_accommodations_price ON accommodations(price);
CREATE INDEX IF NOT EXISTS idx_accommodations_created_at ON accommodations(created_at);

CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_accommodation_id ON bookings(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in_date ON bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_student_id ON reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_accommodation_id ON reviews(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_accommodation_id ON reports(reported_accommodation_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_activities_admin_id ON admin_activities(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activities_created_at ON admin_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON payment_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_m_payment_id ON payment_transactions(m_payment_id);

-- 3. Add data validation constraints
ALTER TABLE users 
ADD CONSTRAINT chk_users_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users 
ADD CONSTRAINT chk_users_password_length 
CHECK (LENGTH(password) >= 8);

ALTER TABLE users 
ADD CONSTRAINT chk_users_role_valid 
CHECK (role IN ('admin', 'provider', 'student'));

ALTER TABLE students 
ADD CONSTRAINT chk_students_university_valid 
CHECK (university IN ('UFS', 'CUT'));

ALTER TABLE students 
ADD CONSTRAINT chk_students_year_of_study 
CHECK (year_of_study IS NULL OR (year_of_study >= 1 AND year_of_study <= 6));

ALTER TABLE accommodations 
ADD CONSTRAINT chk_accommodations_price_positive 
CHECK (price > 0);

ALTER TABLE accommodations 
ADD CONSTRAINT chk_accommodations_accreditation_status 
CHECK (accreditation_status IN ('accredited', 'provisionally_accredited', 'non_accredited'));

ALTER TABLE bookings 
ADD CONSTRAINT chk_bookings_dates_valid 
CHECK (check_out_date > check_in_date);

ALTER TABLE bookings 
ADD CONSTRAINT chk_bookings_total_amount_positive 
CHECK (total_amount > 0);

ALTER TABLE bookings 
ADD CONSTRAINT chk_bookings_status_valid 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

ALTER TABLE bookings 
ADD CONSTRAINT chk_bookings_payment_status_valid 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

ALTER TABLE reviews 
ADD CONSTRAINT chk_reviews_rating_range 
CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE payments 
ADD CONSTRAINT chk_payments_amount_positive 
CHECK (amount > 0);

ALTER TABLE payments 
ADD CONSTRAINT chk_payments_currency_valid 
CHECK (currency IN ('ZAR', 'USD', 'EUR'));

ALTER TABLE payments 
ADD CONSTRAINT chk_payments_payment_method_valid 
CHECK (payment_method IN ('payfast', 'card', 'eft'));

ALTER TABLE payments 
ADD CONSTRAINT chk_payments_status_valid 
CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

ALTER TABLE reports 
ADD CONSTRAINT chk_reports_status_valid 
CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed'));

ALTER TABLE payment_transactions 
ADD CONSTRAINT chk_payment_transactions_amount_positive 
CHECK (amount > 0);

ALTER TABLE payment_transactions 
ADD CONSTRAINT chk_payment_transactions_status_valid 
CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));

-- 4. Add triggers for data integrity
CREATE OR REPLACE FUNCTION validate_accommodation_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure provider exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM providers 
    WHERE id = NEW.provider_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Provider must exist and be active';
  END IF;
  
  -- Ensure price is reasonable
  IF NEW.price <= 0 OR NEW.price > 50000 THEN
    RAISE EXCEPTION 'Price must be between 0 and 50000';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_validate_accommodation_data
  BEFORE INSERT OR UPDATE ON accommodations
  FOR EACH ROW
  EXECUTE FUNCTION validate_accommodation_data();

CREATE OR REPLACE FUNCTION validate_booking_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure student exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = NEW.student_id AND u.is_active = true
  ) THEN
    RAISE EXCEPTION 'Student must exist and be active';
  END IF;
  
  -- Ensure accommodation exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM accommodations 
    WHERE id = NEW.accommodation_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Accommodation must exist and be active';
  END IF;
  
  -- Ensure booking dates are in the future
  IF NEW.check_in_date <= CURRENT_DATE THEN
    RAISE EXCEPTION 'Check-in date must be in the future';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_validate_booking_data
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_data();

-- 5. Add audit trail for sensitive operations
CREATE TABLE IF NOT EXISTS audit_log (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  table_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- 6. Add row-level security policies (if needed)
-- Note: These are commented out as they require careful configuration
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 7. Add cleanup functions for expired data
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW();
  
  -- Log cleanup activity
  INSERT INTO admin_activities (activity_type, message, admin_id)
  VALUES ('system', 'Cleaned up expired sessions', NULL);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_log 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Log cleanup activity
  INSERT INTO admin_activities (activity_type, message, admin_id)
  VALUES ('system', 'Cleaned up old audit logs', NULL);
END;
$$ LANGUAGE plpgsql;

-- 8. Create views for common queries (performance optimization)
CREATE OR REPLACE VIEW active_accommodations AS
SELECT 
  a.*,
  p.business_name as provider_name,
  p.contact_email as provider_email,
  p.contact_phone as provider_phone
FROM accommodations a
JOIN providers p ON a.provider_id = p.id
WHERE a.is_active = true AND p.is_active = true;

CREATE OR REPLACE VIEW accommodation_stats AS
SELECT 
  a.id,
  a.name,
  COUNT(b.id) as total_bookings,
  COALESCE(AVG(r.rating), 0) as average_rating,
  COUNT(r.id) as total_reviews,
  SUM(b.total_amount) as total_revenue
FROM accommodations a
LEFT JOIN bookings b ON a.id = b.accommodation_id
LEFT JOIN reviews r ON a.id = r.accommodation_id
WHERE a.is_active = true
GROUP BY a.id, a.name;

-- 9. Add comments for documentation
COMMENT ON TABLE users IS 'Core user accounts for the system';
COMMENT ON TABLE students IS 'Student-specific information linked to users';
COMMENT ON TABLE providers IS 'Accommodation provider information linked to users';
COMMENT ON TABLE accommodations IS 'Accommodation listings from providers';
COMMENT ON TABLE bookings IS 'Student bookings for accommodations';
COMMENT ON TABLE reviews IS 'Student reviews of accommodations';
COMMENT ON TABLE payments IS 'Payment records for bookings';
COMMENT ON TABLE reports IS 'User reports about accommodations';
COMMENT ON TABLE admin_activities IS 'Audit trail of admin actions';
COMMENT ON TABLE payment_transactions IS 'Payment gateway transaction records';
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all data changes';

-- 10. Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO varsity_nest_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO varsity_nest_app;
