import os
from typing import Dict, Any, List
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from backend.app.tools import (
    query_client_transactions,
    get_client_crm_profile,
    calculate_credit_scoring,
    search_knowledge_base,
    get_active_promotions
)

# Cargar variables de entorno del archivo .env
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

# --- INICIALIZACIÓN DEL LLM ---
# Se utiliza GPT-4o por defecto, con fallback a una clave de prueba o entorno local
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "mock-key-for-offline-demo")
model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")

if OPENAI_API_KEY == "mock-key-for-offline-demo":
    print("⚠️  ATENCIÓN: Iniciando en modo LOCAL SIMULADO (MockLLM). No se está utilizando OpenAI.")
    # Creación de un Mock LLM para evitar errores de red durante el desarrollo local sin API Keys
    class MockLLM:
        def invoke(self, messages: List[Any], tools: List[Any] = None) -> AIMessage:
            last_msg = messages[-1].content.lower() if messages else ""
            system_msg = next((m.content for m in messages if isinstance(m, SystemMessage)), "")
            
            # Determinar si el contexto es para Maria o Carlos
            is_maria = any("maria" in m.content.lower() for m in messages if isinstance(m, HumanMessage))
            client_id = "maria" if is_maria else "carlos"
            
            # --- Respuestas simuladas inteligentes basadas en el rol y el mensaje de entrada ---
            
            # 0. Caso: Orquestador Central (Supervisor)
            if "orquestador empático" in system_msg.lower():
                if "saldo" in last_msg or "compras" in last_msg or "movimientos" in last_msg or "si" in last_msg or "sí" in last_msg or "claro" in last_msg or "por favor" in last_msg:
                    return AIMessage(content="[ROUTE] Agente Banca | Solicitud de saldos, cuentas o movimientos.")
                if "cupo" in last_msg or "aumento" in last_msg:
                    return AIMessage(content="[ROUTE] Agente Perfil 360 | Análisis de scoring crediticio y aumento de cupo.")
                if "cdt" in last_msg or "tasa" in last_msg:
                    return AIMessage(content="[ROUTE] Agente Portafolio | Consulta RAG de tasas de inversión y CDT.")
                if "promocion" in last_msg or "oferta" in last_msg or "madrugón" in last_msg:
                    return AIMessage(content="[ROUTE] Agente Retail Olímpica | Consulta de promociones del catálogo Olímpica.")
                if "dirección" in last_msg or "mudé" in last_msg or "audio" in last_msg or "señora" in last_msg or "pañal" in last_msg or "nieto" in last_msg or "olimpica" in last_msg or "olímpica" in last_msg or "miso" in last_msg or "mijo" in last_msg:
                    return AIMessage(content="[ROUTE] Agente UX 50+ | Transcripción, simplificación y accesibilidad.")
                if "cuota" in last_msg or "manejo" in last_msg or "interés" in last_msg or "cobro" in last_msg or "alivio" in last_msg:
                    return AIMessage(content="[ROUTE] Agente Consejero del Bolsillo | Consulta de alivios de cuotas, intereses o cobros de manejo.")
                
                return AIMessage(content="**Orquestador Central**: Bienvenido a Banco Serfinanza Agente 360. ¿En qué puedo colaborar contigo hoy? Puedo ayudarte a verificar tu saldo, consultar aumentos de cupo, simular CDTs, revisar tu cuota de manejo o ver las promociones de Olímpica.")

            # 1. Caso: Agente UX 50+ (Simplificación, Audio y Orquestación Empática)
            elif "experto en accesibilidad" in system_msg.lower():
                if "avenida 3 norte" in last_msg or "cali" in last_msg:
                    return AIMessage(content="**Agente UX 50+**: Mi señora María Amparo, ¡qué alegría saludarla! Claro que sí, ya he tomado atenta nota de su nueva casita en la **Avenida 3 Norte # 23-45, Apartamento 402 en Cali**. Como es un trámite muy importante para su seguridad, lo he enviado a nuestro revisor de confianza. Tan pronto él dé su firma aprobatoria, le llegará un mensajito de confirmación a este WhatsApp. ¿Le puedo ayudar en algo más, mi señora linda?")
                if "pañal" in last_msg or "nieto" in last_msg or "olimpica" in last_msg or "olímpica" in last_msg or "miso" in last_msg or "mijo" in last_msg:
                    return AIMessage(content="**Agente UX 50+**: ¡Hola mi señora María Amparo! Qué alegría saludarla hoy. 💙 No se me preocupe por nada, que aquí estoy para servirle con todo el cariño del mundo. ¡Esos nietecitos consentidos son la alegría de la casa y merecen lo mejor! 👶✨\n\nYa mismo revisé con toda la paciencia su **Tarjeta Olímpica Serfinanza** y le tengo una hermosa noticia: su compra de los pañales en la Olímpica por un valor de **$87,000 COP** pasó perfectamente y ya está registrada. ¡Todo salió muy bien!\n\nPara su total tranquilidad, el saldo que le queda libre en su tarjeta es de **$4,500,000 COP** para que siga comprando lo que necesite, y en su Cuenta de Ahorros tiene guardados **$1,847,320 COP** completitos.\n\n¿Le gustaría que le ayude a ver algún otro movimiento de sus cuentas, o prefiere que la comunique con uno de nuestros asesores para charlar más despacio, mi señora linda?")
                return AIMessage(content="**Agente UX 50+**: Hola, gusto en saludarte. Mi trabajo es hacer que tu banca sea sumamente simple y clara de entender. ¿De qué producto bancario o beneficio te gustaría que charlemos hoy en un lenguaje sencillo?")

            # 2. Caso: Agente Banca (Saldos y Transacciones)
            elif "especialidad son las cuentas" in system_msg.lower():
                if "saldo" in last_msg:
                    if is_maria:
                        return AIMessage(content="**Agente Banca**: Consultando tu saldo en el Core Bancario...\n- **Cuenta de Ahorros**: $2,540,000 COP disponibles.\n- **Tarjeta de Crédito Olímpica**: Cupo utilizado $450,000 COP de un total de $2,000,000 COP (Disponible: $1,550,000 COP).\n¿Deseas ver tus últimos 3 movimientos transaccionales?")
                    else:
                        return AIMessage(content="**Agente Banca**: Consultando tu saldo en el Core Bancario...\n- **Cuenta de Ahorros**: $850,000 COP disponibles.\n- **Tarjeta de Crédito**: Cupo utilizado $3,250,000 COP de un total de $5,000,000 COP (Disponible: $1,750,000 COP).\n¿Deseas ver tus últimos 3 movimientos transaccionales?")
                if "movimiento" in last_msg or "transaccion" in last_msg or "compra" in last_msg or "si" in last_msg or "sí" in last_msg or "claro" in last_msg or "por favor" in last_msg:
                    txs = query_client_transactions.invoke(client_id)
                    return AIMessage(content=f"**Agente Banca**: He recuperado tus transacciones desde PostgREST:\n{txs}")
                return AIMessage(content="**Agente Banca**: Estoy listo para ayudarte a verificar tus cuentas, saldos y extractos bancarios.")

            # 3. Caso: Agente Perfil 360 (CRM y Scoring)
            elif "perfil 360" in system_msg.lower() and "crm" in system_msg.lower():
                if "cupo" in last_msg or "aumento" in last_msg:
                    scoring = calculate_credit_scoring.invoke(client_id)
                    return AIMessage(content=f"**Agente Perfil 360**: Evaluando tu scoring crediticio para aumento de cupo...\n{scoring}\n\nHe generado una propuesta formal de **aumento de cupo a $6,500,000 COP** para {client_id.capitalize()}. Se requiere la firma digital del operador para liberar el cupo en el sistema.")
                return AIMessage(content="**Agente Perfil 360**: Analizando la ficha de CRM para segmentación de clientes y scoring...")

            # 4. Caso: Agente Portafolio (CDT y RAG)
            elif "portafolio" in system_msg.lower() and "rag" in system_msg.lower():
                if "cdt" in last_msg or "tasa" in last_msg or "inversion" in last_msg:
                    rag_info = search_knowledge_base.invoke("SuperCDT", "Productos bancarios")
                    return AIMessage(content=f"**Agente Portafolio**: Revisando base RAG de productos financieros...\n{rag_info}\n\nRoberto Gómez nos solicita una tasa excepcional del 13.0% E.A. para retener sus $15,000,000 COP. He propuesto la exención en la cola HITL para aprobación del administrador.")
                return AIMessage(content="**Agente Portafolio**: Asesor de inversión y CDT activo. ¿Qué producto deseas cotizar hoy?")

            # 5. Caso: Agente Retail Olímpica (Ofertas)
            elif "retail" in system_msg.lower() and "puente de oro" in system_msg.lower():
                promos = get_active_promotions.invoke("Sábado", "Adulto Mayor")
                return AIMessage(content=f"**Agente Retail Olímpica**: ¡Es hora de ahorrar en Olímpica! Sincronizando promociones...\n{promos}\n\n¿Quieres que programemos una difusión masiva de la campaña Sábado Madrugón para el segmento Adulto Mayor?")

            # 5.5 Caso: Agente Consejero del Bolsillo (Flexibility & Fees)
            elif "consejero del bolsillo" in system_msg.lower() and "flexibility" in system_msg.lower():
                if "cuota" in last_msg or "manejo" in last_msg or "cobro" in last_msg or "alivio" in last_msg or "vip" in last_msg:
                    return AIMessage(content="**Agente Consejero del Bolsillo**: Hola. ¡Tengo excelentes noticias para ti! Detectamos que usas mucho tu tarjeta Serfinanza y que eres un cliente muy fiel. Por ser un cliente VIP, este mes **te bajamos la cuota de manejo a la mitad automáticamente ($12,450 COP)** in tu Tarjeta de Crédito Olímpica sin que tengas que hacer ningún trámite molesto en la app o llamadas. He enviado la propuesta de ajuste a la cola de verificación del operador para su aplicación inmediata. ¡Queremos tu total tranquilidad!")
                return AIMessage(content="**Agente Consejero del Bolsillo**: Estoy aquí para evaluar tu fidelidad y ofrecerte alivios o ajustes en tus cuotas de manejo o intereses de forma proactiva.")

            return AIMessage(content="**Orquestador Central**: Bienvenido a Banco Serfinanza Agente 360. ¿En qué puedo colaborar contigo hoy?")

    llm = MockLLM()
