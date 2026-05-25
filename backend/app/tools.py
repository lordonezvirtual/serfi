import os
import requests
from langchain_core.tools import tool
from typing import Dict, Any, List

POSTGREST_URL = os.getenv("POSTGREST_URL", "http://localhost:3000")

# --- 1. TOOL: Consulta de transacciones vía PostgREST ---
@tool
def query_client_transactions(client_id: str, limit: int = 5) -> str:
    """
    Consulta los movimientos transaccionales de un cliente específico en la base de datos de Serfinanza.
    Usa esta herramienta cuando el usuario pregunte por sus últimas compras, retiros o movimientos.
    """
    # Enrutamiento inteligente: intenta PostgREST, si no, usa mock data para robustez
    url = f"{POSTGREST_URL}/transacciones"
    params = {
        "cliente_id": f"eq.{client_id}",
        "order": "fecha.desc",
        "limit": limit
    }
    
    try:
        response = requests.get(url, params=params, timeout=3.0)
        if response.status_code == 200:
            transactions = response.json()
            if not transactions:
                return f"No se encontraron transacciones recientes para el cliente '{client_id}'."
            
            output = f"Movimientos transaccionales recientes ({len(transactions)} transacciones) para '{client_id}':\n"
            for tx in transactions:
                output += f"- {tx.get('fecha', 'N/A')}: {tx.get('descripcion', 'Compra')} | Monto: ${tx.get('monto', 0):,} COP | Estado: {tx.get('estado', 'Completado')}\n"
            return output
        else:
            return _get_mock_transactions(client_id, limit)
    except Exception:
        # Fallback a datos sintéticos locales si el servidor PostgREST no está levantado aún
        return _get_mock_transactions(client_id, limit)


# --- 2. TOOL: Obtener Perfil del CRM (Salesforce / Interno) ---
@tool
def get_client_crm_profile(client_id: str) -> Dict[str, Any]:
    """
    Recupera los datos del cliente desde la base de datos CRM. 
    Contiene información de contacto, edad, segmento y productos activos.
    """
    url = f"{POSTGREST_URL}/clientes"
    params = {"id": f"eq.{client_id}"}
    
    try:
        response = requests.get(url, params=params, timeout=3.0)
        if response.status_code == 200 and response.json() and len(response.json()) > 0:
            client_data = response.json()[0]
            
            # Normalizar nombres de campos para soporte bilingüe (CRM vs DB)
            client_data["name"] = client_data.get("nombre", "Cliente")
            client_data["age"] = client_data.get("edad", 35)
            client_data["city"] = client_data.get("ciudad", "Cali")
            client_data["segment"] = client_data.get("segmento", "Estándar")
            client_data["seniority"] = client_data.get("antiguedad", "0 años")
            
            # Consultar productos del cliente para poblar la lista dinámica
            products = []
            try:
                # 1. Cuentas
                r_cuentas = requests.get(f"{POSTGREST_URL}/cuentas", params={"cliente_id": f"eq.{client_id}"}, timeout=2.0)
                if r_cuentas.status_code == 200:
                    for c in r_cuentas.json():
                        products.append(c.get("tipo_cuenta", "Cuenta"))
                # 2. Tarjetas
                r_tarjetas = requests.get(f"{POSTGREST_URL}/tarjetas", params={"cliente_id": f"eq.{client_id}"}, timeout=2.0)
                if r_tarjetas.status_code == 200:
                    for t in r_tarjetas.json():
                        products.append(t.get("tipo_tarjeta", "Tarjeta"))
            except Exception:
                pass
                
            client_data["products"] = list(set(products)) if products else ["Cuenta Ahorros"]
            return client_data
    except Exception:
        pass
        
    # Mock fallback coincidente con los perfiles del Frontend Angular
    profiles = {
        "maria": {
            "id": "maria",
            "name": "María Amparo Gutiérrez",
            "nombre": "María Amparo Gutiérrez",
            "age": 62,
            "edad": 62,
            "city": "Cali",
            "ciudad": "Cali",
            "segment": "Adulto Mayor",
            "segmento": "Adulto Mayor",
            "seniority": "14 años",
            "antiguedad": "14 años",
            "products": ["Cuenta Ahorros", "Tarjeta Olimpica", "SuperCDT"],
            "preferredChannel": "WhatsApp",
            "tag": "No usa app"
        },
        "carlos": {
            "id": "carlos",
            "name": "Carlos Herrera Díaz",
            "nombre": "Carlos Herrera Díaz",
            "age": 38,
            "edad": 38,
            "city": "Barranquilla",
            "ciudad": "Barranquilla",
            "segment": "Digital Activo",
            "segmento": "Digital Activo",
            "seniority": "6 años",
            "antiguedad": "6 años",
            "products": ["Cuenta Ahorros", "Tarjeta Crédito", "CDT $8M"],
            "preferredChannel": "Telegram",
            "tag": "Cliente frecuente Olimpica"
        }
    }
    return profiles.get(client_id.lower(), {"id": client_id, "name": "Cliente Desconocido", "nombre": "Cliente Desconocido", "segment": "Estándar", "segmento": "Estándar", "products": []})


