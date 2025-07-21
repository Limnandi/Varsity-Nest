-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'provider', 'student')),
    phone VARCHAR(20),
    student_number VARCHAR(50),
    institution VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    student_number VARCHAR(50) NOT NULL,
    university VARCHAR(10) NOT NULL CHECK (university IN ('UFS', 'CUT')),
    year_of_study INTEGER,
    course VARCHAR(200),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_number, university)
);

-- Providers table
CREATE TABLE IF NOT EXISTS providers (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    business_registration VARCHAR(100),
    contact_person VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    website_url VARCHAR(500),
    description TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accommodations table
CREATE TABLE IF NOT EXISTS accommodations (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    images JSONB DEFAULT '[]',
    amenities JSONB DEFAULT '[]',
    accreditation_status VARCHAR(30) NOT NULL CHECK (accreditation_status IN ('accredited', 'provisionally_accredited', 'non_accredited')),
    provider_id VARCHAR(255) REFERENCES providers(id) ON DELETE CASCADE,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    website_url VARCHAR(500),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    room_types JSONB DEFAULT '[]',
    max_occupancy INTEGER,
    available_from DATE,
    available_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
    accommodation_id VARCHAR(255) REFERENCES accommodations(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
    accommodation_id VARCHAR(255) REFERENCES accommodations(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, accommodation_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    booking_id VARCHAR(255) REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('payfast', 'card', 'eft')),
    payment_reference VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    reporter_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    reported_accommodation_id VARCHAR(255) REFERENCES accommodations(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_university ON students(university);
CREATE INDEX IF NOT EXISTS idx_accommodations_status ON accommodations(accreditation_status);
CREATE INDEX IF NOT EXISTS idx_accommodations_active ON accommodations(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_accommodation ON bookings(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_accommodation ON reviews(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accommodations_updated_at BEFORE UPDATE ON accommodations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