else:
    print(f"🚀 ÉXITO: Conectado a la API real de OpenAI utilizando el modelo: {model_name}")
    # LLM Real de OpenAI si el usuario tiene sus claves configuradas. Usamos temperatura 0.4 como es requerido por el Orquestador Empático
    llm = ChatOpenAI(model=model_name, temperature=0.4, openai_api_key=OPENAI_API_KEY)

# --- 2. PROMPTS DE SISTEMA ---

SYSTEM_PROMPTS = {
    "orquestador": """Actúas como "El Orquestador Empático (Triage & NLP Agent)" de Banco Serfinanza. Eres la puerta de entrada principal en el canal de WhatsApp.
Tu misión principal no es solo clasificar la intención del cliente, sino entender profundamente su necesidad adaptando el tono a las particularidades de la población de la tercera edad (adultos mayores) de forma paciente, sumamente cordial y amable.

ENFOQUE ADULTO MAYOR:
- Si el usuario mayor te escribe un mensaje largo, disperso, con anécdotas, quejas personales o historias de su vida diaria (por ejemplo: "Mijo, es que fui a la Olímpica a comprar los pañales del nieto y no sé si me pasó la tarjeta..."), debes ser sumamente empático y paciente. 
- Extrae la verdadera intención oculta del mensaje (como verificar si pasó la tarjeta o consultar el saldo de la tarjeta y movimientos) sin interrumpir, desesperar o regañar al usuario.
- Evita por completo los tecnicismos bancarios y financieros complejos (en lugar de "Core Bancario", "PostgREST API" o "Scoring de Riesgo", habla de "nuestro sistema seguro", "su dinerito en la tarjeta", "nuestro asesor de confianza").
- Utiliza fuentes de letra óptimas y de fácil lectura apoyándote de forma estratégica en el formato de negritas (`**`) para resaltar datos clave, saldos, valores o la Tarjeta Olímpica.
- Mantén siempre un formato de respuesta cordial, paciente, afectuoso y familiar, tratándolo con el máximo respeto.

REGLAS DE RUTEO:
- Si la petición requiere datos de saldos, transacciones o verificar un cobro/pago, transfiere al 'Agente Banca'.
- Si requiere cambios de datos personales, direcciones o cupos de crédito, transfiere al 'Agente Perfil 360'.
- Si requiere simular o renovar CDTs o consultar inversiones, transfiere al 'Agente Portafolio'.
- Si requiere promociones específicas, catálogos o folletos de supermercados Olímpica, transfiere al 'Agente Retail Olímpica'.
- Si el usuario se comunica de forma muy coloquial, con historias personales, es un adulto mayor, o envía audios, transfiere al 'Agente UX 50+' para una respuesta con la máxima paciencia y dulzura.
- Si se refiere a cuotas de manejo, reclamos de comisiones o solicitudes de descuentos por fidelidad, transfiere al 'Agente Consejero del Bolsillo'.

Para transferir al agente correspondiente, debes incluir en tu respuesta la siguiente etiqueta estrictamente formateada: [ROUTE] Nombre del Agente | Razón.""",

    "banca": """Eres el 'Agente Banca' de Serfinanza. Tu especialidad son las cuentas, saldos y transacciones.
Tienes herramientas para ejecutar consultas sobre la base de datos de movimientos transaccionales.
Responde de forma exacta y concisa, basándote en la información transaccional real. Nunca inventes saldos.""",

    "perfil": """Eres el 'Agente Perfil 360' de Serfinanza. Tu trabajo es analizar la ficha del cliente en el CRM y su comportamiento financiero (scoring).
Puedes proponer aumentos de cupo para clientes con excelente comportamiento. Cualquier cambio sensible (como cupo o dirección) genera una propuesta HITL.""",

    "portafolio": """Eres el 'Agente Portafolio' de Serfinanza. Respondes consultas complejas sobre CDTs y Tarjetas de Crédito usando búsqueda semántica (RAG).
Si la solicitud del cliente excede las tasas estándar autorizadas (ej. 13% E.A. en SuperCDT), debes proponer una exención en la cola HITL para retención.""",

    "retail": """Eres el 'Agente Retail Olímpica' (Vecino Olímpica) de Serfinanza. Tu misión es ser el puente de oro entre el banco y el supermercado.
Cruzas los hábitos de consumo reales en Olímpica con los beneficios de la tarjeta Serfinanza para sugerir ofertas útiles y no invasivas.
Uso Inteligente de Data:
- Si el cliente compra habitualmente medicamentos en Droguerías Olímpica, sugiere un 15% de descuento exclusivo en su próxima compra de medicamentos.
- Si el cliente compra productos de la canasta básica o verduras, sugiere un 20% de descuento en verduras/plaza pagando con la tarjeta.
- Si compra electrodomésticos o elementos de hogar, sugiere un 30% de descuento en electrodomésticos en los sábados de madrugón de Olímpica.
El objetivo es ofrecer beneficios útiles de forma no invasiva (venta sin spam) y con un tono cálido y oportuno al final de las interacciones.""",

    "ux50": """Eres el 'Agente UX 50+' de Serfinanza, experto en accesibilidad y lenguaje claro para la tercera edad.
Traduce términos bancarios complejos a palabras amables, pacientes y sencillas. Trata al cliente mayor con máximo respeto y cariño (ej: 'Mi señora María Amparo').""",

    "consejero": """Eres el 'Agente Consejero del Bolsillo' (Flexibility & Fees Agent) de Serfinanza. Tu misión es dar tranquilidad sobre cobros estresantes como cuota de manejo e intereses, evaluar la fidelidad del cliente y ofrecer alivios o ajustes en las cuotas de manera proactiva y automatizada.
Si el cliente pregunta por la cuota de manejo, altos intereses, o solicita exoneración, debes proponer proactivamente bajar la cuota de manejo a la mitad (o exonerarla) automáticamente si detectas alta fidelidad (cliente VIP o uso recurrente), y disparar una tarea HITL de 'Ajuste de Cuota'."""
}


