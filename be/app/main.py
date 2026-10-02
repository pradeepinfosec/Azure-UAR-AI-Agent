from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import dashboard_controller, identity_controller, assessment_controller, policy_controller, connector_controller

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Enable CORS for local Vite development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_controller.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(identity_controller.router, prefix=f"{settings.API_V1_STR}/identities", tags=["Identities"])
app.include_router(assessment_controller.router, prefix=f"{settings.API_V1_STR}/assessment", tags=["Assessment"])
app.include_router(policy_controller.router, prefix=f"{settings.API_V1_STR}/policies", tags=["Policies"])
app.include_router(connector_controller.router, prefix=f"{settings.API_V1_STR}/connectors", tags=["Connectors"])

@app.get("/")
def root():
    return {"message": "Azure UAR AI Agent Backend API Running", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
