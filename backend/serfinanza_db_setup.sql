-- ===========================================================================
-- Serfinanza Synthetic Database Setup
-- Designed for Agente 360 & Tabularis & PostgREST local sandbox
-- ===========================================================================

-- 1. Create database (if run from a connection to postgres)
-- NOTE: We will handle CREATE DATABASE separately or ensure it runs safely.
-- To run this script, we can connect to postgres and run:
-- CREATE DATABASE serfinanza_db;
-- Then connect to serfinanza_db and run the rest.

-- Drop schema if exists and recreate
DROP SCHEMA IF EXISTS api CASCADE;
CREATE SCHEMA api;

-- 2. Define Client Profiles
CREATE TABLE api.clientes (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    edad INT NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    segmento VARCHAR(100) NOT NULL,
    antiguedad VARCHAR(50) NOT NULL,
    canal_preferido VARCHAR(50) NOT NULL,
    etiqueta VARCHAR(100),
    es_asesor BOOLEAN DEFAULT FALSE,
    rol VARCHAR(50),
    sucursal VARCHAR(100),
    scoring_crediticio INT CHECK (scoring_crediticio BETWEEN 0 AND 1000)
);

-- 3. Define Accounts (Cuentas)
CREATE TABLE api.cuentas (
    id SERIAL PRIMARY KEY,
    cliente_id VARCHAR(50) REFERENCES api.clientes(id) ON DELETE CASCADE,
    numero_cuenta VARCHAR(50) UNIQUE NOT NULL,
    tipo_cuenta VARCHAR(50) NOT NULL, -- 'Ahorros', 'Corriente', 'SuperCDT'
    saldo DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    tasa_ea DECIMAL(5, 2) DEFAULT 0.00, -- Specific to CDTs or special accounts
    creado_at TIMESTAMP DEFAULT NOW()
);

-- 4. Define Credit Cards (Tarjetas de Crédito)
CREATE TABLE api.tarjetas (
    id SERIAL PRIMARY KEY,
    cliente_id VARCHAR(50) REFERENCES api.clientes(id) ON DELETE CASCADE,
    numero_tarjeta VARCHAR(50) UNIQUE NOT NULL,
    tipo_tarjeta VARCHAR(50) NOT NULL, -- 'Tarjeta Olimpica', 'Gold', 'Platinum'
    cupo_aprobado DECIMAL(15, 2) NOT NULL,
    deuda_actual DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    porcentaje_uso DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN cupo_aprobado > 0 THEN (deuda_actual / cupo_aprobado) * 100 ELSE 0 END
    ) STORED,
    estado VARCHAR(20) DEFAULT 'Activa'
);

-- 5. Define Transactions
CREATE TABLE api.transacciones (
    id SERIAL PRIMARY KEY,
    cliente_id VARCHAR(50) REFERENCES api.clientes(id) ON DELETE CASCADE,
    medio_pago VARCHAR(50) NOT NULL, -- 'Cuenta Ahorros', 'Tarjeta Olimpica', etc.
    monto DECIMAL(15, 2) NOT NULL,
    comercio VARCHAR(100) NOT NULL, -- 'Tiendas Olimpica', 'SAO', 'Drogueria Olimpica', etc.
    tipo VARCHAR(50) NOT NULL, -- 'Compra', 'Retiro', 'Transferencia'
    estado VARCHAR(20) DEFAULT 'Completada',
    fecha TIMESTAMP DEFAULT NOW() - INTERVAL '1 day' * (random() * 30) -- Random in last 30 days
);

-- 6. Define Marketing Offers
CREATE TABLE api.ofertas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    segmento_objetivo VARCHAR(100) NOT NULL,
    canal VARCHAR(100) NOT NULL,
    metrica_etiqueta VARCHAR(100),
    metrica_valor VARCHAR(50),
    esta_activa BOOLEAN DEFAULT TRUE,
    prioridad INT NOT NULL DEFAULT 3,
    condicion_disparo TEXT NOT NULL
);

