from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "DeploySarthi AI Service"}

@app.get("/health")
def health():
    return {"status": "OK", "service": "DeploySarthi AI"}