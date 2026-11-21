CREATE TABLE professionals (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    CONSTRAINT uk_professionals_license UNIQUE (license_number),
    CONSTRAINT uk_professionals_email UNIQUE (email)
);
