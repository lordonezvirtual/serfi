INSERT INTO api.ofertas (titulo, descripcion, segmento_objetivo, canal, metrica_etiqueta, metrica_valor, esta_activa, prioridad, condicion_disparo) VALUES
('Hasta 30% en licores', 'Aprovecha hasta 30% de descuento en licores en Olímpica.', 'Compradores recurrentes', 'WhatsApp', 'Clics', '+10%', TRUE, 2, 'Fin de semana'),
('Viernes de Olimpo hasta 45%', 'Disfruta del Viernes de Olimpo con hasta 45% de descuento en seleccionados.', 'Todos', 'WhatsApp', 'Conversión', '+20%', TRUE, 1, 'Día actual es Viernes'),
('Hasta 45% en Aires Acondicionados', 'Refresca tu hogar. Aires Acondicionados Olimpo con hasta 45% de descuento.', 'Compradores de electro', 'Telegram', 'Interés', '+15%', TRUE, 2, 'Clima cálido'),
('Hasta 50% en Televisores', 'Renueva tu TV con hasta 50% de descuento.', 'Renovación de tecnología', 'WhatsApp', 'Clics', '+25%', TRUE, 2, 'Eventos deportivos');

INSERT INTO api.transacciones (cliente_id, medio_pago, monto, comercio, tipo, fecha) VALUES
('maria', 'Tarjeta Olimpica', 2399000.00, 'Tiendas Olimpica - Aire Acondicionado', 'Compra', NOW()),
('maria', 'Tarjeta Olimpica', 1500000.00, 'Tiendas Olimpica - Televisor', 'Compra', NOW()),
('maria', 'Cuenta Ahorros', 120000.00, 'Tiendas Olimpica - Licores', 'Compra', NOW());
