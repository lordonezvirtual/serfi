import uuid
from fastapi import FastAPI, HTTPException
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
                "⚠️ **[ALERTA DE SEGURIDAD BANCARIA]** ⚠️\n\n"
                "Hemos detectado un comportamiento inusual y no compatible con su patrón histórico de interacción (cadencia de escritura, horario y estilo estilométrico).\n\n"
                "Por su seguridad y de acuerdo a nuestras políticas de **Autenticación Continua Invisible**, "
                "hemos **congelado preventivamente** el acceso a datos sensibles y transacciones en este chat.\n\n"
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
    if client_id != "juliana" and "Vecino Olímpica:" not in last_response:
        benefit = ""
        try:
            conn = db_service.get_connection()
            cursor = conn.cursor()
            
            # Query recent transactions of the client
            if db_service.mode == "postgres":
                cursor.execute("SELECT comercio FROM api.transacciones WHERE cliente_id = %s ORDER BY fecha DESC LIMIT 10", (client_id,))
            else:
                cursor.execute("SELECT comercio FROM transacciones WHERE cliente_id = ? ORDER BY fecha DESC LIMIT 10", (client_id,))
                
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            
            has_drogueria = False
            has_hogar = False
            has_groceries = False
            
            for row in rows:
                comercio = row[0].lower() if row[0] else ""
                if "drogueria" in comercio or "droguería" in comercio or "farmacia" in comercio:
                    has_drogueria = True
                elif "sao" in comercio or "hogar" in comercio or "electro" in comercio or "madrugón" in comercio or "madrugon" in comercio:
                    has_hogar = True
                elif "olimpica" in comercio or "olímpica" in comercio or "tienda" in comercio or "supermercado" in comercio:
                    has_groceries = True
                    
            if has_drogueria:
                benefit = "💡 **Vecino Olímpica:** Recuerda que tienes un **15% de descuento exclusivo en Droguerías Olímpica** en tu próxima compra de medicamentos pagando con tu tarjeta Serfinanza."
            elif has_hogar:
                benefit = "💡 **Vecino Olímpica:** Recuerda que este sábado de madrugón tienes **30% de descuento en electrodomésticos y tecnología** en Olímpica pagando con tu tarjeta Serfinanza."
            elif has_groceries:
                benefit = "💡 **Vecino Olímpica:** Recuerda que hoy miércoles de plaza tienes **20% de descuento en las verduras de Olímpica** pagando con tu tarjeta Serfinanza."
        except Exception as e:
            print(f"Error querying transactions for Vecino Olimpica backend: {e}")
            
        if not benefit:
            if client_id == 'maria':
                benefit = "💡 **Vecino Olímpica:** Recuerda que hoy miércoles de plaza tienes **20% de descuento en las verduras de Olímpica** pagando con tu tarjeta Serfinanza."
            elif client_id == 'carlos':
                benefit = "💡 **Vecino Olímpica:** Recuerda que este sábado de madrugón tienes **30% de descuento en electrodomésticos y tecnología** en Olímpica pagando con tu tarjeta Serfinanza."
            else:
                benefit = "💡 **Vecino Olímpica:** Recuerda que tienes un **10% de descuento en toda la tienda Olímpica** en tus compras diarias pagando con tu tarjeta Serfinanza."
                
        # Insert before [BOTONES: ...] if present, otherwise append
        import re
        button_match = re.search(r'\[BOTONES:\s*(.*?)\]', last_response, re.IGNORECASE)
        if button_match:
            parts = last_response.split(button_match.group(0))
            last_response = f"{parts[0].strip()}\n\n{benefit}\n\n{button_match.group(0)}"
        else:
            last_response = f"{last_response.strip()}\n\n{benefit}"
    
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
            "👵 **¡Hola mi señora linda!** Qué alegría saludarla hoy. 🌸\n\n"
            "Para los **3 meses** (90 días) por los que me pregunta, nuestro banco le ofrece una tasa maravillosa del **10.25% E.A.** "
            "Eso significa, en palabras sencillas, que por cada monedita que guarde con nosotros, su **platica ganará de forma muy segura** un rendimiento muy bonito. "
            "Es como sembrar una semillita y verla crecer sin riesgos. ¡Su platica estará durmiendo segura mientras gana dinero para sus gustos o sus nietos!\n\n"
            "¿Le gustaría que le ayude a ver cuánto ganaría con sus ahorros hoy mismo, mi señora linda?"
        )
    elif "12.5" in t or "360 días" in t or "360 dias" in t or "13.5" in t:
        rate = "13.50% E.A." if "13.5" in t else "12.50% E.A."
        return (
            "👴 **¡Hola mi estimado caballero!** Qué gusto saludarlo en este lindo día. 👔\n\n"
            "Si decide guardar sus ahorros con nosotros durante **un año completo** (360 días), le tenemos una noticia excelente: "
            "su dinero ganará una tasa súper especial del **" + rate + "**.\n\n"
            "Esto significa que su platica estará **totalmente protegida y creciendo a paso firme**. Por ejemplo, si decide guardar su platica en el **Súper CDT Olímpica**, "
            "al final del año recibirá sus ahorros completitos más un extra muy generoso para que disfrute con total tranquilidad.\n\n"
            "¿Desea que le hagamos una simulación exacta con el monto que tiene pensado invertir?"
        )
    elif "olimpica" in t or "beneficio" in t or "tarjeta" in t:
        return (
            "🛍️ **¡Mi señora linda, excelentes noticias para sus compras!** 🛍️\n\n"
            "Al usar su **Tarjeta Olímpica Serfinanza**, el supermercado Olímpica le da un descuento maravilloso del **30% en electrodomésticos** todos los sábados madrugones. "
            "Eso quiere decir que si ve una nevera o un televisor para el hogar, ¡se ahorra un dineral de una vez! "
            "Además, los miércoles de plaza le devuelven el **20% en las verduritas y frutas frescas** para la sopita de la familia.\n\n"
            "¡Es un gran alivio para el bolsillo y su platica rinde mucho más!"
        )
    else:
        return (
            "👵 **¡Hola mi señora linda!** Qué alegría saludarla. 💙\n\n"
            "Le traduzco esto en palabras bien sencillas de entender: el banco le ofrece un beneficio muy especial para su **Tarjeta Olímpica** o su **CDT**. "
            "Esto significa que **su platica estará muy segura**, rindiendo buenos frutos sin ningún cobro raro o sorpresa oculta en la app.\n\n"
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
2. Destaca los datos clave en negritas (`**`) para facilitar la lectura.
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

