import uuid
from fastapi import FastAPI, HTTPException, Request, Response
from twilio.twiml.messaging_response import MessagingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from langchain_core.messages import HumanMessage, AIMessage

from backend.app.database import DatabaseService
from backend.app.graph import compiled_graph

app = FastAPI(
    title="Banco Serfinanza — Agente 360 Backend",
    description="Backend de Agentes Cognitivos y Orquestación Multi-Agente con LangGraph y FastAPI.",
    version="1.0.0"
)

# --- CONFIGURACIÓN DE CORS ---
# Permite que la consola Angular (http://localhost:4200) realice peticiones de forma transparente
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción, acotar a ["http://localhost:4200"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar servicio de Base de Datos
db_service = DatabaseService()

# --- MODELOS DE PETICIÓN Y RESPUESTA (PYDANTIC) ---

from backend.app.biometrics import BehavioralBiometricsAgent

class BiometricSimulationInput(BaseModel):
    typing_speed_wpm: Optional[int] = None
    response_delay_sec: Optional[float] = None
    simulated_hour: Optional[str] = None
    device_type: Optional[str] = None

class ChatRequest(BaseModel):
    client_id: str
    message: str
    history: Optional[List[Dict[str, str]]] = None # [{"sender": "user", "text": "..."}]
    biometric_sim: Optional[BiometricSimulationInput] = None

class ChatResponse(BaseModel):
    agent_name: str
    response: str
    hitl_triggered: bool
    hitl_task_id: Optional[str] = None
    biometric_analysis: Optional[Dict[str, Any]] = None

class HITLApproval(BaseModel):
    operator_notes: Optional[str] = None

# --- ENDPOINTS DE LA API ---

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database_mode": db_service.mode,
        "active_agents": [
            "Orquestador Central",
            "Agente Banca",
            "Agente Perfil 360",
            "Agente Portafolio",
            "Agente Retail Olímpica",
            "Agente UX 50+",
            "Agente Consejero del Bolsillo"
        ]
    }

# Instancia global del Agente Guardián de Identidad
biometrics_agent = BehavioralBiometricsAgent()

# --- HELPER FUNCTIONS FOR DYNAMIC "VECINO OLÍMPICA" RECOMMENDATIONS ---