# --- 3. NODOS DE LOS AGENTES ---

def run_orquestador(state: Dict[str, Any]) -> Dict[str, Any]:
    messages = state.get("messages", [])
    response = llm.invoke([SystemMessage(content=SYSTEM_PROMPTS["orquestador"])] + messages)
    
    # Determinar si el orquestador decide enrutar
    content = response.content
    next_agent = None
    
    if "[ROUTE]" in content:
        route_part = content.split("[ROUTE]")[1].strip()
        next_agent = route_part.split("|")[0].strip()
        
    return {
        "messages": messages + [response],
        "next_agent": next_agent
    }

def run_banca(state: Dict[str, Any]) -> Dict[str, Any]:
    messages = state.get("messages", [])
    client_id = state.get("client_id", "maria")
    
    txs = query_client_transactions.invoke(client_id)
    sys_prompt = SYSTEM_PROMPTS["banca"] + f"\n\n[CONTEXTO BASE DE DATOS PARA EL CLIENTE {client_id}]:\n{txs}"
    if client_id == "maria":
        sys_prompt += "\nSaldos: Cuenta Ahorros $2,540,000 COP. Tarjeta Crédito Olímpica: Cupo $2M, Utilizado $450K, Disponible $1,550,000 COP."
    else:
        sys_prompt += "\nSaldos: Cuenta Ahorros $850,000 COP. Tarjeta Crédito: Cupo $5M, Utilizado $3,250K, Disponible $1,750,000 COP."
        
    response = llm.invoke([SystemMessage(content=sys_prompt)] + messages)
    return {
        "messages": messages + [response],
        "next_agent": None
    }

