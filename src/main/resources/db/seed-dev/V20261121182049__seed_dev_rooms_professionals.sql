-- Dados de exemplo, só no perfil dev (spring.flyway.locations em application-dev.yaml). Sem reservas.
INSERT INTO rooms (name, type, floor_wing, status, sanitization_minutes) VALUES
    ('Consultório 1', 'CONSULTORIO', '1º andar - Ala A', 'ATIVA', 20),
    ('Consultório 2', 'CONSULTORIO', '1º andar - Ala A', 'ATIVA', 20),
    ('Sala de Exame 1', 'SALA_EXAME', '2º andar - Ala B', 'ATIVA', 10),
    ('Sala de Procedimento 1', 'SALA_PROCEDIMENTO', '2º andar - Ala B', 'EM_MANUTENCAO', 15),
    ('Sala de Reunião 1', 'SALA_REUNIAO', 'Térreo', 'ATIVA', 0);

INSERT INTO professionals (name, license_number, specialty, email) VALUES
    ('Dra. Ana Souza', 'CRM-RS 12345', 'Clínica Geral', 'ana.souza@exemplo.test'),
    ('Dr. Bruno Lima', 'CRM-RS 23456', 'Cardiologia', 'bruno.lima@exemplo.test'),
    ('Dra. Carla Mendes', 'CRM-RS 34567', 'Dermatologia', 'carla.mendes@exemplo.test'),
    ('Dr. Diego Rocha', 'CRM-RS 45678', 'Ortopedia', 'diego.rocha@exemplo.test');
