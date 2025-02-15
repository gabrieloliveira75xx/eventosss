from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routes import tickets
from app.database import connect_to_mongo, close_mongo_connection
import logging

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routes
app.include_router(tickets.router, prefix="/api")

# Startup and shutdown events
@app.on_event("startup")
def startup_db_client():
    """
    Conecta ao MongoDB quando a aplicação inicia.
    """
    connect_to_mongo()  # Função síncrona, não use await
    logger.info("Connected to MongoDB")

@app.on_event("shutdown")
def shutdown_db_client():
    """
    Fecha a conexão com o MongoDB quando a aplicação é encerrada.
    """
    close_mongo_connection()  # Função síncrona, não use await
    logger.info("Disconnected from MongoDB")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Middleware para logar todas as requisições e respostas.
    """
    logger.info(f"Received {request.method} request to {request.url}")
    response = await call_next(request)
    logger.info(f"Returned {response.status_code} for {request.method} {request.url}")
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)