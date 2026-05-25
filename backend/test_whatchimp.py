import os
import sys
import json
import logging
import requests

# Configurar logging para mostrar en consola y guardar en un archivo whatchimp_api.log
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('whatchimp_api.log', encoding='utf-8')
    ]
)
logger = logging.getLogger("whatchimp_connector")

def send_whatsapp_message():
    url = "https://app.whatchimp.com/api/v1/whatsapp/send"
    
    payload = {
        "apiToken": "20661|IVS2PeovKZtA7Wb9aFgRTeyFSEzwxBpW9sljH8sE7de7d9a9",
        "phone_number_id": "1003836066152965",
        "phone_number": "573043344722",
        "message": "¡Hola! Esta es una prueba automatizada en Python con todos los campos llenos."
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    logger.info("Iniciando conexión con la API de Whatchimp...")
    logger.info(f"URL de destino: {url}")
    # Ofuscamos el token para no exponerlo completo en los logs de depuración estándar
    masked_token = payload['apiToken'][:8] + "..." + payload['apiToken'][-8:]
    logger.info(f"Payload de envío: {{'apiToken': '{masked_token}', 'phone_number_id': '{payload['phone_number_id']}', 'phone_number': '{payload['phone_number']}', 'message': '{payload['message']}'}}")
    
    response = None
    try:
        # Realizamos la petición POST con un timeout prudente de 15 segundos
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        logger.info(f"Respuesta recibida. Código de estado HTTP: {response.status_code}")
        
        # Lanza una excepción requests.exceptions.HTTPError si el código es 4xx o 5xx
        response.raise_for_status()
        
        # Intentar parsear como JSON
        try:
            response_json = response.json()
            logger.info("¡Conexión y envío exitosos!")
            logger.info(f"Respuesta detallada de la API:\n{json.dumps(response_json, indent=4, ensure_ascii=False)}")
            return response_json
        except ValueError:
            logger.warning("La API no respondió con un formato JSON válido.")
            logger.info(f"Contenido en texto de la respuesta:\n{response.text}")
            return {"status": "success", "raw_response": response.text}
            
    except requests.exceptions.HTTPError as http_err:
        logger.error("Se produjo un error HTTP de la API de Whatchimp.")
        logger.error(f"Detalle del Error HTTP: {http_err}")
        if response is not None:
            logger.error(f"Código de estado devuelto: {response.status_code}")
            logger.error(f"Cuerpo de la respuesta de error:\n{response.text}")
            
    except requests.exceptions.ConnectionError as conn_err:
        logger.error("Error de conexión: No se pudo establecer contacto con el servidor.")
        logger.error("Verifique su conexión a internet o si la URL de la API es correcta.")
        logger.error(f"Detalles: {conn_err}")
        
    except requests.exceptions.Timeout as timeout_err:
        logger.error("Error de Tiempo de Espera Agotado (Timeout).")
        logger.error(f"El servidor tardó demasiado tiempo en responder. Detalles: {timeout_err}")
        
    except requests.exceptions.RequestException as req_err:
        logger.error(f"Ocurrió un error inesperado al gestionar la petición: {req_err}")
        
    except Exception as e:
        logger.error(f"Ocurrió un error inesperado en la lógica del script: {e}")
        
    return None

if __name__ == "__main__":
    send_whatsapp_message()
