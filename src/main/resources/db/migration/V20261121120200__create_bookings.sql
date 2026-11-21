CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES rooms (id),
    professional_id BIGINT NOT NULL REFERENCES professionals (id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    blocked_until TIMESTAMPTZ NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_bookings_status CHECK (status IN ('CONFIRMED', 'CANCELLED')),
    CONSTRAINT ck_bookings_period CHECK (end_time > start_time AND blocked_until >= end_time)
);

CREATE INDEX idx_bookings_room_start ON bookings (room_id, start_time);
CREATE INDEX idx_bookings_professional ON bookings (professional_id);
