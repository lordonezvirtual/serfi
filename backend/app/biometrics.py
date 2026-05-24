# -*- coding: utf-8 -*-
import re
from datetime import datetime
from typing import Dict, Any, Optional

class BehavioralBiometricsAgent:
    """
    El Guardián de Identidad Invisible (Behavioral & Stylometric Biometrics Agent)
    Analiza de forma silenciosa e invisible en el backend cómo interactúa el usuario:
    1. Cadencia y Tiempos de Respuesta (Timing)
    2. Estilometría Lingüística (Stylometry)
    3. Anomalías de Acceso (Access)
    """

    # Jerga juvenil o términos sospechosos de fraude
    IMPOSTOR_SLANG = [
        "parce", "bro", "luca", "marica", "tumbo", "perro", "nea", "lucas",
        "palos", "gonorrea", "pana", "quiubo", "brayan", "webón", "guevon",
        "palo", "fast", "rapido", "ya", "ahora", "dame", "clave", "corta", 
        "tumbar", "cuenta", "transferir ya", "pasa la plata", "transfiere"
    ]

    # Palabras de cortesía y estilo típicos de la Sra. María Amparo
    SENIOR_COURTESY = [
        "hola mijo", "mijo", "señor", "por favor", "bendición", "gracias", 
        "su mercé", "linda", "lindo", "amable", "buenas tardes", "buenos días",
        "dios le pague", "dios te bendiga", "casita", "hijito", "ayudaría"
    ]

    # Emojis senior tradicionales vs emojis ausentes
    SENIOR_EMOJIS = ["😊", "👵", "🙏", "❤️", "💙", "🌸", "👍", "😍"]

    def __init__(self):
        pass

    def analyze_message(
        self, 
        message: str, 
        client_id: str,
        typing_speed_wpm: Optional[int] = None,
        response_delay_sec: Optional[int] = None,
        simulated_hour: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Realiza el análisis completo de biometría del comportamiento y estilometría.
        """
        msg_lower = message.lower()
        msg_len = len(message)
        words = message.split()
        word_count = len(words)

        # ----------------------------------------------------
        # 1. TIEMPOS Y CADENCIA (TIMING)
        # ----------------------------------------------------
        # Heurísticas por defecto basadas en el tipo de cliente
        if client_id == "maria":
            # María Amparo escribe lento y pausado
            default_wpm = 110
            default_delay = 14.5
        else:
            # Carlos u otros digitales escriben más rápido
            default_wpm = 210
            default_delay = 6.0

        wpm = typing_speed_wpm if typing_speed_wpm is not None else default_wpm
        delay = response_delay_sec if response_delay_sec is not None else default_delay

        timing_status = "normal"
        timing_flags = []

        if client_id == "maria":
            if wpm > 350:
                timing_status = "anomaly"
                timing_flags.append(f"Cadencia de escritura extremadamente rápida ({wpm} WPM) para adulto mayor.")
            if delay < 4.0:
                timing_status = "anomaly"
                timing_flags.append(f"Tiempo de respuesta inusualmente corto ({delay}s). Posible bot o impostor.")
        else:
            if wpm > 550:
                timing_status = "anomaly"
                timing_flags.append(f"Cadencia robótica de escritura ({wpm} WPM).")

        # ----------------------------------------------------
        # 2. ESTILOMETRÍA LINGÜÍSTICA (STYLOMETRY)
        # ----------------------------------------------------
        stylometry_status = "normal"
        stylometry_flags = []
        
        # A. Mayúsculas sostenidas
        uppercase_ratio = sum(1 for c in message if c.isupper()) / msg_len if msg_len > 0 else 0
        is_all_caps = uppercase_ratio > 0.65 and msg_len > 8
        if is_all_caps:
            stylometry_flags.append("Uso de mayúsculas sostenidas (gritado/urgencia).")
            stylometry_status = "anomaly"

        # B. Detección de Jerga Juvenil / Impostora
        slang_matches = [sl for sl in self.IMPOSTOR_SLANG if re.search(r'\b' + re.escape(sl) + r'\b', msg_lower)]
        
        # C. Emojis
        emoji_pattern = "none"
        has_senior_emojis = any(em in message for em in self.SENIOR_EMOJIS)
        # Buscar emojis en general usando regex
        all_emojis = re.findall(r'[\U00010000-\U0010ffff\u2600-\u27bf]', message)
        if len(all_emojis) > 0:
            emoji_pattern = "senior" if has_senior_emojis else "youth"

        # D. Puntos suspensivos y tildes
        has_ellipses = "..." in message or ".." in message
        # Contar tildes
        tildes_count = sum(1 for c in msg_lower if c in ['á', 'é', 'í', 'ó', 'ú'])

        # Evaluación de estilometría específica para María Amparo
        courtesy_matches = [c for c in self.SENIOR_COURTESY if c in msg_lower]
        
        if client_id == "maria":
            # Si no hay tildes ni cortesía y usa jerga impostora
            if slang_matches:
                stylometry_status = "anomaly"
                stylometry_flags.append(f"Jerga no compatible detectada: {', '.join(slang_matches)}.")
            if not has_senior_emojis and len(all_emojis) == 0 and word_count > 6:
                # María casi siempre usa algún emoji 😊 o cortesía
                if len(courtesy_matches) == 0:
                    stylometry_flags.append("Ausencia total de modales de cortesía o emojis característicos.")
                    # Aumentar peso
                    if wpm > 250:
                        stylometry_status = "anomaly"
        
        # Contar errores ortográficos simulados o abreviaciones agresivas (pq, xq, d, k)
        youth_abbreviations = [" pq ", " xq ", " d ", " k ", " tb ", " tmb ", " grax ", " bn "]
        abbr_matches = [ab for ab in youth_abbreviations if ab in " " + msg_lower + " "]
        if client_id == "maria" and len(abbr_matches) > 0:
            stylometry_status = "anomaly"
            stylometry_flags.append(f"Uso de abreviaciones juveniles agresivas: {', '.join([a.strip() for a in abbr_matches])}.")

        # ----------------------------------------------------
        # 3. ANOMALÍAS DE ACCESO (ACCESS & HOUR)
        # ----------------------------------------------------
        access_status = "normal"
        access_flags = []

        # Determinar hora
        current_hour = 16 # Defecto 4 PM
        if simulated_hour:
            try:
                current_hour = int(simulated_hour.split(":")[0])
            except:
                pass
        else:
            current_hour = datetime.now().hour

        is_unusual_hour = current_hour >= 23 or current_hour <= 4
        
        if client_id == "maria" and is_unusual_hour:
            access_status = "anomaly"
            access_flags.append(f"Acceso inusual a altas horas de la noche ({simulated_hour or '02:00 AM'}).")

        # Evaluar tono
        tone = "neutral"
        if len(courtesy_matches) > 0:
            tone = "friendly"
        elif slang_matches or is_all_caps:
            tone = "slang/aggressive"

        if client_id == "maria" and tone == "slang/aggressive":
            access_status = "anomaly"
            access_flags.append("Tono de comunicación hostil, imperativo o informal incompatible con el perfil.")

        # ----------------------------------------------------
        # 4. CÁLCULO DEL TRUST SCORE (Puntaje de Confianza 0-100)
        # ----------------------------------------------------
        trust_score = 100
        
        if client_id == "maria":
            # Castigos por anomalías
            if timing_status == "anomaly":
                trust_score -= 25
            if access_status == "anomaly":
                trust_score -= 25
            if stylometry_status == "anomaly":
                trust_score -= 40
            
            # Penalizaciones específicas
            if slang_matches:
                trust_score -= 20
            if is_all_caps:
                trust_score -= 15
            if is_unusual_hour:
                trust_score -= 15
                
            # Bonificaciones por conducta típica
            if len(courtesy_matches) > 0:
                trust_score += 15
            if has_senior_emojis:
                trust_score += 10
        else:
            # Para Carlos / otros usuarios
            if timing_status == "anomaly":
                trust_score -= 20
            if is_all_caps:
                trust_score -= 20
            if slang_matches and len(slang_matches) > 4:
                trust_score -= 15

        # Acotar trust score entre 0 y 100
        trust_score = max(0, min(100, trust_score))

        # Determinar si se congela la cuenta
        action = "allow"
        freeze_reason = ""
        if client_id == "maria" and trust_score < 50:
            action = "freeze_and_hitl"
            freeze_reason = "OTP Invisible Fallido: Anomalía crítica en cadencia, estilometría y horario de acceso."

        return {
            "client_id": client_id,
            "message_analyzed": message,
            "trust_score": trust_score,
            "action": action,
            "freeze_reason": freeze_reason,
            "metrics": {
                "timing": {
                    "wpm": wpm,
                    "response_delay_sec": delay,
                    "status": timing_status,
                    "flags": timing_flags
                },
                "stylometry": {
                    "all_caps": is_all_caps,
                    "slang_count": len(slang_matches),
                    "emoji_pattern": emoji_pattern,
                    "ellipses_present": has_ellipses,
                    "tildes_count": tildes_count,
                    "courtesy_detected": len(courtesy_matches) > 0,
                    "status": stylometry_status,
                    "flags": stylometry_flags
                },
                "access": {
                    "simulated_hour": simulated_hour or "16:00",
                    "is_unusual_hour": is_unusual_hour,
                    "tone": tone,
                    "status": access_status,
                    "flags": access_flags
                }
            }
        }
