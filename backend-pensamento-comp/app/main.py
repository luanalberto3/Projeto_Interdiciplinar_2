from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models import SessionLocal, Aluno, Turma, Professor, TentativaErro 

# uvicorn app.main:app, npm run dev

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

# 1 BANCO DE DADOS INICIAL
@app.on_event("startup")
def popular_banco_inicial():
    db = SessionLocal()
    try:
        if not db.query(Professor).first():
            db.add(Professor(nome="Admin", codigo_acesso="admin123"))
            db.commit()

        if not db.query(Turma).first():
            turma6 = Turma(nome_turma="6º Ano")
            turma7 = Turma(nome_turma="7º Ano")
            db.add_all([turma6, turma7])
            db.commit()

            alunos_6 = [
                Aluno(nome="Ana", codigo_acesso="1111", pontos_totais=0, turma_id=turma6.id),
                Aluno(nome="Bruno", codigo_acesso="2222", pontos_totais=0, turma_id=turma6.id),
                Aluno(nome="Carlos", codigo_acesso="3333", pontos_totais=0, turma_id=turma6.id),
            ]
            alunos_7 = [
                Aluno(nome="Fernanda", codigo_acesso="6666", pontos_totais=0, turma_id=turma7.id),
                Aluno(nome="Gustavo", codigo_acesso="7777", pontos_totais=0, turma_id=turma7.id),
            ]
            db.add_all(alunos_6 + alunos_7)
            db.commit()
    finally:
        db.close()

# 2 ROTAS DE LOGIN
class LoginData(BaseModel):
    nome: str
    codigo_acesso: str

@app.post("/api/login")
def login(dados: LoginData, db: Session = Depends(get_db)):
    aluno = db.query(Aluno).filter(Aluno.nome == dados.nome, Aluno.codigo_acesso == dados.codigo_acesso).first()
    if aluno: return {"status": "sucesso", "aluno": {"id": aluno.id, "nome": aluno.nome, "turma_id": aluno.turma_id, "nivel_atual": aluno.nivel_atual}}
    return {"status": "erro", "mensagem": "Nome ou código numérico incorretos!"}

@app.post("/api/login-professor")
def login_professor(dados: LoginData, db: Session = Depends(get_db)):
    prof = db.query(Professor).filter(Professor.nome == dados.nome, Professor.codigo_acesso == dados.codigo_acesso).first()
    if prof: return {"status": "sucesso", "professor": {"id": prof.id, "nome": prof.nome}}
    return {"status": "erro", "mensagem": "Credenciais incorretas!"}

# 3 VALIDAÇÃO DE CÓDIGO POR FASES
class DesafioRecebido(BaseModel):
    codigo: str
    aluno_id: int
    fase_testada: int

@app.post("/api/validar-codigo")
def validar_codigo(desafio: DesafioRecebido, db: Session = Depends(get_db)):
    aluno = db.query(Aluno).filter(Aluno.id == desafio.aluno_id).first()
    
    if not aluno:
        return {"status": "falha", "mensagem": "Sessão inválida! Clique em 'Sair' e faça login novamente."}

    codigo = desafio.codigo
    fase = desafio.fase_testada
    sucesso = False
    mensagem_erro = ""

    if fase == 1:
        if any(op in codigo for op in ["+", "-", "*", "/"]): sucesso = True
        else: mensagem_erro = "Dica: Como fazemos para calcular quantidades? Procure na categoria de Matemática."
    elif fase == 2:
        if "if " in codigo: sucesso = True
        else: mensagem_erro = "Dica: Que tipo de bloco usamos para verificar uma condição ('Se')?"
    elif fase == 3:
        if "for " in codigo or "while " in codigo: sucesso = True
        else: mensagem_erro = "Dica: Existe algum bloco que nos permita criar um 'loop' para repetir uma ação?"
    elif fase == 4:
        if ">" in codigo or "<" in codigo or "==" in codigo or "===" in codigo: sucesso = True
        else: mensagem_erro = "Dica: O robô precisa comparar se a velocidade é maior ou menor."
    elif fase == 5:
        if "/" in codigo: sucesso = True
        else: mensagem_erro = "Dica: Qual operação matemática usamos para dividir as coisas?"
    elif fase == 6: 
        if ("for " in codigo or "while " in codigo) and any(op in codigo for op in ["+", "-", "*", "/"]) and "window.alert" in codigo:
            sucesso = True
        else: mensagem_erro = "Dica: Você precisa de um bloco de Repetição, um bloco de Matemática E o bloco de 'imprimir'!"
    elif fase == 7: 
        if ("for " in codigo or "while " in codigo) and "if " in codigo and "window.alert" in codigo:
            sucesso = True
        else: mensagem_erro = "Dica: O robô deve fazer a patrulha contínua (Repetição), tomar uma decisão (Se) e usar o bloco 'imprimir'!"
    elif fase == 8: 
        if "if " in codigo and any(comp in codigo for comp in [">", "<", "==", "==="]) and any(op in codigo for op in ["+", "-", "*", "/"]) and "window.alert" in codigo:
            sucesso = True
        else: mensagem_erro = "Dica: O desafio mestre exige o bloco 'Se', um bloco de 'Comparação', uma operação matemática e o bloco 'imprimir'."

    if sucesso:
        if fase == aluno.nivel_atual and fase <= 8:
            aluno.pontos_totais += 10
            aluno.nivel_atual += 1 
            db.commit()
            return {"status": "sucesso", "novo_nivel": aluno.nivel_atual, "mensagem": f"🎉 Sensacional, {aluno.nome}! Você passou de fase!"}
        else:
            return {"status": "sucesso", "mensagem": "✅ Código correto! Muito bem por revisar suas habilidades."}
    else:
        registro_erro = db.query(TentativaErro).filter(TentativaErro.turma_id == aluno.turma_id, TentativaErro.fase_testada == fase).first()
        if not registro_erro:
            registro_erro = TentativaErro(turma_id=aluno.turma_id, fase_testada=fase, quantity_erros=1) # Note: adjust if your model field is distinct
            # Forçando compatibilidade com a coluna criada na tabela anterior:
            registro_erro = TentativaErro(turma_id=aluno.turma_id, fase_testada=fase, quantidade_erros=1)
            db.add(registro_erro)
        else:
            registro_erro.quantidade_erros += 1
        db.commit()
        return {"status": "falha", "mensagem": mensagem_erro}

