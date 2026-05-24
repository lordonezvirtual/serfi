import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_PORT = os.getenv("DB_PORT", "5432")

class DatabaseService:
    def __init__(self):
        self.mode = "sqlite"
        self.sqlite_path = os.path.join(os.path.dirname(__file__), "local_agent_data.db")
        self._initialize_database()

    def _get_postgres_connection(self):
        return psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            connect_timeout=2
        )

    def _initialize_database(self):
        # Intentar conectar a PostgreSQL
        try:
            conn = self._get_postgres_connection()
            cursor = conn.cursor()
            
            # Crear la tabla hitl_tasks en PostgreSQL
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS hitl_tasks (
                    id VARCHAR(50) PRIMARY KEY,
                    client_name VARCHAR(100) NOT NULL,
                    client_segment VARCHAR(50) NOT NULL,
                    agent_name VARCHAR(50) NOT NULL,
                    task_type VARCHAR(50) NOT NULL,
                    description TEXT NOT NULL,
                    original_value VARCHAR(255),
                    proposed_value VARCHAR(255) NOT NULL,
                    confidence INT NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    time_ago TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    operator_notes TEXT,
                    rag_doc_used VARCHAR(100),
                    user_speech_audio BOOLEAN DEFAULT FALSE,
                    transcript_dialog TEXT,
                    langgraph_thread_id VARCHAR(100)
                );
            """)
            conn.commit()
            cursor.close()
            conn.close()
            self.mode = "postgres"
            print("DatabaseService: Iniciado exitosamente en modo [PostgreSQL]")
        except Exception as e:
            # Fallback a SQLite
            self.mode = "sqlite"
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS hitl_tasks (
                    id TEXT PRIMARY KEY,
                    client_name TEXT NOT NULL,
                    client_segment TEXT NOT NULL,
                    agent_name TEXT NOT NULL,
                    task_type TEXT NOT NULL,
                    description TEXT NOT NULL,
                    original_value TEXT,
                    proposed_value TEXT NOT NULL,
                    confidence INTEGER NOT NULL,
                    status TEXT DEFAULT 'pending',
                    time_ago TEXT DEFAULT CURRENT_TIMESTAMP,
                    operator_notes TEXT,
                    rag_doc_used TEXT,
                    user_speech_audio BOOLEAN DEFAULT 0,
                    transcript_dialog TEXT,
                    langgraph_thread_id TEXT
                );
            """)
            conn.commit()
            cursor.close()
            conn.close()
            print(f"DatabaseService: Iniciado en modo de respaldo [SQLite] debido a: {str(e)}")
            
        self._seed_initial_data()

    def _seed_initial_data(self):
        # Sembrar las tareas iniciales que coinciden con la maqueta del frontend
        tasks = [
            {
                "id": "hitl-1",
                "client_name": "María Amparo Gutiérrez",
                "client_segment": "Adulto Mayor",
                "agent_name": "Agente UX 50+",
                "task_type": "Actualización de Dirección",
                "description": "Cambio de domicilio solicitado vía audio de voz en WhatsApp. Requiere autorización regulada de firma digital por operador.",
                "original_value": "Calle 5 # 34-12, Cali",
                "proposed_value": "Avenida 3 Norte # 23-45, Apto 402, Cali",
                "confidence": 94,
                "status": "pending",
                "rag_doc_used": "Actualización de datos paso a paso",
                "user_speech_audio": True,
                "transcript_dialog": 'María Amparo: "...sí mijo, por favor cámbiame la dirección de correspondencia a la Avenida 3 Norte número 23 guion 45, apartamento 402 en la ciudad de Cali, que me mudé con mi hija el mes pasado..."'
            },
            {
                "id": "hitl-2",
                "client_name": "Carlos Herrera Díaz",
                "client_segment": "Digital Activo",
                "agent_name": "Agente Perfil 360",
                "task_type": "Aumento de Cupo",
                "description": "Pre-aprobación y liberación de cupo en Tarjeta Olímpica Serfinanza basado en scoring crediticio y 65% de utilización recurrente.",
                "original_value": "$5,000,000 COP",
                "proposed_value": "$6,500,000 COP",
                "confidence": 98,
                "status": "pending",
                "rag_doc_used": "Tarifario Tarjeta Olimpica 2026",
                "transcript_dialog": 'Agente 360: "Detectando uso recurrente en Olímpica y comportamiento AAA de pago. Sugiriendo aumento de cupo inmediato al 30% adicional para asegurar compras en el Sábado Madrugón."'
            },
            {
                "id": "hitl-3",
                "client_name": "Roberto Gómez Oñate",
                "client_segment": "Cliente Preferencial",
                "agent_name": "Agente Banca",
                "task_type": "Exención de Tasa",
                "description": "Excepción de tasa preferencial de SuperCDT al 13.0% E.A. (el límite estándar autorizado es 12.5% E.A.) para retención de fondos de $15M.",
                "original_value": "12.5% E.A.",
                "proposed_value": "13.0% E.A. (Monto $15,000,000)",
                "confidence": 91,
                "status": "pending",
                "rag_doc_used": "Reglamento SuperCDT v3.2",
                "transcript_dialog": 'Roberto Gómez: "Si no me mejoran la tasa del CDT al 13%, tendré que retirar los 15 millones de pesos y llevarlos a otro banco que me ofrece mejor rentabilidad."'
            }
        ]
        
        for task in tasks:
            try:
                self.create_hitl_task(task)
            except Exception:
                # Ocurrirá si ya existen, lo cual es normal al reiniciar
                pass

    def get_connection(self):
        if self.mode == "postgres":
            return self._get_postgres_connection()
        else:
            return sqlite3.connect(self.sqlite_path)

    def get_all_hitl_tasks(self) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        tasks = []
        try:
            if self.mode == "postgres":
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                cursor.execute("SELECT * FROM hitl_tasks ORDER BY time_ago DESC")
                tasks = [dict(row) for row in cursor.fetchall()]
            else:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM hitl_tasks ORDER BY time_ago DESC")
                tasks = [dict(row) for row in cursor.fetchall()]
                # Normalizar booleanos en SQLite
                for t in tasks:
                    t["user_speech_audio"] = bool(t["user_speech_audio"])
            cursor.close()
        finally:
            conn.close()
        return tasks

    def create_hitl_task(self, task_data: Dict[str, Any]):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            
            # Normalizar campos
            user_audio = 1 if task_data.get("user_speech_audio", False) else 0
            if self.mode == "postgres":
                user_audio = bool(task_data.get("user_speech_audio", False))
                
            cursor.execute("""
                INSERT INTO hitl_tasks (
                    id, client_name, client_segment, agent_name, task_type,
                    description, original_value, proposed_value, confidence,
                    status, rag_doc_used, user_speech_audio, transcript_dialog, langgraph_thread_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """ if self.mode == "postgres" else """
                INSERT OR IGNORE INTO hitl_tasks (
                    id, client_name, client_segment, agent_name, task_type,
                    description, original_value, proposed_value, confidence,
                    status, rag_doc_used, user_speech_audio, transcript_dialog, langgraph_thread_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                task_data["id"],
                task_data["client_name"],
                task_data["client_segment"],
                task_data["agent_name"],
                task_data["task_type"],
                task_data["description"],
                task_data.get("original_value"),
                task_data["proposed_value"],
                task_data["confidence"],
                task_data.get("status", "pending"),
                task_data.get("rag_doc_used"),
                user_audio,
                task_data.get("transcript_dialog"),
                task_data.get("langgraph_thread_id")
            ))
            conn.commit()
            cursor.close()
        finally:
            conn.close()

    def update_hitl_task_status(self, task_id: str, status: str, notes: Optional[str] = None):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE hitl_tasks 
                SET status = %s, operator_notes = %s 
                WHERE id = %s
            """ if self.mode == "postgres" else """
                UPDATE hitl_tasks 
                SET status = ?, operator_notes = ? 
                WHERE id = ?;
            """, (status, notes, task_id))
            conn.commit()
            cursor.close()
        finally:
            conn.close()
