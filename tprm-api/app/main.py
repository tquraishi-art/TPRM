from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.routers import risks, vendors, sbr, sca, kri, irq, chat
import os

app = FastAPI(
    title="TPRM Platform API",
    version="1.0.0",
    description="Third-Party Risk Management — FastAPI backend",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(risks.router,   prefix="/api/risks",   tags=["Risks"])
app.include_router(sbr.router,     prefix="/api/sbr",     tags=["SBR Scores"])
app.include_router(sca.router,     prefix="/api/sca",     tags=["SCA"])
app.include_router(kri.router,     prefix="/api/kri",     tags=["KRI"])
app.include_router(irq.router,     prefix="/api/irq",     tags=["IRQ"])
app.include_router(chat.router,    prefix="/api/chat",    tags=["AI Chat"])

@app.get("/health")
def health():
    return {"status": "ok"}

# Serve static frontend — looks for /static first (future React build),
# then falls back to index.html one directory up
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")
INDEX_HTML  = os.path.join(os.path.dirname(__file__), "..", "..", "index.html")

if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", include_in_schema=False)
@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend(full_path: str = ""):
    # Don't catch API or health routes
    if full_path.startswith("api/") or full_path == "health":
        from fastapi import HTTPException
        raise HTTPException(status_code=404)
    # React build output takes priority
    react_index = os.path.join(STATIC_DIR, "index.html")
    if os.path.isfile(react_index):
        return FileResponse(react_index)
    # Fall back to current single-file app
    if os.path.isfile(INDEX_HTML):
        return FileResponse(INDEX_HTML)
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Frontend not found")