def get_dynamic_vecino_olimpica_benefit(client_id: str, user_message: str) -> str:
    # 1. Parse day of week from message
    day_of_week = None
    msg_lower = user_message.lower()
    if "miércoles" in msg_lower or "miercoles" in msg_lower:
        day_of_week = "Miércoles"
    elif "viernes" in msg_lower:
        day_of_week = "Viernes"
    elif "sábado" in msg_lower or "sabado" in msg_lower:
        day_of_week = "Sábado"
    elif "domingo" in msg_lower:
        day_of_week = "Domingo"
    elif "lunes" in msg_lower:
        day_of_week = "Lunes"
    elif "martes" in msg_lower:
        day_of_week = "Martes"
    elif "jueves" in msg_lower:
        day_of_week = "Jueves"
        
    if not day_of_week:
        import datetime
        days_es = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        day_of_week = days_es[datetime.datetime.now().weekday()]

    # 2. Get client profile (segment and products)
    try:
        from backend.app.tools import get_client_crm_profile
        profile = get_client_crm_profile(client_id)
    except Exception as e:
        print(f"Error calling get_client_crm_profile: {e}")
        profile = {"segment": "Todos", "products": []}
        
    client_segment = profile.get("segment", "Todos") or "Todos"
    client_products = profile.get("products", []) or []
    
    # Check if the user is a cardholder
    is_cardholder = False
    for prod in client_products:
        prod_lower = prod.lower()
        if "tarjeta" in prod_lower or "olimpica" in prod_lower:
            is_cardholder = True
            break
            
    # 3. Query all active offers from database
    matched_offers = []
    try:
        conn = db_service.get_connection()
        cursor = conn.cursor()
        
        if db_service.mode == "postgres":
            cursor.execute("SELECT id, titulo, descripcion, segmento_objetivo, condicion_disparo, prioridad FROM api.ofertas WHERE esta_activa = true")
        else:
            cursor.execute("SELECT id, titulo, descripcion, segmento_objetivo, condicion_disparo, prioridad FROM hitl_tasks LIMIT 0")
            
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        
        for row in rows:
            off_id, title, description, target_segment, trigger_cond, priority = row
            
            # --- DAY MATCH ---
            day_match = False
            trigger_lower = trigger_cond.lower()
            day_lower = day_of_week.lower()
            
            if "miércoles" in trigger_lower or "miercoles" in trigger_lower:
                if day_lower == "miércoles":
                    day_match = True
            elif "viernes" in trigger_lower:
                if day_lower == "viernes":
                    day_match = True
            elif "sábado" in trigger_lower or "sabado" in trigger_lower:
                if day_lower == "sábado":
                    day_match = True
            elif "fin de semana" in trigger_lower:
                if day_lower in ("sábado", "domingo"):
                    day_match = True
            elif "todos" in trigger_lower or not trigger_lower:
                day_match = True
            else:
                day_match = True
                
            # --- SEGMENT / PRODUCT MATCH ---
            segment_match = False
            target_seg_lower = target_segment.lower()
            client_seg_lower = client_segment.lower()
            
            if target_seg_lower == "todos" or not target_seg_lower:
                segment_match = True
            elif "tarjetahabiente" in target_seg_lower or "tarjeta" in target_seg_lower:
                if is_cardholder:
                    segment_match = True
            elif target_seg_lower in client_seg_lower or client_seg_lower in target_seg_lower:
                segment_match = True
            elif client_seg_lower == "adulto mayor" and target_seg_lower == "todos":
                segment_match = True
                
            # Check if this offer is specifically tied to the active day
            is_day_specific = False
            if day_lower in trigger_lower and "todos" not in trigger_lower:
                is_day_specific = True
                
            if day_match and segment_match:
                matched_offers.append({
                    "id": off_id,
                    "title": title,
                    "description": description,
                    "priority": priority or 3,
                    "is_day_specific": is_day_specific
                })
    except Exception as e:
        print(f"Error querying active offers: {e}")
        
    # 4. Fallback to hardcoded / mock offers if no offers matched or database query failed
    if not matched_offers:
        if day_of_week == "Miércoles":
            matched_offers.append({
                "title": "🛒 Miércoles de Plaza",
                "description": "Descuentos de hasta 30% en frutas y verduras de Supertiendas Olímpica pagando con Tarjeta Olímpica.",
                "priority": 1,
                "is_day_specific": True
            })
        elif day_of_week == "Sábado":
            matched_offers.append({
                "title": "🛍️ Sábado Madrugón",
                "description": "30% de descuento en electrodomésticos y tecnología en Olímpica pagando con tu tarjeta Serfinanza.",
                "priority": 1,
                "is_day_specific": True
            })
        else:
            matched_offers.append({
                "title": "💳 Descuento Diario",
                "description": "10% de descuento en toda la tienda Olímpica en tus compras diarias pagando con tu tarjeta Serfinanza.",
                "priority": 2,
                "is_day_specific": False
            })
            
    # Sort matched offers: day-specific offers first, then by priority
    matched_offers.sort(key=lambda x: (not x.get("is_day_specific", False), x.get("priority", 3)))
    
    best_offer = matched_offers[0]
    title = best_offer["title"]
    description = best_offer["description"]
    
    benefit_text = f"💡 *Vecino Olímpica:* Recuerda tu beneficio para hoy *{day_of_week}*: *{title}* - {description}"
    return benefit_text

def append_benefit_to_response(last_response: str, client_id: str, user_message: str) -> str:
    if client_id != "juliana" and "Vecino Olímpica:" not in last_response:
        benefit = get_dynamic_vecino_olimpica_benefit(client_id, user_message)
        import re
        button_match = re.search(r'\[BOTONES:\s*(.*?)\]', last_response, re.IGNORECASE)
        if button_match:
            parts = last_response.split(button_match.group(0))
            return f"{parts[0].strip()}\n\n{benefit}\n\n{button_match.group(0)}"
        else:
            return f"{last_response.strip()}\n\n{benefit}"
    return last_response

