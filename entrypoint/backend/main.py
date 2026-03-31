from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.checklist import router as checklist_router
from routes.resources import router as resources_router
from routes.ngos import router as ngos_router
from routes.scam import router as scam_router
from routes.breach import router as breach_router

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(checklist_router)
app.include_router(resources_router)
app.include_router(ngos_router)
app.include_router(scam_router)
app.include_router(breach_router)