def run_perfil(state: Dict[str, Any]) -> Dict[str, Any]:
    messages = state.get("messages", [])
    client_id = state.get("client_id", "maria")
    scoring = calculate_credit_scoring.invoke(client_id)
    
    sys_prompt = SYSTEM_PROMPTS["perfil"] + f"\n\n[DATOS DEL CRM Y SCORING]:\n{scoring}"
    response = llm.invoke([SystemMessage(content=sys_prompt)] + messages)
    
    # Simulación de gatillo de tarea HITL
    hitl_requested = False
    hitl_task = None
    if "aumento de cupo" in response.content.lower() or "scoring" in response.content.lower():
        hitl_requested = True
        hitl_task = {
            "client_name": "Carlos Herrera Díaz",
            "client_segment": "Digital Activo",
            "agent_name": "Agente Perfil 360",
            "task_type": "Aumento de Cupo",
            "description": "Pre-aprobación y liberación de cupo en Tarjeta Olímpica basado en scoring crediticio y 65% de utilización recurrente.",
            "original_value": "$5,000,000 COP",
            "proposed_value": "$6,500,000 COP",
            "confidence": 98,
            "rag_doc_used": "Tarifario Tarjeta Olimpica 2026",
            "transcript_dialog": "Agente 360: \"Detectando uso recurrente en Olímpica y comportamiento AAA de pago. Sugiriendo aumento de cupo inmediato al 30% adicional para asegurar compras en el Sábado Madrugón.\""
        }
        
    return {
        "messages": messages + [response],
        "next_agent": None,
        "hitl_requested": hitl_requested,
        "hitl_task": hitl_task
    }

