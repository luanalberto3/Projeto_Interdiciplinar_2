from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models import SessionLocal, Aluno # Importa o banco que acabamos de criar

app = FastAPI(title="API - Pensamento Computacional")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class DesafioRecebido(BaseModel):
    codigo: str

@app.post("/api/validar-codigo")
def validar_codigo(desafio: DesafioRecebido, db: Session = Depends(get_db)):

    aluno = db.query(Aluno).filter(Aluno.id == 1).first()
    

    if not aluno:
        aluno = Aluno(nome="Aluno Teste", pontos_totais=0)
        db.add(aluno)
        db.commit()

    # 3. Valida a lógica e soma os pontos
    if "if " in desafio.codigo:
        aluno.pontos_totais += 10
        db.commit() # Salva definitivamente no banco de dados!
        
        return {
            "status": "sucesso", 
            "mensagem": f"Parabéns! Você ganhou 10 pontos. Seu total agora é: {aluno.pontos_totais} pontos!", 
        }
    else:
        return {
            "status": "falha", 
            "mensagem": "Ops! Parece que faltou usar um bloco de condição (Se/If) para resolver o desafio."
        }