# 4 ROTAS DE CADASTRO E GERENCIAMENTO
class TurmaCriar(BaseModel): nome_turma: str
@app.post("/api/turmas")
def criar_turma(turma: TurmaCriar, db: Session = Depends(get_db)):
    nova_turma = Turma(nome_turma=turma.nome_turma)
    db.add(nova_turma)
    db.commit()
    return {"mensagem": f"Turma '{nova_turma.nome_turma}' criada!"}

class AlunoCriar(BaseModel):
    nome: str
    codigo_acesso: str
    turma_id: int
@app.post("/api/alunos")
def criar_aluno(aluno: AlunoCriar, db: Session = Depends(get_db)):
    novo_aluno = Aluno(nome=aluno.nome, codigo_acesso=aluno.codigo_acesso, turma_id=aluno.turma_id, pontos_totais=0, nivel_atual=1)
    db.add(novo_aluno)
    db.commit()
    return {"mensagem": f"Aluno {novo_aluno.nome} adicionado com sucesso!"}

@app.get("/api/turmas")
def listar_turmas(db: Session = Depends(get_db)): return db.query(Turma).all()

@app.get("/api/alunos")
def listar_alunos(db: Session = Depends(get_db)): return db.query(Aluno).all()

# 5 ROTAS DE RANKINGS E RELATÓRIOS
@app.get("/api/ranking-turmas")
def obter_ranking_turmas(db: Session = Depends(get_db)):
    turmas = db.query(Turma).all()
    ranking = []
    for t in turmas:
        alunos_da_turma = db.query(Aluno).filter(Aluno.turma_id == t.id).all()
        total_pontos = sum(a.pontos_totais for a in alunos_da_turma)
        ranking.append({"id": t.id, "nome_turma": t.nome_turma, "pontos_totais": total_pontos})
    ranking.sort(key=lambda x: x["pontos_totais"], reverse=True)
    return ranking

@app.get("/api/ranking-alunos")
def obter_ranking_alunos(db: Session = Depends(get_db)):
    alunos = db.query(Aluno).all()
    ranking = [{"id": a.id, "nome": a.nome, "pontos_totais": a.pontos_totais, "nome_turma": a.turma.nome_turma if a.turma else "Sem Turma"} for a in alunos]
    ranking.sort(key=lambda x: x["pontos_totais"], reverse=True)
    return ranking

@app.get("/api/dificuldades")
def obter_dificuldades(db: Session = Depends(get_db)):
    erros = db.query(TentativaErro).all()
    resultado = []
    for erro in erros:
        turma = db.query(Turma).filter(Turma.id == erro.turma_id).first()
        if College := turma:
            resultado.append({
                "id": erro.id,
                "nome_turma": turma.nome_turma,
                "fase": erro.fase_testada,
                "quantidade_erros": erro.quantidade_erros
            })
    resultado.sort(key=lambda x: x["quantidade_erros"], reverse=True)
    return resultado