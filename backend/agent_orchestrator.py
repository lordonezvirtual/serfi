#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
===========================================================================
Agente 360 Serfinanza — Orchestrator & Multi-Agent System
Designed to query PostgREST API, analyze credit risk, and insert HITL Tasks
===========================================================================
"""

import sys
import json
import urllib.request
import urllib.error
import time

# ===========================================================================
# CONFIGURATION
# ===========================================================================
OLLAMA_URL = "http://localhost:11434"
# Automatically select the best local model. We prioritize Hermes3 8B or Qwen 2.5 Coder 7B
DEFAULT_MODELS = [
    "hermes3:8b-llama3.1-q4_K_M",
    "qwen2.5-coder:7b",
    "deepseek-coder-v2:16b",
    "gemma4:latest",
    "qwen3.6:35b-a3b"
]
POSTGREST_URL = "http://localhost:3000"

# ===========================================================================
# HELPERS & HTTP CLIENT
# ===========================================================================
def http_get(url):
    """Simple wrapper for HTTP GET returning JSON"""
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.URLError as e:
        print(f"❌ Error connecting to PostgREST at {url}: {e}")
        return None

def http_post(url, data):
    """Simple wrapper for HTTP POST sending and returning JSON"""
    try:
        json_data = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(
            url, 
            data=json_data, 
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            res_content = response.read().decode('utf-8')
            return json.loads(res_content) if res_content else {"status": "Success"}
    except urllib.error.HTTPError as e:
        # PostgREST sometimes returns 201 Created with no body, which raises no error or raises HTTPError in some cases.
        # Handle 201 Created correctly
        if e.code in [200, 201]:
            return {"status": "Success", "code": e.code}
        print(f"❌ HTTP Error {e.code} posting to {url}: {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"❌ Error posting to {url}: {e}")
        return None

def get_available_model():
    """Queries Ollama to find a working model from our list"""
    try:
        req = urllib.request.Request(f"{OLLAMA_URL}/api/tags")
        with urllib.request.urlopen(req) as response:
            tags = json.loads(response.read().decode('utf-8'))
            installed = [m['name'] for m in tags.get('models', [])]
            
            for m in DEFAULT_MODELS:
                if m in installed:
                    return m
                # Check for substring matches (e.g. "hermes3:8b")
                for inst in installed:
                    if m.split(':')[0] in inst:
                        return inst
            if installed:
                return installed[0]
    except Exception as e:
        print(f"⚠️ Warning: Could not connect to local Ollama on {OLLAMA_URL}. Is it running? ({e})")
    return None

def query_llm(model, prompt, system_prompt="You are a helpful assistant."):
    """Helper to query local Ollama LLM"""
    if not model:
        return "ERROR: No LLM available."
        
    payload = {
        "model": model,
        "prompt": f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n",
        "stream": False,
        "options": {
            "temperature": 0.4
        }
    }
    
    try:
        json_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/generate",
            data=json_data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('response', '')
    except Exception as e:
        return f"ERROR: Failed to query Ollama model {model}: {e}"

# ===========================================================================
# AGENTS DEFINITIONS
# ===========================================================================

class DatabaseInvestigatorAgent:
    """
    Agent 1: Database Investigator (Agente Investigador de BD)
    Queries PostgREST to fetch a complete, unified profile of the customer.
    """
    def __init__(self, model):
        self.model = model
        self.name = "🔎 Agente Investigador de BD"
        
    def investigate(self, client_id):
        print(f"\n[{self.name}] ⚙️ Iniciando investigación para el cliente '{client_id}'...")
        
        # 1. Fetch Client Profile
        print(f"[{self.name}] 📡 Consultando información de cliente...")
        client_res = http_get(f"{POSTGREST_URL}/clientes?id=eq.{client_id}")
        if not client_res:
            return {"error": f"Cliente {client_id} no encontrado."}
        client = client_res[0]
        
        # 2. Fetch Accounts
        print(f"[{self.name}] 📡 Consultando cuentas bancarias y CDTs...")
        cuentas = http_get(f"{POSTGREST_URL}/cuentas?cliente_id=eq.{client_id}") or []
        
        # 3. Fetch Cards
        print(f"[{self.name}] 📡 Consultando tarjetas de crédito y cupos...")
        tarjetas = http_get(f"{POSTGREST_URL}/tarjetas?cliente_id=eq.{client_id}") or []
        
        # 4. Fetch Transactions
        print(f"[{self.name}] 📡 Consultando historial de transacciones recientes...")
        transacciones = http_get(f"{POSTGREST_URL}/transacciones?cliente_id=eq.{client_id}&order=fecha.desc&limit=5") or []
        
        # Compile structured data
        unified_profile = {
            "cliente": client,
            "cuentas": cuentas,
            "tarjetas": tarjetas,
            "transacciones_recientes": transacciones
        }
        
        # Self-reflective query to produce a summarized data sheet
        prompt = f"""
        Como agente investigador bancario, analiza y sintetiza la siguiente ficha técnica del cliente.
        Escribe un breve reporte (máximo 4 líneas) resaltando:
        1. Resumen de saldos totales en cuentas/CDT.
        2. Estado y utilización de sus tarjetas.
        3. Comportamiento general de sus transacciones.

        DATOS DEL CLIENTE:
        {json.dumps(unified_profile, indent=2, ensure_ascii=False)}
        """
        
        summary = query_llm(
            self.model, 
            prompt, 
            "Eres un agente experto en extraer e interpretar perfiles financieros estructurados."
        )
        unified_profile["resumen_analisis"] = summary
        
        print(f"[{self.name}] ✅ Ficha consolidada generada con éxito.")
        return unified_profile


class OffersAnalystAgent:
    """
    Agent 2: Offers & Risk Analyst (Agente Analista de Ofertas y Riesgo)
    Analyzes the customer profile to find commercial opportunities, credit limit increases, or rate exemptions.
    """
    def __init__(self, model):
        self.model = model
        self.name = "📊 Agente Analista de Ofertas y Riesgo"
        
    def analyze(self, profile):
        print(f"\n[{self.name}] ⚙️ Analizando comportamiento financiero del cliente...")
        
        # Fetch current active bank offers to evaluate matching
        all_offers = http_get(f"{POSTGREST_URL}/ofertas") or []
        
        prompt = f"""
        Analiza detenidamente la ficha consolidada de este cliente de Serfinanza y las ofertas bancarias generales.
        Determina cuál es la mejor acción o recomendación financiera y comercial para este cliente.

        FICHA DE CLIENTE CONSOLIDADA:
        {json.dumps(profile, indent=2, ensure_ascii=False)}

        OFERTAS DISPONIBLES EN EL SISTEMA:
        {json.dumps(all_offers, indent=2, ensure_ascii=False)}

        INSTRUCCIONES DE ANÁLISIS:
        1. Evalúa el scoring crediticio. Si es alto (>750) y tiene tarjetas de crédito con alto porcentaje de uso (>60%), evalúa un 'Aumento de Cupo'.
        2. Evalúa saldos en cuentas de ahorro. Si tiene más de $2,000,000 COP y no tiene CDT activo, recomienda ofrecer 'SuperCDT'.
        3. Si tiene CDT pero manifiesta inconformidad o es de segmento preferencial, evalúa una 'Exención de Tasa' a 13.0% E.A.
        4. Si el cliente es Adulto Mayor (>55 años) y 'No usa app', recomienda una campaña proactiva de WhatsApp ('Paquete 50+ sin app').
        5. Si el cliente tiene tarjeta de crédito activa y su frecuencia de uso es alta, o manifiesta preocupación por costos recurrentes, evalúa un 'Ajuste de Cuota' para proponer bajar la cuota de manejo a la mitad ($12,450 COP) por fidelidad VIP.
        
        Genera la salida en formato JSON con la siguiente estructura exacta:
        {
            "analisis_comportamiento": "resumen del comportamiento financiero del cliente y detección de necesidades",
            "scoring_riesgo": "Nivel de riesgo (Bajo / Medio / Alto)",
            "propuesta_tipo": "Aumento de Cupo" o "Actualización de Dirección" o "Exención de Tasa" o "Difusión de Campaña" o "Ajuste de Cuota",
            "valor_original": "valor actual en la DB (por ejemplo: '$5,000,000 COP' o '12.5% E.A.' o '$24,900 COP') o 'Ninguno'",
            "valor_propuesto": "valor que se propone otorgar (por ejemplo: '$6,500,000 COP' o '13.0% E.A.' o '$12,450 COP')",
            "justificacion": "justificación detallada de por qué se propone esto",
            "confianza_porcentaje": un número entero del 0 al 100 de confianza del agente en esta propuesta,
            "documento_rag_asociado": "Nombre de la política o tarifario relevante (ej. 'Tarifario Tarjeta Olimpica 2026' o 'Reglamento SuperCDT v3.2')"
        }
        
        IMPORTANTE: Responde ÚNICAMENTE con el bloque JSON. No agregues explicaciones fuera del JSON.
        """
        
        response_raw = query_llm(
            self.model, 
            prompt, 
            "Eres un analista financiero experto en banca y riesgos en el mercado fintech colombiano. Tu salida debe ser estrictamente un JSON válido."
        )
        
        # Parse JSON output
        try:
            # Clean possible markdown block wrappers if LLM returned them
            clean_json = response_raw.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            clean_json = clean_json.strip()
            
            analysis = json.loads(clean_json)
            print(f"[{self.name}] ✅ Análisis comercial y scoring de riesgo generados con éxito.")
            return analysis
        except Exception as e:
            print(f"[{self.name}] ⚠️ Error parsing JSON from Offers Analyst response. Using fallback heuristics.")
            print(f"Response raw: {response_raw}")
            # Fallback heuristic
            return self.fallback_analysis(profile)
 
    def fallback_analysis(self, profile):
        """Fallback logic in case LLM fails to output clean JSON"""
        cliente = profile["cliente"]
        tarjetas = profile.get("tarjetas", [])
        cuentas = profile.get("cuentas", [])
        
        has_card = len(tarjetas) > 0
        card_usage = tarjetas[0].get("porcentaje_uso", 0) if has_card else 0
        total_balance = sum(float(c.get("saldo", 0)) for c in cuentas)
        has_cdt = any("CDT" in c.get("numero_cuenta", "") for c in cuentas)
        
        # Carlos scenario
        if cliente["id"] == "carlos" or (has_card and card_usage > 60 and cliente["id"] != "alberto"):
            return {
                "analisis_comportamiento": "El cliente tiene un uso recurrente en almacenes Olímpica y una utilización de tarjeta superior al 65%, con scoring AAA.",
                "scoring_riesgo": "Bajo",
                "propuesta_tipo": "Aumento de Cupo",
                "valor_original": "$5,000,000 COP",
                "valor_propuesto": "$6,500,000 COP",
                "justificacion": "Alta utilización recurrente con comportamiento excelente de pago. Se sugiere incremento preventivo para el Sábado Madrugón.",
                "confianza_porcentaje": 98,
                "documento_rag_asociado": "Tarifario Tarjeta Olimpica 2026"
            }
        # Alberto scenario - Ajuste de Cuota
        elif cliente["id"] == "alberto":
            return {
                "analisis_comportamiento": "El cliente tiene un uso muy alto de su tarjeta de crédito Olímpica Serfinanza con scoring medio y califica para alivios por fidelidad.",
                "scoring_riesgo": "Bajo",
                "propuesta_tipo": "Ajuste de Cuota",
                "valor_original": "$24,900 COP",
                "valor_propuesto": "$12,450 COP (50% Alivio VIP)",
                "justificacion": "Reducción del 50% de la cuota de manejo por fidelidad VIP y alta frecuencia de uso en SAO y Olímpica para fidelización.",
                "confianza_porcentaje": 97,
                "documento_rag_asociado": "Tarifario Tarjeta Olimpica 2026"
            }
        # Maria scenario
        elif cliente["id"] == "maria" or (cliente["edad"] > 55 and "No usa app" in cliente["etiqueta"]):
            return {
                "analisis_comportamiento": "Cliente de la tercera edad con saldos saludables pero inactividad digital.",
                "scoring_riesgo": "Bajo",
                "propuesta_tipo": "Difusión de Campaña",
                "valor_original": "Ninguno",
                "valor_propuesto": "Difusión SMS a 420 contactos segmentados",
                "justificacion": "Se propone una campaña de WhatsApp auto o SMS personalizado informando de descuentos exclusivos en electrodomésticos Olímpica para adultos mayores.",
                "confianza_porcentaje": 95,
                "documento_rag_asociado": "Calendario de eventos especiales"
            }
        # Roberto scenario
        elif cliente["id"] == "roberto" or (total_balance > 10000000 and has_cdt):
            return {
                "analisis_comportamiento": "Cliente inversionista preferencial de alta renta con riesgo de fuga de capitales por tasa de rentabilidad.",
                "scoring_riesgo": "Bajo",
                "propuesta_tipo": "Exención de Tasa",
                "valor_original": "12.5% E.A.",
                "valor_propuesto": "13.0% E.A. (Monto $15,000,000)",
                "justificacion": "Retención del cliente preferencial mediante incremento excepcional de la tasa del CDT al 13.0% E.A.",
                "confianza_porcentaje": 91,
                "documento_rag_asociado": "Reglamento SuperCDT v3.2"
            }
        else:
            return {
                "analisis_comportamiento": "Cliente estándar activo.",
                "scoring_riesgo": "Medio",
                "propuesta_tipo": "Actualización de Dirección",
                "valor_original": "Ninguno",
                "valor_propuesto": "Confirmación de domicilio actual",
                "justificacion": "Campaña preventiva de verificación de Habeas Data.",
                "confianza_porcentaje": 80,
                "documento_rag_asociado": "Política Habeas Data"
            }
 
 
class HITLTaskCreatorAgent:
    """
    Agent 3: HITL Task Creator (Agente Creador de Tareas HITL)
    Registers the proposed financial action as an interactive Human-in-the-Loop task in PostgreSQL.
    """
    def __init__(self):
        self.name = "📝 Agente Creador de Tareas HITL"
        
    def create_task(self, client_profile, proposal):
        print(f"\n[{self.name}] ⚙️ Estructurando tarea para el flujo de aprobación humana...")
        
        # Define some dialogues based on type
        dialogue = "Agente Central: 'Analizando perfil de cliente para incentivar uso de productos.'"
        if proposal["propuesta_tipo"] == "Aumento de Cupo":
            dialogue = f'Agente 360: "Detectando uso recurrente en Olímpica y comportamiento AAA de pago. Sugiriendo aumento de cupo inmediato del 30% a {client_profile["cliente"]["nombre"]} para asegurar compras en el Sábado Madrugón."'
        elif proposal["propuesta_tipo"] == "Exención de Tasa":
            dialogue = f'{client_profile["cliente"]["nombre"]}: "Si no me mejoran la tasa del CDT al 13%, tendré que retirar los fondos y llevarlos a otro banco."'
        elif proposal["propuesta_tipo"] == "Difusión de Campaña":
            dialogue = f'Agente Retail: "Planificando envío de SMS personalizado para adultos mayores en la ciudad de {client_profile["cliente"]["ciudad"]} sin App activa, informando sobre descuento exclusivo del Sábado Madrugón."'
        elif proposal["propuesta_tipo"] == "Ajuste de Cuota":
            dialogue = 'Agente Consejero: "Detectamos que usas mucho tu tarjeta. Este mes te bajamos la cuota de manejo a la mitad automáticamente por ser cliente VIP. No tienes que navegar por menús complejos en la app."'
        task_id = f"hitl-auto-{int(time.time())}"
        
        task_data = {
            "id": task_id,
            "cliente_nombre": client_profile["cliente"]["nombre"],
            "cliente_segmento": client_profile["cliente"]["segmento"],
            "agente_nombre": "Agente Orquestador Local",
            "tipo_tarea": proposal["propuesta_tipo"],
            "descripcion": proposal["justificacion"],
            "valor_original": proposal["valor_original"],
            "valor_propuesto": proposal["valor_propuesto"],
            "confianza": proposal["confianza_porcentaje"],
            "estado": "pending",
            "hace_cuanto": "Hace unos instantes",
            "notas_operador": None,
            "documento_rag": proposal["documento_rag_asociado"],
            "audio_voz": True if client_profile["cliente"]["id"] == "maria" else False,
            "transcripcion_dialogo": dialogue
        }
        
        print(f"[{self.name}] 📡 Guardando tarea HITL en la base de datos a través de PostgREST...")
        
        # POST task_data to PostgREST
        res = http_post(f"{POSTGREST_URL}/tareas_hitl", task_data)
        
        if res:
            print(f"[{self.name}] ✅ Tarea '{task_id}' creada con éxito en PostgreSQL!")
            print(f"[{self.name}] ℹ️ Tipo: {proposal['propuesta_tipo']} | Valor propuesto: {proposal['valor_propuesto']} | Confianza: {proposal['confianza_porcentaje']}%")
            return task_id
        else:
            print(f"[{self.name}] ❌ Error al registrar la tarea en la base de datos.")
            return None

# ===========================================================================
# CENTRAL ORCHESTRATOR
# ===========================================================================
class CentralOrchestrator:
    """
    Main Orchestrator
    Manages the overall workflow execution
    """
    def __init__(self):
        print("🧠 Inicializando Orquestador Central de Agentes Serfinanza...")
        self.model = get_available_model()
        if self.model:
            print(f"🤖 Modelo LLM local detectado en Ollama: '{self.model}'")
        else:
            print("⚠️ ADVERTENCIA: Ollama está inactivo o no tiene modelos cargados. Se utilizarán heurísticas locales.")
            
        self.investigator = DatabaseInvestigatorAgent(self.model)
        self.analyst = OffersAnalystAgent(self.model)
        self.hitl_creator = HITLTaskCreatorAgent()
        
    def orchestrate_client_analysis(self, client_id):
        print(f"\n" + "="*80)
        print(f"🏁 INICIANDO ORQUESTACIÓN MULTI-AGENTE PARA EL CLIENTE: {client_id.upper()}")
        print("="*80)
        
        # Paso 1: Investigación de BD
        profile = self.investigator.investigate(client_id)
        if "error" in profile:
            print(f"❌ Abortando orquestación: {profile['error']}")
            return
            
        print("\n" + "-"*50)
        print("📄 FICHA TÉCNICA Y RESUMEN EXTRAÍDO POR EL INVESTIGADOR:")
        print(f"Cliente: {profile['cliente']['nombre']} | Edad: {profile['cliente']['edad']} | Segmento: {profile['cliente']['segmento']}")
        print(f"Resumen Financiero del Agente:\n{profile['resumen_analisis']}")
        print("-"*50)
        
        # Paso 2: Análisis Comercial de Riesgo y Ofertas
        proposal = self.analyst.analyze(profile)
        
        print("\n" + "-"*50)
        print("📈 PROPUESTA GENERADA POR EL ANALISTA DE OFERTAS:")
        print(f"Tipo de Acción: {proposal['propuesta_tipo']}")
        print(f"Valor Original: {proposal['valor_original']} ➡️ Valor Propuesto: {proposal['valor_propuesto']}")
        print(f"Nivel de Confianza: {proposal['confianza_porcentaje']}% | Doc RAG: {proposal['documento_rag_asociado']}")
        print(f"Justificación:\n{proposal['justificacion']}")
        print("-"*50)
        
        # Paso 3: Registro en HITL en base de datos
        task_id = self.hitl_creator.create_task(profile, proposal)
        
        print("\n" + "="*80)
        print(f"🎉 ¡ORQUESTACIÓN COMPLETADA CON ÉXITO!")
        if task_id:
            print(f"La tarea ha sido guardada en la base de datos local y ya está disponible")
            print(f"en la consola de aprobación de Agente 360 (ID de tarea: {task_id}).")
        else:
            print("La orquestación terminó pero hubo un error registrando la tarea en la base de datos.")
        print("="*80 + "\n")

# ===========================================================================
# INTERACTIVE CLI
# ===========================================================================
def main():
    print("="*80)
    print("                      🏢 SERFINANZA AGENTE 360 SANDBOX 🏢")
    print("             Multi-Agent Orchestrator (Tabularis + PostgREST + Ollama)")
    print("="*80)
    
    # Check PostgREST is running
    try:
        urllib.request.urlopen(POSTGREST_URL, timeout=2)
    except Exception:
        print(f"❌ ERROR: El servidor PostgREST no parece estar corriendo en {POSTGREST_URL}.")
        print("Asegúrate de ejecutar el servidor de PostgREST primero.")
        sys.exit(1)
        
    orchestrator = CentralOrchestrator()
    
    # Fetch clients list from DB
    clients = http_get(f"{POSTGREST_URL}/clientes")
    if not clients:
        print("❌ Error: No se pudieron recuperar clientes de la base de datos.")
        sys.exit(1)
        
    while True:
        print("\nClientes disponibles en la Base de Datos Sintética:")
        for idx, c in enumerate(clients):
            # Print client info
            role_suffix = f" ({c['rol']})" if c['es_asesor'] else ""
            print(f"  {idx + 1}. [{c['id'].upper()}] - {c['nombre']} - {c['segmento']}{role_suffix}")
            
        print("  q. Salir de la consola sandbox")
        
        choice = input("\nSelecciona un cliente para iniciar la orquestación de agentes (1-5, o 'q'): ").strip().lower()
        if choice == 'q':
            print("👋 Saliendo de la consola sandbox. ¡Hasta pronto!")
            break
            
        try:
            val = int(choice)
            if 1 <= val <= len(clients):
                client_id = clients[val - 1]['id']
                orchestrator.orchestrate_client_analysis(client_id)
            else:
                print("❌ Opción inválida. Elige un número de la lista.")
        except ValueError:
            print("❌ Opción inválida. Elige un número o 'q'.")
            
if __name__ == "__main__":
    main()
