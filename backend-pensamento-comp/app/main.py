from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models import SessionLocal, Aluno, Turma

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

# 1. GERAÇÃO AUTOMÁTICA DAS TURMAS E ALUNOS AO LIGAR O SERVIDOR
@app.on_event("startup")
def popular_banco_inicial():
    db = SessionLocal()
    try:
        # Se a turma 6º Ano não existir, cria os dados iniciais
        if not db.query(Turma).first():
            turma6 = Turma(nome_turma="6º Ano")
            turma7 = Turma(nome_turma="7º Ano")
            db.add_all([turma6, turma7])
            db.commit()

            # 5 alunos do 6º Ano
            alunos_6 = [
                Aluno(nome="Ana", codigo_acesso="1111", pontos_totais=0, turma_id=turma6.id),
                Aluno(nome="Bruno", codigo_acesso="2222", pontos_totais=0, turma_id=turma6.id),
                Aluno(nome="Carlos", codigo_acesso="3333", pontos_totais=0, turma_id=turma6.id),
                Aluno(nome="Diana", codigo_acesso="4444", pontos_totais=0, turma_id=turma6.id),
                Aluno(nome="Eduardo", codigo_acesso="5555", pontos_totais=0, turma_id=turma6.id),
            ]
            # 5 alunos do 7º Ano
            alunos_7 = [
                Aluno(nome="Fernanda", codigo_acesso="6666", pontos_totais=0, turma_id=turma7.id),
                Aluno(nome="Gustavo", codigo_acesso="7777", pontos_totais=0, turma_id=turma7.id),
                Aluno(nome="Helena", codigo_acesso="8888", pontos_totais=0, turma_id=turma7.id),
                Aluno(nome="Igor", codigo_acesso="9999", pontos_totais=0, turma_id=turma7.id),
                Aluno(nome="Julia", codigo_acesso="1010", pontos_totais=0, turma_id=turma7.id),
            ]
            
            db.add_all(alunos_6 + alunos_7)
            db.commit()
    finally:
        db.close()

# ... (Mantenha as importações e popular_banco_inicial como estavam) ...

# 2. ROTA DE LOGIN ATUALIZADA (Agora devolve o nível)
class LoginData(BaseModel):
    nome: str
    codigo_acesso: str

@app.post("/api/login")
def login(dados: LoginData, db: Session = Depends(get_db)):
    aluno = db.query(Aluno).filter(Aluno.nome == dados.nome, Aluno.codigo_acesso == dados.codigo_acesso).first()
    if aluno:
        return {
            "status": "sucesso", 
            "aluno": {"id": aluno.id, "nome": aluno.nome, "turma_id": aluno.turma_id, "nivel_atual": aluno.nivel_atual}
        }
    return {"status": "erro", "mensagem": "Nome ou código numérico incorretos!"}

# 3. VALIDAÇÃO DE CÓDIGO POR FASES (BNCC)
class DesafioRecebido(BaseModel):
    codigo: str
    aluno_id: int

@app.post("/api/validar-codigo")
def validar_codigo(desafio: DesafioRecebido, db: Session = Depends(get_db)):
    aluno = db.query(Aluno).filter(Aluno.id == desafio.aluno_id).first()
    codigo = desafio.codigo
    
    sucesso = False
    mensagem_erro = ""

    # FASE 1: Decomposição (Requer bloco de Matemática)
    if aluno.nivel_atual == 1:
        if "+" in codigo or "-" in codigo or "*" in codigo or "/" in codigo or "==" in codigo:
            sucesso = True
        else:
            mensagem_erro = "Ops! Na Fase 1 você precisa usar um bloco de Matemática para calcular os suprimentos."

    # FASE 2: Abstração e Condicionais (Requer bloco If/Se)
    elif aluno.nivel_atual == 2:
        if "if " in codigo:
            sucesso = True
        else:
            mensagem_erro = "Ops! Na Fase 2 você precisa usar o bloco de Lógica 'Se / Faça' para desviar do obstáculo."
            
    # FASE 3: Padrões e Laços (Requer bloco de Repetição)
    elif aluno.nivel_atual == 3:
        if "for " in codigo or "while " in codigo:
            sucesso = True
        else:
            mensagem_erro = "Ops! Na Fase 3 você precisa usar um bloco de Repetição (Laços) para limpar o lixo continuamente."

    # Finalizou todas as fases
    elif aluno.nivel_atual > 3:
        return {"status": "sucesso", "mensagem": "Você já completou todas as missões disponíveis!"}

    # Processa o resultado
    if sucesso:
        aluno.pontos_totais += 10
        aluno.nivel_atual += 1 # Avança para a próxima fase!
        db.commit()
        return {
            "status": "sucesso", 
            "novo_nivel": aluno.nivel_atual,
            "mensagem": f"🎉 Sensacional, {aluno.nome}! Você passou de fase e ganhou +10 pontos para a turma!"
        }
    else:
        return {"status": "falha", "mensagem": mensagem_erro}

# ... (Mantenha o resto das rotas abaixo: criar_turma, listar_turmas, ranking, etc) ...

# AS OUTRAS ROTAS CONTINUAM IGUAIS
class TurmaCriar(BaseModel):
    nome_turma: str

@app.post("/api/turmas")
def criar_turma(turma: TurmaCriar, db: Session = Depends(get_db)):
    nova_turma = Turma(nome_turma=turma.nome_turma)
    db.add(nova_turma)
    db.commit()
    db.refresh(nova_turma)
    return {"mensagem": f"Turma '{nova_turma.nome_turma}' criada com sucesso!", "id": nova_turma.id}

@app.get("/api/turmas")
def listar_turmas(db: Session = Depends(get_db)):
    return db.query(Turma).all()

@app.get("/api/alunos")
def listar_alunos(db: Session = Depends(get_db)):
    return db.query(Aluno).all()

@app.get("/api/ranking-turmas")
def obter_ranking_turmas(db: Session = Depends(get_db)):
    turmas = db.query(Turma).all()
    ranking = []
    for turma in turmas:
        alunos_da_turma = db.query(Aluno).filter(Aluno.turma_id == turma.id).all()
        total_pontos = sum(a.pontos_totais for a in alunos_da_turma)
        ranking.append({"id": turma.id, "nome_turma": turma.nome_turma, "pontos_totais": total_pontos})
    ranking.sort(key=lambda x: x["pontos_totais"], reverse=True)
    return ranking