from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import CORS_ORIGINS, PORT
from routers import recommendations, simulator, interview, resume, dashboard

app = FastAPI(title="JOBREF AI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
app.include_router(simulator.router, tags=["Referral Simulator"])
app.include_router(interview.router, prefix="/shadow-interview", tags=["Shadow Interview"])
app.include_router(resume.router, prefix="/resume", tags=["Resume Parser"])
app.include_router(dashboard.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
