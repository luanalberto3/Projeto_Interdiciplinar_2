from sqlalchemy import Column, Integer, String, ForeignKey, create_engine
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./gamificacao.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Professor(Base):
    __tablename__ = "professores"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    codigo_acesso = Column(String)

class Turma(Base):
    __tablename__ = "turmas"
    id = Column(Integer, primary_key=True, index=True)
    nome_turma = Column(String, unique=True, index=True)
    alunos = relationship("Aluno", back_populates="turma")

class Aluno(Base):
    __tablename__ = "alunos"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    codigo_acesso = Column(String)
    pontos_totais = Column(Integer, default=0)
    nivel_atual = Column(Integer, default=1)
    turma_id = Column(Integer, ForeignKey("turmas.id"))
    turma = relationship("Turma", back_populates="alunos")

# Tabela para rastrear as dificuldades das turmas
class TentativaErro(Base):
    __tablename__ = "tentativas_erros"
    id = Column(Integer, primary_key=True, index=True)
    turma_id = Column(Integer, ForeignKey("turmas.id"))
    fase_testada = Column(Integer)
    quantidade_erros = Column(Integer, default=0)
    
Base.metadata.create_all(bind=engine)