# 1. ENVIAR MENSAJE AL SISTEMA MULTI-AGENTE (CHAT ENGINE)
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    client_id = request.client_id
    user_msg = request.message
    
    # --- EJECUTAR ANÁLISIS DEL GUARDIÁN DE IDENTIDAD INVISIBLE ---
    wpm = request.biometric_sim.typing_speed_wpm if request.biometric_sim else None
    delay = request.biometric_sim.response_delay_sec if request.biometric_sim else None
    hour = request.biometric_sim.simulated_hour if request.biometric_sim else None
    
    biometric_res = biometrics_agent.analyze_message(
        message=user_msg,
        client_id=client_id,
        typing_speed_wpm=wpm,
        response_delay_sec=delay,
        simulated_hour=hour
    )
    
    # Si la biometría invisible detecta una anomalía crítica y decide congelar la cuenta
    if biometric_res["action"] == "freeze_and_hitl":
        hitl_task_id = f"hitl-{uuid.uuid4().hex[:6]}"
        client_name = "María Amparo Gutiérrez" if client_id == "maria" else "Cliente Serfinanza"
        client_segment = "Adulto Mayor" if client_id == "maria" else "Digital"
        
        # Unir todas las banderas detectadas
        all_flags = (
            biometric_res["metrics"]["stylometry"]["flags"] + 
            biometric_res["metrics"]["timing"]["flags"] + 
            biometric_res["metrics"]["access"]["flags"]
        )
        flags_desc = " | ".join(all_flags) if all_flags else "Desviación crítica en la autenticación continua silenciosa."
        
        task_data = {
            "id": hitl_task_id,
            "client_name": client_name,
            "client_segment": client_segment,
            "agent_name": "Guardián de Identidad",
            "task_type": "Bloqueo Biométrico",
            "description": f"Intento de suplantación detectado en WhatsApp. Confianza biométrica al {biometric_res['trust_score']}%. Alertas: {flags_desc}",
            "original_value": "Acceso Libre",
            "proposed_value": "CUENTA CONGELADA",
            "confidence": int(90 + (100 - biometric_res["trust_score"]) * 0.1),
            "status": "pending",
            "hace_cuanto": "Hace unos instantes",
            "notas_operador": None,
            "documento_rag": "Políticas de Autenticación Continua v1.1",
            "audio_voz": False,
            "transcripcion_dialogo": f"Impostor: \"{user_msg}\"\n(Cadencia: {wpm or 450} WPM, Retardo: {delay or 2.1}s, Hora: {hour or '02:00 AM'})"
        }
        
        # Registrar la tarea en la base de datos
        db_service.create_hitl_task(task_data)
        
        # Retornar mensaje de bloqueo directamente, protegiendo el backend
        return ChatResponse(
            agent_name="Guardián de Identidad",
            response=(
                "⚠️ *[ALERTA DE SEGURIDAD BANCARIA]* ⚠️\n\n"
                "Hemos detectado un comportamiento inusual y no compatible con su patrón histórico de interacción (cadencia de escritura, horario y estilo estilométrico).\n\n"
                "Por su seguridad y de acuerdo a nuestras políticas de *Autenticación Continua Invisible*, "
                "hemos *congelado preventivamente* el acceso a datos sensibles y transacciones en este chat.\n\n"
                "Un supervisor de Banco Serfinanza está verificando este incidente. El servicio se reactivará una vez finalizada la auditoría."
            ),
            hitl_triggered=True,
            hitl_task_id=hitl_task_id,
            biometric_analysis=biometric_res
        )

    # 1. Preparar el historial de mensajes para LangGraph
    messages = []
    if request.history:
        for msg in request.history:
            if msg.get("sender") == "user":
                messages.append(HumanMessage(content=msg.get("text", "")))
            else:
                messages.append(AIMessage(content=msg.get("text", "")))
                
    # Agregar el mensaje actual del usuario
    messages.append(HumanMessage(content=user_msg))
    
    # 2. Invocar la ejecución del Grafo de Estado de LangGraph
    state_input = {
        "messages": messages,
        "next_agent": None,
        "client_id": client_id,
        "hitl_requested": False,
        "hitl_task": None,
        "context": {}
    }
    
    try:
        final_state = compiled_graph.invoke(state_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en la ejecución del grafo multi-agente: {str(e)}")
    
    # 3. Extraer la última respuesta y datos HITL del grafo
    response_messages = final_state.get("messages", [])
    last_response = response_messages[-1].content if response_messages else "Lo siento, no pude procesar la solicitud."
    
    # Determinar qué agente generó la respuesta
    active_agent = final_state.get("next_agent") or "Orquestador Central"

    # --- VECINO OLÍMPICA: BENEFICIO PERSONALIZADO AL FINAL DE LA RESPUESTA ---
    last_response = append_benefit_to_response(last_response, client_id, user_msg)
    
    # Manejar solicitud HITL si el agente la activó
    hitl_triggered = final_state.get("hitl_requested", False)
    hitl_task_id = None
    
    if hitl_triggered and final_state.get("hitl_task"):
        task_data = final_state["hitl_task"]
        # Asignar un ID único a la tarea
        task_data["id"] = f"hitl-{uuid.uuid4().hex[:6]}"
        task_data["status"] = "pending"
        hitl_task_id = task_data["id"]
        
        # Persistir la tarea HITL en la base de datos (PostgreSQL/SQLite)
        db_service.create_hitl_task(task_data)
        
    return ChatResponse(
        agent_name=active_agent,
        response=last_response,
        hitl_triggered=hitl_triggered,
        hitl_task_id=hitl_task_id,
        biometric_analysis=biometric_res
    )

# 2. OBTENER TODAS LAS TAREAS HITL (COLA DE APROBACIONES)
@app.get("/api/hitl/tasks")
async def get_all_tasks():
    try:
        return db_service.get_all_hitl_tasks()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener las tareas HITL: {str(e)}")

# 3. APROBAR TAREA HITL
@app.post("/api/hitl/tasks/{task_id}/approve")
async def approve_hitl_task(task_id: str, approval: HITLApproval):
    try:
        db_service.update_hitl_task_status(task_id, "approved", approval.operator_notes or "Aprobado sin observaciones.")
        return {"status": "success", "message": f"Tarea {task_id} marcada como APROBADA con éxito."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar la aprobación: {str(e)}")

# 4. RECHAZAR TAREA HITL
@app.post("/api/hitl/tasks/{task_id}/reject")
async def reject_hitl_task(task_id: str, rejection: HITLApproval):
    try:
        db_service.update_hitl_task_status(task_id, "rejected", rejection.operator_notes or "Rechazado por políticas del operador.")
        return {"status": "success", "message": f"Tarea {task_id} marcada como RECHAZADA con éxito."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el rechazo: {str(e)}")

# --- REAL-TIME PORTFOLIO AGENT (AGENT #6) ENDPOINTS ---

class ScrapeRequest(BaseModel):
    url: str
    force_rate_change: Optional[float] = None
    force_benefit_change: Optional[str] = None

class TranslateRequest(BaseModel):
    technical_text: str

def mock_translate_fallback(text: str) -> str:
    t = text.lower()
    if "10.25%" in t or "90 días" in t or "90 dias" in t:
        return (
            "👵 *¡Hola mi señora linda!* Qué alegría saludarla hoy. 🌸\n\n"
            "Para los *3 meses* (90 días) por los que me pregunta, nuestro banco le ofrece una tasa maravillosa del *10.25% E.A.* "
            "Eso significa, en palabras sencillas, que por cada monedita que guarde con nosotros, su *platica ganará de forma muy segura* un rendimiento muy bonito. "
            "Es como sembrar una semillita y verla crecer sin riesgos. ¡Su platica estará durmiendo segura mientras gana dinero para sus gustos o sus nietos!\n\n"
            "¿Le gustaría que le ayude a ver cuánto ganaría con sus ahorros hoy mismo, mi señora linda?"
        )
    elif "12.5" in t or "360 días" in t or "360 dias" in t or "13.5" in t:
        rate = "13.50% E.A." if "13.5" in t else "12.50% E.A."
        return (
            "👴 *¡Hola mi estimado caballero!* Qué gusto saludarlo en este lindo día. 👔\n\n"
            "Si decide guardar sus ahorros con nosotros durante *un año completo* (360 días), le tenemos una noticia excelente: "
            "su dinero ganará una tasa súper especial del *" + rate + "*.\n\n"
            "Esto significa que su platica estará *totalmente protegida y creciendo a paso firme*. Por ejemplo, si decide guardar su platica en el *Súper CDT Olímpica*, "
            "al final del año recibirá sus ahorros completitos más un extra muy generoso para que disfrute con total tranquilidad.\n\n"
            "¿Desea que le hagamos una simulación exacta con el monto que tiene pensado invertir?"
        )
    elif "olimpica" in t or "beneficio" in t or "tarjeta" in t:
        return (
            "🛍️ *¡Mi señora linda, excelentes noticias para sus compras!* 🛍️\n\n"
            "Al usar su *Tarjeta Olímpica Serfinanza*, el supermercado Olímpica le da un descuento maravilloso del *30% en electrodomésticos* todos los sábados madrugones. "
            "Eso quiere decir que si ve una nevera o un televisor para el hogar, ¡se ahorra un dineral de una vez! "
            "Además, los miércoles de plaza le devuelven el *20% en las verduritas y frutas frescas* para la sopita de la familia.\n\n"
            "¡Es un gran alivio para el bolsillo y su platica rinde mucho más!"
        )
    else:
        return (
            "👵 *¡Hola mi señora linda!* Qué alegría saludarla. 💙\n\n"
            "Le traduzco esto en palabras bien sencillas de entender: el banco le ofrece un beneficio muy especial para su *Tarjeta Olímpica* o su *CDT*. "
            "Esto significa que *su platica estará muy segura*, rindiendo buenos frutos sin ningún cobro raro o sorpresa oculta en la app.\n\n"
            "Recuerde que aquí estoy para consentirla y explicarle todo despacito. ¿Tiene alguna otra dudita de sus cuentas, mi reina?"
        )

@app.post("/api/portfolio/scrape")
async def portfolio_scrape(request: ScrapeRequest):
    import time
    time.sleep(1.0) # Simular latencia de scrape
    
    scraped_data = {
        "source": request.url,
        "scraped_at": "Hoy en Tiempo Real",
        "raw_elements_found": 24,
        "detected_changes": False,
        "extracted_rates": [
            {"product": "Súper CDT Olímpica 90 días", "rate": "10.25% E.A.", "old_rate": "10.25% E.A."},
            {"product": "Súper CDT Olímpica 180 días", "rate": "11.50% E.A.", "old_rate": "11.50% E.A."},
            {"product": "Súper CDT Olímpica 360 días", "rate": "12.50% E.A.", "old_rate": "12.50% E.A."},
            {"product": "Cuenta de Ahorros Estándar", "rate": "3.00% E.A.", "old_rate": "3.00% E.A."},
        ],
        "extracted_benefits": [
            {"product": "Tarjeta Olímpica", "benefit": "30% descuento en electrodomésticos en Sábado Madrugón.", "status": "Vigente"},
            {"product": "Tarjeta Olímpica", "benefit": "20% descuento en frutas y verduras en Miércoles de Plaza.", "status": "Vigente"},
            {"product": "Tarjeta Olímpica", "benefit": "15% descuento exclusivo en Droguerías Olímpica.", "status": "Vigente"}
        ]
    }
    
    if request.force_rate_change is not None:
        scraped_data["detected_changes"] = True
        for r in scraped_data["extracted_rates"]:
            if "360 días" in r["product"]:
                r["old_rate"] = "12.50% E.A."
                r["rate"] = f"{request.force_rate_change:.2f}% E.A."
                
    if request.force_benefit_change:
        scraped_data["detected_changes"] = True
        scraped_data["extracted_benefits"].append({
            "product": "Tarjeta Olímpica",
            "benefit": request.force_benefit_change,
            "status": "¡NUEVO BENEFICIO DETECTADO!"
        })
        
    return scraped_data

@app.post("/api/portfolio/translate")
async def portfolio_translate(request: TranslateRequest):
    text = request.technical_text
    from backend.app.agents import llm, OPENAI_API_KEY
    from langchain_core.messages import SystemMessage, HumanMessage
    
    prompt = f"""Actúas como el Traductor de Lenguaje Claro para el Adulto Mayor de Banco Serfinanza. 
Tu misión es recibir una tasa de interés, tarifa o beneficio financiero sumamente técnico y frío (ej. 'Tasa CDT 90 días: 10.25% E.A., exención del GMF 4x1000 hasta 3 UVT') 
y traducirlo a un lenguaje conversacional, sumamente amigable, cariñoso y fácil de comprender para una persona de la tercera edad (50+ o abuelitos) en WhatsApp.

REGLAS DE TRADUCCIÓN:
1. Sé sumamente cordial, paciente y familiar. Saluda con respeto y cariño (usa términos como 'mi señora linda', 'mi señor lindo', 'mijo', 'tu platica', 'dinerito seguro').
2. Destaca los datos clave en negritas de WhatsApp (`*texto*`, un solo asterisco) para facilitar la lectura. NUNCA uses `**texto**`.
3. Evita acrónimos (como 'E.A.', 'GMF', 'UVT') y explícalos de forma sencilla (ej: 'E.A.' significa 'Tasa efectiva anual, que es lo que tu dinero ganará de verdad en un año completo').
4. Da tranquilidad y seguridad.

Texto técnico a traducir:
"{text}"

Escribe únicamente la traducción amigable, lista para ser enviada por WhatsApp:"""

    try:
        if OPENAI_API_KEY != "mock-key-for-offline-demo":
            response = llm.invoke([SystemMessage(content=prompt), HumanMessage(content="Traduce por favor")])
            translation = response.content
        else:
            translation = mock_translate_fallback(text)
    except Exception:
        translation = mock_translate_fallback(text)
        
    return {"translation": translation}

def sync_whatsapp_user_to_api_schema(from_number: str) -> str:
    """
    Limpia el número de celular de WhatsApp, consulta si pertenece a un cliente en public.clientes
    y aprovisiona dinámicamente sus datos en las tablas api.* si no están ya presentes.
    Retorna el client_id correspondiente.
    """
    import datetime
    # Extraer dígitos numéricos
    digits = "".join(c for c in from_number if c.isdigit())
    if not digits:
        return "maria"
        
    # Obtener los últimos 10 dígitos para el mapeo celular estándar en Colombia
    local_phone = digits[-10:] if len(digits) >= 10 else digits
    
    conn = None
    try:
        conn = db_service.get_connection()
        cursor = conn.cursor()
        
        # 1. Consultar public.clientes
        cursor.execute("""
            SELECT id_cliente, primer_nombre, primer_apellido, email, segmento_arquetipo, fecha_nacimiento, ciudad_residencia
            FROM public.clientes
            WHERE telefono_celular = %s OR telefono_celular LIKE %s
        """, (local_phone, f"%{local_phone}"))
        row = cursor.fetchone()
        
        if not row:
            cursor.close()
            conn.close()
            # En caso de no existir o ser casos de prueba, retornar 'maria' por defecto
            return "maria"
            
        id_cliente, primer_nombre, primer_apellido, email, segmento_arquetipo, fecha_nacimiento, ciudad_residencia = row
        client_id = f"cliente_{id_cliente}"
        
        # 2. Validar si ya existe en api.clientes
        cursor.execute("SELECT id FROM api.clientes WHERE id = %s", (client_id,))
        exists = cursor.fetchone()
        
        if not exists:
            # Calcular la edad del cliente
            birth_year = fecha_nacimiento.year if isinstance(fecha_nacimiento, datetime.date) else 1980
            age = 2026 - birth_year
            
            # Formatear el nombre del segmento a los estándares esperados
            mapped_segment = "Digital Activo"
            if segmento_arquetipo:
                if "ahorrador" in segmento_arquetipo.lower() or "preferencial" in segmento_arquetipo.lower():
                    mapped_segment = "Digital Activo"
                elif "adulto" in segmento_arquetipo.lower() or "pensionado" in segmento_arquetipo.lower():
                    mapped_segment = "Adulto Mayor"
                elif "corporativo" in segmento_arquetipo.lower() or "premium" in segmento_arquetipo.lower():
                    mapped_segment = "Cliente Preferencial"
                elif "endeudado" in segmento_arquetipo.lower():
                    mapped_segment = "Digital Activo"
                    
            # Insertar en api.clientes
            cursor.execute("""
                INSERT INTO api.clientes (
                    id, nombre, email, edad, ciudad, segmento, antiguedad, canal_preferido, etiqueta, es_asesor, scoring_crediticio
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (
                client_id,
                f"{primer_nombre} {primer_apellido}",
                email or f"{primer_nombre.lower()}@ejemplo.com",
                age,
                ciudad_residencia or "Barranquilla",
                mapped_segment,
                "5 años",
                "WhatsApp",
                "Usuario Registrado WhatsApp",
                False,
                750
            ))
            
            # 3. Consultar productos del cliente en public.productos
            cursor.execute("""
                SELECT id_producto, tipo_producto, subtipo, cupo_o_monto_inicial, saldo_actual
                FROM public.productos
                WHERE id_cliente = %s
            """, (id_cliente,))
            products = cursor.fetchall()
            
            for p in products:
                id_prod, tipo_prod, subtipo, cupo_init, saldo_act = p
                if tipo_prod == 'tarjeta_credito':
                    # Obtener detalles de tarjeta
                    cursor.execute("""
                        SELECT cupo_total, saldo_utilizado
                        FROM public.tarjetas_detalle
                        WHERE id_producto = %s
                    """, (id_prod,))
                    card_row = cursor.fetchone()
                    cupo_aprobado = float(card_row[0]) if card_row else float(cupo_init)
                    deuda_actual = float(card_row[1]) if card_row else float(saldo_act)
                    
                    card_num = f"5043-XXXX-XXXX-{str(id_prod).zfill(4)}"
                    cursor.execute("""
                        INSERT INTO api.tarjetas (cliente_id, numero_tarjeta, tipo_tarjeta, cupo_aprobado, deuda_actual, estado)
                        VALUES (%s, %s, %s, %s, %s, 'Activa')
                        ON CONFLICT (numero_tarjeta) DO NOTHING;
                    """, (client_id, card_num, subtipo.capitalize() if subtipo else "Tarjeta Olímpica", cupo_aprobado, deuda_actual))
                    
                elif tipo_prod in ('cuenta_ahorros', 'ahorros', 'corriente', 'cdt'):
                    tasa = 1.5
                    tipo_cuenta = "Cuenta Ahorros"
                    if tipo_prod == 'cdt':
                        tipo_cuenta = "SuperCDT"
                        cursor.execute("""
                            SELECT tasa_ea_aplicada FROM public.cdt_detalle WHERE id_producto = %s
                        """, (id_prod,))
                        cdt_row = cursor.fetchone()
                        tasa = float(cdt_row[0]) if cdt_row else 12.5
                        
                    acc_num = f"AC-{str(id_prod).zfill(6)}"
                    cursor.execute("""
                        INSERT INTO api.cuentas (cliente_id, numero_cuenta, tipo_cuenta, saldo, tasa_ea)
                        VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (numero_cuenta) DO NOTHING;
                    """, (client_id, acc_num, tipo_cuenta, float(saldo_act), tasa))
            
            # 4. Copiar últimas transacciones desde public.transacciones
            cursor.execute("""
                SELECT p.tipo_producto, t.monto, t.comercio_descripcion, t.tipo_movimiento, t.fecha_transaccion
                FROM public.transacciones t
                JOIN public.productos p ON t.id_producto = p.id_producto
                WHERE t.id_cliente = %s
                ORDER BY t.fecha_transaccion DESC, t.hora_transaccion DESC
                LIMIT 5
            """, (id_cliente,))
            txs = cursor.fetchall()
            for tx in txs:
                tipo_prod, monto, comercio, tipo_mov, fecha = tx
                medio = "Tarjeta Olímpica" if tipo_prod == 'tarjeta_credito' else "Cuenta Ahorros"
                cursor.execute("""
                    INSERT INTO api.transacciones (cliente_id, medio_pago, monto, comercio, tipo, fecha)
                    VALUES (%s, %s, %s, %s, %s, %s);
                """, (client_id, medio, float(monto), comercio or "Olímpica", tipo_mov or "Compra", fecha))
                
            conn.commit()
            
        cursor.close()
        conn.close()
        return client_id
    except Exception as e:
        print(f"Error al sincronizar dinámicamente cliente de WhatsApp: {e}")
        if conn:
            try:
                conn.close()
            except Exception:
                pass
        return "maria"

# In-memory dictionary for Twilio sessions (WhatsApp history)
twilio_sessions = {}

@app.post("/api/webhooks/twilio")
async def twilio_webhook(request: Request):
    form_data = await request.form()
    incoming_msg = form_data.get("Body", "")
    from_number = form_data.get("From", "")
    
    # Identificar cliente dinámicamente
    if "555" in from_number:  # Para casos de prueba/demo fijos
        client_id = "maria"
    else:
        client_id = sync_whatsapp_user_to_api_schema(from_number)
        
    # Validar si el Guardián de Identidad debe actuar aquí también
    # Para simplicidad en este canal, pasaremos directo al orquestador o 
    # se podría invocar el endpoint de biometría si hubiese datos
    
    # Recuperar historial
    history = twilio_sessions.get(client_id, [])
    
    messages = []
    for msg in history:
        if msg.get("sender") == "user":
            messages.append(HumanMessage(content=msg.get("text", "")))
        else:
            messages.append(AIMessage(content=msg.get("text", "")))
            
    # Añadir mensaje actual
    messages.append(HumanMessage(content=incoming_msg))
    
    # Añadir el actual a la sesión en memoria
    history.append({"sender": "user", "text": incoming_msg})
    
    state_input = {
        "messages": messages,
        "next_agent": None,
        "client_id": client_id,
        "hitl_requested": False,
        "hitl_task": None,
        "context": {}
    }
    
    try:
        final_state = compiled_graph.invoke(state_input)
        response_messages = final_state.get("messages", [])
        last_response = response_messages[-1].content if response_messages else "Lo siento, no pude procesar la solicitud."
        
        # --- VECINO OLÍMPICA: BENEFICIO PERSONALIZADO AL FINAL DE LA RESPUESTA ---
        last_response = append_benefit_to_response(last_response, client_id, incoming_msg)
        
        # Guardar respuesta del bot en la sesión
        history.append({"sender": "bot", "text": last_response})
        twilio_sessions[client_id] = history
        
        # --- PERSISTIR TAREA HUMAN-IN-THE-LOOP SI SE ACTIVÓ DESDE TWILIO ---
        hitl_triggered = final_state.get("hitl_requested", False)
        if hitl_triggered and final_state.get("hitl_task"):
            import uuid
            task_data = final_state["hitl_task"]
            task_data["id"] = f"hitl-{uuid.uuid4().hex[:6]}"
            task_data["langgraph_thread_id"] = client_id
            try:
                db_service.create_hitl_task(task_data)
                print(f"Tarea HITL persistida correctamente para {client_id}")
            except Exception as hitl_err:
                print(f"Error persistiendo tarea HITL desde Twilio: {hitl_err}")
                
        active_agent = final_state.get("next_agent") or "Orquestador Central"
        
        # --- ACTUALIZAR DASHBOARD EN BASE DE DATOS ---
        try:
            conn = db_service.get_connection()
            cursor = conn.cursor()
            if db_service.mode == "postgres":
                cursor.execute("""
                    UPDATE api.dashboard_kpis 
                    SET active_conversations = active_conversations + 1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = 1
                """)
                cursor.execute("""
                    UPDATE api.dashboard_integrations
                    SET calls_today = calls_today + 1
                    WHERE name = 'WhatsApp Business API'
                """)
                cursor.execute("""
                    UPDATE api.dashboard_agents
                    SET queries_today = queries_today + 1
                    WHERE name = %s
                """, (active_agent,))
                conn.commit()
            cursor.close()
            conn.close()
        except Exception as db_err:
            print(f"Error actualizando métricas del dashboard desde Twilio: {db_err}")
            
    except Exception as e:
        print(f"Error procesando mensaje de WhatsApp: {e}")
        last_response = "En este momento estamos experimentando intermitencias. Por favor intente en unos minutos."
        
    # Responder a Twilio usando TwiML
    resp = MessagingResponse()
    resp.message(last_response)
    
    return Response(content=str(resp), media_type="application/xml")