-- 7. Define Human-in-the-Loop Tasks
CREATE TABLE api.tareas_hitl (
    id VARCHAR(50) PRIMARY KEY,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_segmento VARCHAR(100) NOT NULL,
    agente_nombre VARCHAR(100) NOT NULL,
    tipo_tarea VARCHAR(100) NOT NULL, -- 'Aumento de Cupo', 'Actualizacion de Direccion', 'Exencion de Tasa', 'Difusion de Campaña'
    descripcion TEXT NOT NULL,
    valor_original VARCHAR(255),
    valor_propuesto VARCHAR(255) NOT NULL,
    confianza INT CHECK (confianza BETWEEN 0 AND 100),
    estado VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    hace_cuanto VARCHAR(50) NOT NULL,
    notas_operador TEXT,
    documento_rag VARCHAR(255),
    audio_voz BOOLEAN DEFAULT FALSE,
    transcripcion_dialogo TEXT,
    creado_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================================
-- SEED DATA
-- ===========================================================================

-- 1. Clientes
INSERT INTO api.clientes (id, nombre, email, edad, ciudad, segmento, antiguedad, canal_preferido, etiqueta, es_asesor, rol, sucursal, scoring_crediticio) VALUES
('maria', 'María Amparo Gutiérrez', 'maria.gutierrez@gmail.com', 62, 'Cali', 'Adulto Mayor', '14 años', 'WhatsApp', 'No usa app', FALSE, NULL, NULL, 780),
('carlos', 'Carlos Herrera Díaz', 'carlos.herrera@outlook.com', 38, 'Barranquilla', 'Digital Activo', '6 años', 'Telegram', 'Cliente frecuente Olimpica', FALSE, NULL, NULL, 890),
('juliana', 'Juliana Mora', 'juliana.mora@serfinanza.com.co', 28, 'Bogotá', 'Asesor Interno', '3 meses', 'CenterCall', 'Modo copiloto asesor', TRUE, 'Asesora Junior', 'Bogotá Chapinero', NULL),
('roberto', 'Roberto Gómez Oñate', 'roberto.gomez@yahoo.com', 45, 'Valledupar', 'Cliente Preferencial', '8 años', 'WhatsApp', 'Inversionista', FALSE, NULL, NULL, 950),
('alberto', 'Alberto Junior Restrepo', 'alberto.restrepo@gmail.com', 29, 'Soledad', 'Digital Activo', '2 años', 'SMS', 'Comprador de tecnología', FALSE, NULL, NULL, 620);

-- 2. Cuentas
INSERT INTO api.cuentas (cliente_id, numero_cuenta, tipo_cuenta, saldo, tasa_ea) VALUES
('maria', 'AC-482910-AH', 'Cuenta Ahorros', 2500000.00, 2.50),
('maria', 'CDT-998273-SP', 'SuperCDT', 12000000.00, 12.50),
('carlos', 'AC-192837-AH', 'Cuenta Ahorros', 4800000.00, 3.00),
('roberto', 'AC-990011-AH', 'Cuenta Ahorros', 15300000.00, 4.00),
('roberto', 'CDT-100223-SP', 'SuperCDT', 25000000.00, 12.50),
('alberto', 'AC-887766-AH', 'Cuenta Ahorros', 350000.00, 1.50);

-- 3. Tarjetas de Crédito
INSERT INTO api.tarjetas (cliente_id, numero_tarjeta, tipo_tarjeta, cupo_aprobado, deuda_actual) VALUES
('maria', '5043-XXXX-XXXX-9912', 'Tarjeta Olimpica', 5000000.00, 850000.00),
('carlos', '4000-XXXX-XXXX-1234', 'Gold', 10000000.00, 6800000.00), -- 68% usage, flags limit increase!
('alberto', '5043-XXXX-XXXX-7721', 'Tarjeta Olimpica', 1500000.00, 1200000.00); -- 80% usage

-- 4. Transacciones (Realistic synthetic transactions)
INSERT INTO api.transacciones (cliente_id, medio_pago, monto, comercio, tipo) VALUES
('maria', 'Tarjeta Olimpica', 120000.00, 'Tiendas Olimpica Portal', 'Compra'),
('maria', 'Tarjeta Olimpica', 45000.00, 'Drogueria Olimpica Norte', 'Compra'),
('maria', 'Cuenta Ahorros', 150000.00, 'Cajero Automatico Serfinanza', 'Retiro'),
('carlos', 'Gold', 450000.00, 'Tiendas Olimpica Calle 72', 'Compra'),
('carlos', 'Gold', 120000.00, 'Gasolinera Terpel B/quilla', 'Compra'),
('carlos', 'Gold', 2300000.00, 'Sábado Madrugón Electrodomésticos', 'Compra'),
('carlos', 'Cuenta Ahorros', 80000.00, 'Transferencia PSE Netflix', 'Compra'),
('roberto', 'Cuenta Ahorros', 5000000.00, 'Traslado de fondos Inversion', 'Transferencia'),
('alberto', 'Tarjeta Olimpica', 350000.00, 'SAO Soledad', 'Compra'),
('alberto', 'Tarjeta Olimpica', 120000.00, 'Drogueria Olimpica Soledad', 'Compra');

-- 5. Ofertas
INSERT INTO api.ofertas (titulo, descripcion, segmento_objetivo, canal, metrica_etiqueta, metrica_valor, esta_activa, prioridad, condicion_disparo) VALUES
('🏦 SuperCDT personalizado', 'Rentabilidad exclusiva del 12.5% E.A. para clientes con saldo > $2M sin CDT activo.', 'Ahorradores sin CDT', 'WhatsApp', 'Conversión estimada', '+18%', TRUE, 1, 'Saldo > $2M y sin CDT activo'),
('🛒 Miércoles de Plaza', 'Descuentos de hasta 30% en frutas y verduras de Supertiendas Olímpica pagando con Tarjeta Olímpica.', 'Tarjetahabientes Olímpica', 'WhatsApp, Telegram', 'Enviados hoy', '2.041 hoy', TRUE, 2, 'Día actual es Miércoles'),
('💳 Aumento de cupo TC', 'Aumento de cupo pre-aprobado para clientes con buen comportamiento de pago y uso > 60%.', 'Clientes con buen historial', 'Web', 'Conversión promedio', '+22%', TRUE, 3, 'Uso TC > 60% por 3 meses'),
('👴 Paquete 50+ sin app', 'Atención prioritaria y exoneración de cuota de manejo para clientes senior sin uso de app móvil.', 'Adulto Mayor (Sin App 30d)', 'WhatsApp auto', 'Retión lograda', '+15%', TRUE, 1, 'Edad > 55 y sin login en App');

-- 6. Tareas HITL
INSERT INTO api.tareas_hitl (id, cliente_nombre, cliente_segmento, agente_nombre, tipo_tarea, descripcion, valor_original, valor_propuesto, confianza, estado, hace_cuanto, notas_operador, documento_rag, audio_voz, transcripcion_dialogo) VALUES
('hitl-1', 'María Amparo Gutiérrez', 'Adulto Mayor', 'Agente UX 50+', 'Actualización de Dirección', 'Cambio de domicilio solicitado vía audio de voz en WhatsApp. Requiere autorización regulada de firma digital por operador.', 'Calle 5 # 34-12, Cali', 'Avenida 3 Norte # 23-45, Apto 402, Cali', 94, 'pending', 'Hace 3 min', NULL, 'Actualización de datos paso a paso', TRUE, 'María Amparo: "...sí mijo, por favor cámbiame la dirección de correspondencia a la Avenida 3 Norte número 23 guion 45, apartamento 402 en la ciudad de Cali, que me mudé con mi hija el mes pasado..."'),
('hitl-2', 'Carlos Herrera Díaz', 'Digital Activo', 'Agente Perfil 360', 'Aumento de Cupo', 'Pre-aprobación y liberación de cupo en Tarjeta Olímpica Serfinanza basado en scoring crediticio y 65% de utilización recurrente.', '$5,000,000 COP', '$6,500,000 COP', 98, 'pending', 'Hace 12 min', NULL, 'Tarifario Tarjeta Olimpica 2026', FALSE, 'Agente 360: "Detectando uso recurrente en Olímpica y comportamiento AAA de pago. Sugiriendo aumento de cupo inmediato al 30% adicional para asegurar compras en el Sábado Madrugón."'),
('hitl-3', 'Roberto Gómez Oñate', 'Cliente Preferencial', 'Agente Banca', 'Exención de Tasa', 'Excepción de tasa preferencial de SuperCDT al 13.0% E.A. (el límite estándar autorizado es 12.5% E.A.) para retención de fondos de $15M.', '12.5% E.A.', '13.0% E.A. (Monto $15,000,000)', 91, 'pending', 'Hace 25 min', NULL, 'Reglamento SuperCDT v3.2', FALSE, 'Roberto Gómez: "Si no me mejoran la tasa del CDT al 13%, tendré que retirar los 15 millones de pesos y llevarlos a otro banco que me ofrece mejor rentabilidad."'),
('hitl-4', 'Campañas Automáticas', 'Segmento Adulto Mayor (420 cls)', 'Agente Retail Olimpica', 'Difusión de Campaña', 'Envío proactivo masivo de SMS y alertas personalizadas para la promoción del Sábado Madrugón de electrodomésticos.', 'Ninguno', 'Difusión SMS a 420 contactos segmentados', 96, 'pending', 'Hace 45 min', NULL, 'Calendario de eventos especiales', FALSE, 'Agente Retail: "Planificando envío de SMS personalizado para adultos mayores en Cali sin App activa en los últimos 30 días, informando sobre descuento exclusivo del 30% en electrodomésticos Olímpica."');


-- ===========================================================================
-- POSTGREST PERMISSIONS & ROLES
-- ===========================================================================

-- Create anonymous role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'web_anon') THEN
        CREATE ROLE web_anon NOLOGIN;
    END IF;
END
$$;

-- Grant access to schema 'api' and all tables/sequences inside it
GRANT USAGE ON SCHEMA api TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA api TO web_anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO web_anon;

-- Ensure future tables are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT USAGE, SELECT ON SEQUENCES TO web_anon;

\echo 'Serfinanza database setup successfully seeded!'