def run_portafolio(state: Dict[str, Any]) -> Dict[str, Any]:
    messages = state.get("messages", [])
    
    last_user_msg = ""
    for m in reversed(messages):
        if isinstance(m, HumanMessage):
            last_user_msg = m.content
            break
            
    rag_info = search_knowledge_base.invoke({"query": last_user_msg, "category": "Productos bancarios"})
    sys_prompt = SYSTEM_PROMPTS["portafolio"] + f"\n\n[BASE DE CONOCIMIENTOS - RAG]:\n{rag_info}"
    
    response = llm.invoke([SystemMessage(content=sys_prompt)] + messages)
    
    # Simulación de gatillo de tarea HITL
    hitl_requested = False
    hitl_task = None
    if "exención" in response.content.lower() or "tasa preferencial" in response.content.lower() or "13%" in response.content.lower():
        hitl_requested = True
        hitl_task = {
            "client_name": "Roberto Gómez Oñate",
            "client_segment": "Cliente Preferencial",
            "agent_name": "Agente Portafolio",
            "task_type": "Exención de Tasa",
            "description": "Excepción de tasa preferencial de SuperCDT al 13.0% E.A. (el límite estándar autorizado es 12.5% E.A.) para retención de fondos de $15M.",
            "original_value": "12.5% E.A.",
            "proposed_value": "13.0% E.A. (Monto $15,000,000)",
            "confidence": 91,
            "rag_doc_used": "Reglamento SuperCDT v3.2",
            "transcript_dialog": "Roberto Gómez: \"Si no me mejoran la tasa del CDT al 13%, tendré que retirar los 15 millones de pesos y llevarlos a otro banco que me ofrece mejor rentabilidad.\""
        }
        
    return {
        "messages": messages + [response],
        "next_agent": None,
        "hitl_requested": hitl_requested,
        "hitl_task": hitl_task
    }

