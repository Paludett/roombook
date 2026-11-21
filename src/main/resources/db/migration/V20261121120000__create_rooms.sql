CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    floor_wing VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    sanitization_minutes INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT ck_rooms_status CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'INACTIVE')),
    CONSTRAINT ck_rooms_sanitization CHECK (sanitization_minutes >= 0)
);
