-- Limpiar datos existentes de productos y transacciones
DELETE FROM api.transacciones;
DELETE FROM api.tarjetas;
DELETE FROM api.cuentas;

-- ==========================================
-- Datos para María Amparo Gutiérrez (maria)
-- ==========================================
-- 1. Cuentas (Cuenta de Ahorros, SuperCDT)
INSERT INTO api.cuentas (cliente_id, numero_cuenta, tipo_cuenta, saldo, tasa_ea) VALUES
('maria', '1002003004', 'Cuenta Ahorros', 2540000.50, 1.5),
('maria', '9008007006', 'SuperCDT', 15000000.00, 12.5);

-- 2. Tarjetas (Tarjeta Olímpica)
INSERT INTO api.tarjetas (cliente_id, numero_tarjeta, tipo_tarjeta, cupo_aprobado, deuda_actual, estado) VALUES
('maria', '4123-XXXX-XXXX-9988', 'Tarjeta Olímpica', 2000000.00, 450000.00, 'Activa');

-- 3. Transacciones (Compras recientes de María)
INSERT INTO api.transacciones (cliente_id, medio_pago, monto, comercio, tipo, estado) VALUES
('maria', 'Tarjeta Olímpica', 125000.00, 'Supertiendas Olímpica', 'Compra', 'Completada'),
('maria', 'Tarjeta Olímpica', 85000.00, 'Farmacia Olímpica SA', 'Compra', 'Completada'),
('maria', 'Cuenta Ahorros', 500000.00, 'Transferencia Recibida', 'Abono', 'Completada');

-- ==========================================
-- Datos para Carlos Herrera Díaz (carlos)
-- ==========================================
-- 1. Cuentas
INSERT INTO api.cuentas (cliente_id, numero_cuenta, tipo_cuenta, saldo, tasa_ea) VALUES
('carlos', '1005009001', 'Cuenta Ahorros', 850000.00, 1.5),
('carlos', '9003002001', 'CDT', 8000000.00, 11.0);

-- 2. Tarjetas
INSERT INTO api.tarjetas (cliente_id, numero_tarjeta, tipo_tarjeta, cupo_aprobado, deuda_actual, estado) VALUES
('carlos', '5432-XXXX-XXXX-1122', 'Tarjeta Crédito', 5000000.00, 3250000.00, 'Activa');

-- 3. Transacciones (Cliente frecuente Olímpica)
INSERT INTO api.transacciones (cliente_id, medio_pago, monto, comercio, tipo, estado) VALUES
('carlos', 'Tarjeta Crédito', 450000.00, 'Supertiendas Olímpica', 'Compra', 'Completada'),
('carlos', 'Tarjeta Crédito', 210000.00, 'Electrodomésticos Olímpica', 'Compra', 'Completada'),
('carlos', 'Cuenta Ahorros', 150000.00, 'Pago Servicio Luz', 'Pago', 'Completada'),
('carlos', 'Tarjeta Crédito', 80000.00, 'Carnes Olímpica', 'Compra', 'Completada');

-- ==========================================
-- Datos para Alberto Junior (alberto)
-- ==========================================
INSERT INTO api.cuentas (cliente_id, numero_cuenta, tipo_cuenta, saldo, tasa_ea) VALUES
('alberto', '1004008003', 'Cuenta Ahorros', 345000.00, 1.5);

INSERT INTO api.tarjetas (cliente_id, numero_tarjeta, tipo_tarjeta, cupo_aprobado, deuda_actual, estado) VALUES
('alberto', '4123-XXXX-XXXX-5566', 'Tarjeta Olímpica', 1500000.00, 1400000.00, 'Activa');

INSERT INTO api.transacciones (cliente_id, medio_pago, monto, comercio, tipo, estado) VALUES
('alberto', 'Tarjeta Olímpica', 1200000.00, 'Tecnología Olímpica', 'Compra', 'Completada');