# --- 3. TOOL: Calcular scoring de crédito ---
@tool
def calculate_credit_scoring(client_id: str) -> str:
    """
    Calcula el scoring crediticio actual del cliente para evaluar aumentos de cupo pre-aprobados.
    """
    profile = get_client_crm_profile.invoke(client_id)
    name = profile.get("name", "Cliente")
    segment = profile.get("segment", "General")
    
    # Intentar obtener cupo y deuda de la tarjeta real del cliente
    cupo_actual = None
    deuda_actual = None
    porcentaje_uso = 0.0
    try:
        r_tarjetas = requests.get(f"{POSTGREST_URL}/tarjetas", params={"cliente_id": f"eq.{client_id}"}, timeout=2.0)
        if r_tarjetas.status_code == 200 and r_tarjetas.json():
            card = r_tarjetas.json()[0]
            cupo_actual = float(card.get("cupo_aprobado", 0))
            deuda_actual = float(card.get("deuda_actual", 0))
            if cupo_actual > 0:
                porcentaje_uso = (deuda_actual / cupo_actual) * 100
    except Exception:
        pass

    # Lógica de scoring en base a la antigüedad y segmento
    if segment == "Adulto Mayor":
        scoring = "A+ (Excelente historial de pago en Olímpica)"
        if cupo_actual is not None:
            increase_val = int(cupo_actual * 0.3)  # 30% increase
            max_increase = f"${increase_val:,} COP"
        else:
            max_increase = "$1,500,000 COP"
        status = "Pre-aprobado disponible"
    elif segment == "Digital Activo" or segment == "endeudado_consumidor" or porcentaje_uso > 60:
        scoring = f"AAA (Uso del {porcentaje_uso:.1f}% del cupo actual, sin moras)" if cupo_actual else "AAA (Excelente uso y comportamiento)"
        if cupo_actual is not None:
            increase_val = int(cupo_actual * 0.3)
            max_increase = f"${increase_val:,} COP"
        else:
            max_increase = "$3,000,000 COP"
        status = "Pre-aprobado de cupo liberado"
    else:
        scoring = "B (Historial estándar)"
        if cupo_actual is not None:
            increase_val = int(cupo_actual * 0.1)  # 10% increase for standard
            max_increase = f"${increase_val:,} COP"
        else:
            max_increase = "$500,000 COP"
        status = "Requiere análisis adicional"
        
    return f"Resultado Scoring para {name} ({client_id}):\n- Calificación: {scoring}\n- Estado de Cupo: {status}\n- Aumento Máximo Sugerido: {max_increase}"


