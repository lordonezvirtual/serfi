from typing import Dict, Any, List, TypedDict, Optional
from langgraph.graph import StateGraph, END
from backend.app.agents import (
    run_orquestador,
    run_banca,
    run_perfil,
    run_portafolio,
    run_retail,
    run_ux50,
    run_consejero
)

# --- 1. DEFINICIÓN DEL ESTADO GLOBAL DEL GRAFO ---
class AgentState(TypedDict):
    messages: List[Any]
    next_agent: Optional[str]
    client_id: Optional[str]
    hitl_requested: bool
    hitl_task: Optional[Dict[str, Any]]
    context: Dict[str, Any]

# --- 2. CONFIGURACIÓN DEL GRAFO DE ESTADOS ---
workflow = StateGraph(AgentState)

# Registrar los nodos en el grafo
workflow.add_node("orquestador", run_orquestador)
workflow.add_node("Agente Banca", run_banca)
workflow.add_node("Agente Perfil 360", run_perfil)
workflow.add_node("Agente Portafolio", run_portafolio)
workflow.add_node("Agente Retail Olímpica", run_retail)
workflow.add_node("Agente UX 50+", run_ux50)
workflow.add_node("Agente Consejero del Bolsillo", run_consejero)

# Punto de inicio
workflow.set_entry_point("orquestador")

# --- 3. LÓGICA DE CONDICIONALES Y RUTEO ---
def router(state: AgentState) -> str:
    """
    Decide el camino a tomar a partir del nodo Orquestador Central.
    """
    next_a = state.get("next_agent")
    if not next_a:
        return END
        
    valid_agents = [
        "Agente Banca",
        "Agente Perfil 360",
        "Agente Portafolio",
        "Agente Retail Olímpica",
        "Agente UX 50+",
        "Agente Consejero del Bolsillo"
    ]
    
    # Ruteo seguro
    for agent in valid_agents:
        if agent.lower() in next_a.lower():
            return agent
            
    return END

# Conectar el Orquestador con los sub-agentes según el router
workflow.add_conditional_edges(
    "orquestador",
    router,
    {
        "Agente Banca": "Agente Banca",
        "Agente Perfil 360": "Agente Perfil 360",
        "Agente Portafolio": "Agente Portafolio",
        "Agente Retail Olímpica": "Agente Retail Olímpica",
        "Agente UX 50+": "Agente UX 50+",
        "Agente Consejero del Bolsillo": "Agente Consejero del Bolsillo",
        END: END
    }
)

# Todos los sub-agentes retornan al final del ciclo de respuesta
workflow.add_edge("Agente Banca", END)
workflow.add_edge("Agente Perfil 360", END)
workflow.add_edge("Agente Portafolio", END)
workflow.add_edge("Agente Retail Olímpica", END)
workflow.add_edge("Agente UX 50+", END)
workflow.add_edge("Agente Consejero del Bolsillo", END)

# --- 4. COMPILACIÓN DEL GRAFO ---
# Note: LangGraph nos permite añadir checkpointers locales aquí para pausar
# el hilo en breakpoints. En esta plantilla dejamos el grafo limpio compilado.
compiled_graph = workflow.compile()
