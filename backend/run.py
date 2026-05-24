import uvicorn
import os

if __name__ == "__main__":
    print("Banco Serfinanza — Iniciando Servidor de Agentes en http://localhost:8000")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