# --- 4. TOOL: Búsqueda Semántica en Base de Conocimientos (RAG) ---
@tool
def search_knowledge_base(query: str, category: str = "Productos bancarios") -> str:
    """
    Busca información oficial en la base de conocimientos RAG de Serfinanza. 
    Ideal para resolver dudas de CDT, tasas de interés, reglamentos, y procedimientos.
    """
    # Base de conocimientos local sembrada para responder sin dependencias
    kb_docs = [
        {
            "title": "Reglamento SuperCDT v3.2",
            "category": "Productos bancarios",
            "content": "El SuperCDT es un producto de inversión a término fijo con plazos de 90, 180 y 360 días. La tasa de interés estándar autorizada es del 12.5% E.A. para retención de fondos superiores a $10 millones de pesos. Cualquier oferta del 13.0% E.A. o superior se considera exención regulada y requiere aprobación excepcional (HITL) del operador."
        },
        {
            "title": "Tarifario Tarjeta Olimpica 2026",
            "category": "Productos bancarios",
            "content": "La Tarjeta de Crédito Olímpica Serfinanza otorga 20% de descuento en el 'Miércoles de Plaza' en frutas y verduras de Supertiendas Olímpica. La cuota de manejo es de $24,900 COP, exenta el primer año para el segmento 'Adulto Mayor'. El cupo rotativo puede ser aumentado de forma proactiva si la utilización histórica supera el 60%."
        },
        {
            "title": "Actualización de datos paso a paso",
            "category": "Procesos operativos",
            "content": "El cambio de dirección o teléfono registrado puede ser solicitado por chat mediante texto o audio de voz. Para mitigar fraudes, cualquier cambio de dirección de correspondencia debe registrarse como tarea HITL y requiere que el operador verifique la firma digital o la grabación de voz provista."
        }
    ]
    
    # Búsqueda simple basada en palabras clave
    query_lower = query.lower()
    results = []
    for doc in kb_docs:
        if category.lower() in doc["category"].lower():
            # Si hay coincidencia de palabras clave
            words = query_lower.split()
            matches = sum(1 for word in words if word in doc["content"].lower() or word in doc["title"].lower())
            if matches > 0:
                results.append(f"[{doc['title']}] ({doc['category']}):\n{doc['content']}")
                
    if not results:
        # Retorna el primer documento de la categoría como fallback amistoso
        for doc in kb_docs:
            if category.lower() in doc["category"].lower():
                return f"[Documento Encontrado] {doc['title']}:\n{doc['content']}"
        return "No se encontró información específica en la base de conocimientos RAG."
        
    return "\n\n---\n\n".join(results)


# --- 5. TOOL: Consultar promociones comerciales ---
@tool
def get_active_promotions(day_of_week: str, segment: str) -> str:
    """
    Retorna las ofertas comerciales activas en el catálogo de Olímpica para un segmento y día de la semana específicos.
    """
    url = f"{POSTGREST_URL}/ofertas"
    params = {
        "esta_activa": "eq.true"
    }
    
    try:
        response = requests.get(url, params=params, timeout=3.0)
        if response.status_code == 200:
            ofertas = response.json()
            if not ofertas:
                return "No hay promociones específicas programadas para hoy."
            
            results = []
            for p in ofertas:
                seg_obj = p.get("segmento_objetivo", "Todos")
                cond = p.get("condicion_disparo", "Todos")
                
                # Validar coincidencia de día según la condición de disparo
                day_match = True
                cond_lower = cond.lower()
                day_lower = day_of_week.lower()
                if "miércoles" in cond_lower and day_lower != "miércoles":
                    day_match = False
                elif "viernes" in cond_lower and day_lower != "viernes":
                    day_match = False
                elif "sábado" in cond_lower and day_lower != "sábado":
                    day_match = False
                elif "fin de semana" in cond_lower and day_lower not in ["sábado", "domingo"]:
                    day_match = False
                
                # Validar coincidencia de segmento objetivo
                seg_match = False
                seg_obj_lower = seg_obj.lower()
                segment_lower = segment.lower()
                if (seg_obj_lower == "todos" or 
                    segment_lower == "todos" or 
                    seg_obj_lower in segment_lower or 
                    segment_lower in seg_obj_lower or
                    (segment_lower == "adulto mayor" and seg_obj_lower == "todos") or
                    ("tarjeta" in seg_obj_lower and ("adulto" in segment_lower or "digital" in segment_lower or "tarjeta" in segment_lower))):
                    seg_match = True
                
                if day_match and seg_match:
                    results.append(f"- {p.get('titulo')}: {p.get('descripcion')}")
            
            if not results:
                return "No hay promociones específicas programadas para hoy, pero puedes utilizar tus descuentos de Tarjeta Olímpica del 10% diario en toda la tienda."
                
            return "Promociones vigentes:\n" + "\n".join(results)
        else:
            return _get_mock_promotions(day_of_week, segment)
    except Exception:
        return _get_mock_promotions(day_of_week, segment)


