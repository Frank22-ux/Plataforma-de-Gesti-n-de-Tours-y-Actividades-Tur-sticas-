-- ============================================
-- SISTEMA DE GESTIÓN DE TOURS Y HOTELERÍA
-- Script de Creación de Base de Datos PostgreSQL
-- ============================================

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS seguimiento_guia CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS reservas CASCADE;
DROP TABLE IF EXISTS guias CASCADE;
DROP TABLE IF EXISTS tours CASCADE;
DROP TABLE IF EXISTS sensaciones CASCADE;
DROP TABLE IF EXISTS hoteles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ============================================
-- TABLA: ROLES
-- ============================================
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    CONSTRAINT chk_nombre_rol CHECK (nombre_rol IN ('Administrador', 'Guía', 'Turista'))
);

-- ============================================
-- TABLA: USUARIOS
-- ============================================
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    id_rol INTEGER NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) 
        REFERENCES roles(id_rol) ON DELETE RESTRICT
);

-- ============================================
-- TABLA: HOTELES
-- ============================================
CREATE TABLE hoteles (
    id_hotel SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    estado_convenio VARCHAR(20) DEFAULT 'Activo',
    descripcion TEXT,
    CONSTRAINT chk_estado_convenio CHECK (estado_convenio IN ('Activo', 'Inactivo'))
);