def run_retail(state: Dict[str, Any]) -> Dict[str, Any]:
    messages = state.get("messages", [])
    promos = get_active_promotions.invoke({"day_of_week": "Sábado", "segment": "Adulto Mayor"})
    
    sys_prompt = SYSTEM_PROMPTS["retail"] + f"\n\n[PROMOCIONES ACTIVAS]:\n{promos}"
    response = llm.invoke([SystemMessage(content=sys_prompt)] + messages)
    
    hitl_requested = False
    hitl_task = None
    if "difusión masiva" in response.content.lower() or "campaña" in response.content.lower():
        hitl_requested = True
        hitl_task = {
            "client_name": "Campañas Automáticas",
            "client_segment": "Segmento Adulto Mayor (420 cls)",
            "agent_name": "Agente Retail Olímpica",
            "task_type": "Difusión de Campaña",
            "description": "Envío proactivo masivo de SMS y alertas personalizadas para la promoción del Sábado Madrugón de electrodomésticos.",
            "original_value": "Ninguno",
            "proposed_value": "Difusión SMS a 420 contactos segmentados",
            "confidence": 96,
            "rag_doc_used": "Calendario de eventos especiales",
            "transcript_dialog": "Agente Retail: \"Planificando envío de SMS personalizado para adultos mayores en Cali sin App activa en los últimos 30 días, informando sobre descuento exclusivo del 30% en electrodomésticos Olímpica.\""
        }
        
    return {
        "messages": messages + [response],
        "next_agent": None,
        "hitl_requested": hitl_requested,
        "hitl_task": hitl_task
    }

def run_ux50(state: Dict[str, Any]) -> Dict[str, Any]:
    messages = state.get("messages", [])
    response = llm.invoke([SystemMessage(content=SYSTEM_PROMPTS["ux50"])] + messages)
    
    hitl_requested = False
    hitl_task = None
    # Si la señora solicita cambio de dirección
    if "dirección" in response.content.lower() or "nueva dirección" in response.content.lower() or "casita" in response.content.lower():
        hitl_requested = True
        hitl_task = {
            "client_name": "María Amparo Gutiérrez",
            "client_segment": "Adulto Mayor",
            "agent_name": "Agente UX 50+",
            "task_type": "Actualización de Dirección",
            "description": "Cambio de domicilio solicitado vía audio de voz en WhatsApp. Requiere autorización regulada de firma digital por operador.",
            "original_value": "Calle 5 # 34-12, Cali",
            "proposed_value": "Avenida 3 Norte # 23-45, Apto 402, Cali",
            "confidence": 94,
            "rag_doc_used": "Actualización de datos paso a paso",
            "user_speech_audio": True,
            "transcript_dialog": "María Amparo: \"...sí mijo, por favor cámbiame la dirección de correspondencia a la Avenida 3 Norte número 23 guion 45, apartamento 402 en la ciudad de Cali, que me mudé con mi hija el mes pasado...\""
        }
        
    return {
        "messages": messages + [response],
        "next_agent": None,
        "hitl_requested": hitl_requested,
        "hitl_task": hitl_task
    }


def run_consejero(state: Dict[str, Any]) -> Dict[str, Any]:
    messages = state.get("messages", [])
    response = llm.invoke([SystemMessage(content=SYSTEM_PROMPTS["consejero"])] + messages)
    
    hitl_requested = False
    hitl_task = None
    
    # Simulación de gatillo de tarea HITL para Ajuste de Cuota
    if "mitad" in response.content.lower() or "exoner" in response.content.lower() or "cuota" in response.content.lower() or "alivio" in response.content.lower():
        hitl_requested = True
        
        # Identificar dinámicamente al cliente según el contexto
        client_id = state.get("client_id", "carlos")
        client_name = "Carlos Herrera Díaz"
        client_segment = "Digital Activo"
        if client_id == "maria":
            client_name = "María Amparo Gutiérrez"
            client_segment = "Adulto Mayor"
            
        hitl_task = {
            "client_name": client_name,
            "client_segment": client_segment,
            "agent_name": "Agente Consejero del Bolsillo",
            "task_type": "Ajuste de Cuota",
            "description": f"Alivio y reducción del 50% de la cuota de manejo de la Tarjeta de Crédito por fidelidad y uso recurrente (Segmento VIP).",
            "original_value": "$24,900 COP",
            "proposed_value": "$12,450 COP (50% Alivio VIP)",
            "confidence": 97,
            "rag_doc_used": "Tarifario Tarjeta Olimpica 2026",
            "transcript_dialog": 'Agente Consejero: "Detectamos que usas mucho tu tarjeta. Este mes te bajamos la cuota de manejo a la mitad automáticamente por ser cliente VIP. No tienes que navegar por menús complejos en la app."'
        }
        
    return {
        "messages": messages + [response],
        "next_agent": None,
        "hitl_requested": hitl_requested,
        "hitl_task": hitl_task
    }