def _get_mock_promotions(day_of_week: str, segment: str) -> str:
    promos = [
        {"title": "Miércoles de Plaza", "desc": "30% descuento en frutas y verduras de Olímpica pagando con Tarjeta Olímpica.", "day": "Miércoles", "segment": "Todos"},
        {"title": "Sábado Madrugón", "desc": "30% de descuento en electrodomésticos seleccionados.", "day": "Sábado", "segment": "Todos"},
        {"title": "Viernes de Carnes", "desc": "25% de descuento en carnes seleccionadas en Olímpica.", "day": "Viernes", "segment": "Todos"},
        {"title": "Exoneración Senior", "desc": "Exoneración total de cuota de manejo en Tarjeta Olímpica.", "day": "Todos", "segment": "Adulto Mayor"}
    ]
    
    results = []
    for p in promos:
        day_match = day_of_week.lower() == p["day"].lower() or p["day"] == "Todos"
        seg_match = segment.lower() == p["segment"].lower() or p["segment"] == "Todos"
        if day_match and seg_match:
            results.append(f"- {p['title']}: {p['desc']}")
            
    if not results:
        return "No hay promociones específicas programadas para hoy, pero puedes utilizar tus descuentos de Tarjeta Olímpica del 10% diario en toda la tienda."
        
    return "Promociones vigentes:\n" + "\n".join(results)



# --- AUXILIAR: Transacciones sintéticas ---
def _get_mock_transactions(client_id: str, limit: int) -> str:
    maria_txs = [
        {"fecha": "2026-05-22", "descripcion": "COMPRA SUPERTIENDAS OLIMPICA CALI", "monto": 145000, "estado": "Completado"},
        {"fecha": "2026-05-20", "descripcion": "PAGO DE JUBILACION COLPENSIONES", "monto": 1800000, "estado": "Completado"},
        {"fecha": "2026-05-18", "descripcion": "RETIRO CAJERO AUTOMATICO SERFINANZA", "monto": 200000, "estado": "Completado"}
    ]
    
    carlos_txs = [
        {"fecha": "2026-05-23", "descripcion": "COMPRA OLIMPICA BARRANQUILLA PORTAL", "monto": 420000, "estado": "Completado"},
        {"fecha": "2026-05-21", "descripcion": "SUSCRIPCION NETFLIX ONLINE", "monto": 44900, "estado": "Completado"},
        {"fecha": "2026-05-15", "descripcion": "ABONO NOMINA PROVEEDORES", "monto": 3400000, "estado": "Completado"},
        {"fecha": "2026-05-12", "descripcion": "COMPRA RESTAURANTE BARRANQUILLA", "monto": 180000, "estado": "Completado"}
    ]
    
    txs = maria_txs if client_id.lower() == "maria" else (carlos_txs if client_id.lower() == "carlos" else [])
    
    if not txs:
        return f"No se registran transacciones recientes para el cliente '{client_id}'."
        
    output = f"Movimientos transaccionales recientes (Datos Sintéticos) para '{client_id}':\n"
    for tx in txs[:limit]:
        output += f"- {tx['fecha']}: {tx['descripcion']} | Monto: ${tx['monto']:,} COP | Estado: {tx['estado']}\n"
    return output