-- ============================================
-- TABLA: SENSACIONES
-- ============================================
CREATE TABLE sensaciones (
    id_sensacion SERIAL PRIMARY KEY,
    nombre_sensacion VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================
-- TABLA: TOURS
-- ============================================
CREATE TABLE tours (
    id_tour SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    id_sensacion INTEGER NOT NULL,
    id_hotel_base INTEGER NOT NULL,
    CONSTRAINT fk_tour_sensacion FOREIGN KEY (id_sensacion) 
        REFERENCES sensaciones(id_sensacion) ON DELETE RESTRICT,
    CONSTRAINT fk_tour_hotel FOREIGN KEY (id_hotel_base) 
        REFERENCES hoteles(id_hotel) ON DELETE RESTRICT,
    CONSTRAINT chk_precio_positivo CHECK (precio >= 0)
);

-- ============================================
-- TABLA: GUIAS
-- ============================================
CREATE TABLE guias (
    id_guia SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL UNIQUE,
    id_hotel_asignado INTEGER NOT NULL,
    especialidad VARCHAR(200),
    CONSTRAINT fk_guia_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_guia_hotel FOREIGN KEY (id_hotel_asignado) 
        REFERENCES hoteles(id_hotel) ON DELETE RESTRICT
);

-- ============================================
-- TABLA: RESERVAS
-- ============================================
CREATE TABLE reservas (
    id_reserva SERIAL PRIMARY KEY,
    id_turista INTEGER NOT NULL,
    id_tour INTEGER NOT NULL,
    id_hotel INTEGER NOT NULL,
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actividad DATE NOT NULL,
    estado_pago VARCHAR(20) DEFAULT 'Pendiente',
    CONSTRAINT fk_reserva_turista FOREIGN KEY (id_turista) 
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_reserva_tour FOREIGN KEY (id_tour) 
        REFERENCES tours(id_tour) ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_hotel FOREIGN KEY (id_hotel) 
        REFERENCES hoteles(id_hotel) ON DELETE RESTRICT,
    CONSTRAINT chk_estado_pago CHECK (estado_pago IN ('Pendiente', 'Confirmado', 'Rechazado', 'Cancelado')),
    CONSTRAINT chk_fecha_actividad CHECK (fecha_actividad >= CURRENT_DATE)
);

-- ============================================
-- TABLA: PAGOS
-- ============================================
CREATE TABLE pagos (
    id_pago SERIAL PRIMARY KEY,
    id_reserva INTEGER NOT NULL UNIQUE,
    monto DECIMAL(10, 2) NOT NULL,
    metodo VARCHAR(50) DEFAULT 'Transferencia',
    comprobante_url VARCHAR(500),
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pago_reserva FOREIGN KEY (id_reserva) 
        REFERENCES reservas(id_reserva) ON DELETE CASCADE,
    CONSTRAINT chk_monto_positivo CHECK (monto >= 0),
    CONSTRAINT chk_metodo_pago CHECK (metodo = 'Transferencia')
);

-- ============================================
-- TABLA: SEGUIMIENTO_GUIA
-- ============================================
CREATE TABLE seguimiento_guia (
    id_seguimiento SERIAL PRIMARY KEY,
    id_reserva INTEGER NOT NULL,
    id_guia INTEGER NOT NULL,
    estado_animo VARCHAR(100),
    satisfaccion_nivel INTEGER,
    comentarios TEXT,
    fecha_seguimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seguimiento_reserva FOREIGN KEY (id_reserva) 
        REFERENCES reservas(id_reserva) ON DELETE CASCADE,
    CONSTRAINT fk_seguimiento_guia FOREIGN KEY (id_guia) 
        REFERENCES guias(id_guia) ON DELETE RESTRICT,
    CONSTRAINT chk_satisfaccion_rango CHECK (satisfaccion_nivel BETWEEN 1 AND 10)
);

-- ============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================

-- Índices en columnas de búsqueda frecuente
CREATE INDEX idx_usuarios_correo ON usuarios(correo);
CREATE INDEX idx_usuarios_rol ON usuarios(id_rol);
CREATE INDEX idx_hoteles_ciudad ON hoteles(ciudad);
CREATE INDEX idx_hoteles_estado ON hoteles(estado_convenio);
CREATE INDEX idx_tours_sensacion ON tours(id_sensacion);
CREATE INDEX idx_tours_hotel ON tours(id_hotel_base);
CREATE INDEX idx_reservas_turista ON reservas(id_turista);
CREATE INDEX idx_reservas_fecha ON reservas(fecha_actividad);
CREATE INDEX idx_reservas_estado ON reservas(estado_pago);
CREATE INDEX idx_pagos_reserva ON pagos(id_reserva);
CREATE INDEX idx_seguimiento_guia ON seguimiento_guia(id_guia);
CREATE INDEX idx_seguimiento_reserva ON seguimiento_guia(id_reserva);

-- ============================================
-- INSERCIÓN DE DATOS INICIALES
-- ============================================

-- Insertar roles predefinidos
INSERT INTO roles (nombre_rol) VALUES 
    ('Administrador'),
    ('Guía'),
    ('Turista');

-- Insertar sensaciones predefinidas
INSERT INTO sensaciones (nombre_sensacion) VALUES 
    ('Paz'),
    ('Diversión'),
    ('Nostalgia'),
    ('Aventura'),
    ('Romance'),
    ('Adrenalina'),
    ('Relax'),
    ('Cultural'),
    ('Gastronómica'),
    ('Naturaleza');

-- Insertar usuario administrador por defecto
-- Contraseña: admin123 (debe ser hasheada en producción)
INSERT INTO usuarios (nombre, correo, password, id_rol) VALUES 
    ('Administrador Sistema', 'admin@toursystem.com', 'admin123', 1);

-- ============================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- ============================================

COMMENT ON TABLE roles IS 'Catálogo de roles del sistema';
COMMENT ON TABLE usuarios IS 'Usuarios registrados en el sistema';
COMMENT ON TABLE hoteles IS 'Hoteles asociados con convenios';
COMMENT ON TABLE sensaciones IS 'Categorías emocionales de los tours';
COMMENT ON TABLE tours IS 'Catálogo de tours disponibles';
COMMENT ON TABLE guias IS 'Guías turísticos asignados a hoteles';
COMMENT ON TABLE reservas IS 'Reservas realizadas por turistas';
COMMENT ON TABLE pagos IS 'Registros de pagos por transferencia';
COMMENT ON TABLE seguimiento_guia IS 'Seguimiento de satisfacción del turista';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================