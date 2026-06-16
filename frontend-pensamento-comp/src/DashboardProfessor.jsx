import React, { useState, useEffect } from 'react';

function DashboardProfessor() {
  // Estados de Autenticação do Professor
  const [professorLogado, setProfessorLogado] = useState(null);
  const [loginNome, setLoginNome] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  // Estados de Dados
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [rankingTurmas, setRankingTurmas] = useState([]);
  const [dificuldades, setDificuldades] = useState([]);
  
  // Estados de Criação
  const [nomeNovaTurma, setNomeNovaTurma] = useState('');
  const [novoAlunoNome, setNovoAlunoNome] = useState('');
  const [novoAlunoSenha, setNovoAlunoSenha] = useState('');
  const [novoAlunoTurmaId, setNovoAlunoTurmaId] = useState('');

  useEffect(() => {
    const profSalvo = localStorage.getItem('professorLogado');
    if (profSalvo) {
      setProfessorLogado(JSON.parse(profSalvo));
      carregarDados();
    }
  }, []);

  const carregarDados = async () => {
    try {
      const resAlunos = await fetch('http://127.0.0.1:8000/api/alunos');
      setAlunos(await resAlunos.json());

      const resTurmas = await fetch('http://127.0.0.1:8000/api/turmas');
      const dadosTurmas = await resTurmas.json();
      setTurmas(dadosTurmas);
      
      if (dadosTurmas.length > 0 && !novoAlunoTurmaId) {
        setNovoAlunoTurmaId(dadosTurmas[0].id);
      }

      const resRanking = await fetch('http://127.0.0.1:8000/api/ranking-turmas');
      setRankingTurmas(await resRanking.json());

      const resDificuldades = await fetch('http://127.0.0.1:8000/api/dificuldades');
      setDificuldades(await resDificuldades.json());

    } catch (erro) {
      console.error("Erro ao carregar dados:", erro);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/login-professor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: loginNome, codigo_acesso: loginSenha })
      });
      const dados = await res.json();
      
      if (dados.status === 'sucesso') {
        setProfessorLogado(dados.professor);
        localStorage.setItem('professorLogado', JSON.stringify(dados.professor));
        carregarDados();
      } else {
        alert(dados.mensagem);
      }
    } catch (erro) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  const handleLogout = () => {
    setProfessorLogado(null);
    localStorage.removeItem('professorLogado');
  };

  const handleCriarTurma = async (e) => {
    e.preventDefault();
    if (!nomeNovaTurma.trim()) return alert("Digite o nome da turma.");
    
    try {
      const res = await fetch('http://127.0.0.1:8000/api/turmas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_turma: nomeNovaTurma }),
      });
      const dados = await res.json();
      alert(dados.mensagem);
      setNomeNovaTurma('');
      carregarDados();
    } catch (erro) {
      alert("Erro ao criar a turma.");
    }
  };

  const handleCriarAluno = async (e) => {
    e.preventDefault();
    if (!novoAlunoNome || !novoAlunoSenha || !novoAlunoTurmaId) {
      return alert("Preencha todos os campos para cadastrar o aluno.");
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/alunos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome: novoAlunoNome, 
          codigo_acesso: novoAlunoSenha,
          turma_id: parseInt(novoAlunoTurmaId)
        }),
      });
      const dados = await res.json();
      alert(dados.mensagem);
      setNovoAlunoNome('');
      setNovoAlunoSenha('');
      carregarDados();
    } catch (erro) {
      alert("Erro ao cadastrar aluno.");
    }
  };

  const renderizarMedalhas = (pontos) => {
    const medalhas = [];
    if (pontos >= 10) medalhas.push('🥉 Aprendiz');
    if (pontos >= 30) medalhas.push('🥈 Desenvolvedor');
    if (pontos >= 50) medalhas.push('🥇 Mestre');
    if (pontos >= 80) medalhas.push('🏆 Lenda');
    if (medalhas.length === 0) return <span style={{ color: '#7f8c8d', fontSize: '13px' }}>Sem conquistas</span>;

    return medalhas.map((m, i) => (
      <span key={i} style={{ display: 'inline-block', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', marginRight: '5px', marginBottom: '5px', color: '#856404', fontWeight: 'bold' }}>{m}</span>
    ));
  };

  // FUNÇÕES DE PREPARAÇÃO DA TABELA
  // 1. Pega o ID da Turma do aluno e acha o nome dela
  const obterNomeTurma = (turmaId) => {
    const turma = turmas.find(t => t.id === turmaId);
    return turma ? turma.nome_turma : "Sem Turma";
  };

  // 2. Ordena os alunos do maior para o menor (Ranking)
  const alunosOrdenados = [...alunos].sort((a, b) => b.pontos_totais - a.pontos_totais);

  if (!professorLogado) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fdfefe', borderRadius: '8px', maxWidth: '400px', margin: '40px auto', border: '1px solid #ccc' }}>
        <h2 style={{ color: '#d35400', marginTop: 0 }}>Portal do Professor</h2>
        <p style={{ color: '#555' }}>Acesso restrito para gestão de turmas e acompanhamento pedagógico.</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          <input type="text" placeholder="Nome do Professor" aria-label="Nome do professor" value={loginNome} onChange={(e) => setLoginNome(e.target.value)} style={{ padding: '12px', fontSize: '15px', borderRadius: '4px', border: '1px solid #ccc' }} required />
          <input type="password" placeholder="Senha" aria-label="Senha de acesso" value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} style={{ padding: '12px', fontSize: '15px', borderRadius: '4px', border: '1px solid #ccc' }} required />
          <button type="submit" style={{ padding: '12px', fontSize: '16px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Acessar Portal</button>
        </form>
        
        <div aria-hidden="true" style={{ marginTop: '25px', fontSize: '13px', color: '#7f8c8d', textAlign: 'left', backgroundColor: '#eee', padding: '10px', borderRadius: '4px' }}>
          <strong>Conta Padrão (Teste):</strong><br/>Nome: <em>Admin</em><br/>Senha: <em>admin123</em>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Painel do Professor - Bem-vindo, {professorLogado.nome}!</h2>
          <p>Gerencie suas turmas, adicione alunos e acompanhe o progresso geral.</p>
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Sair da Conta</button>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {/* CADASTRO DE TURMAS */}
        <div style={{ flex: '1 1 300px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3 style={{ marginTop: 0 }}>📁 Nova Turma</h3>
          <form onSubmit={handleCriarTurma} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Ex: 8º Ano A" aria-label="Nome da nova turma" value={nomeNovaTurma} onChange={(e) => setNomeNovaTurma(e.target.value)} style={{ padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }} required />
            <button type="submit" style={{ padding: '10px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Criar Turma</button>
          </form>
        </div>

        {/* CADASTRO DE ALUNOS */}
        <div style={{ flex: '1 1 300px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3 style={{ marginTop: 0 }}>👤 Novo Aluno</h3>
          <form onSubmit={handleCriarAluno} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Nome do Aluno" value={novoAlunoNome} onChange={(e) => setNovoAlunoNome(e.target.value)} style={{ padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }} required />
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="password" placeholder="Senha Numérica" value={novoAlunoSenha} onChange={(e) => setNovoAlunoSenha(e.target.value)} style={{ padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }} required />
              <select value={novoAlunoTurmaId} onChange={(e) => setNovoAlunoTurmaId(e.target.value)} style={{ padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }} aria-label="Selecione a turma">
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome_turma}</option>)}
              </select>
            </div>
            <button type="submit" style={{ padding: '10px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Cadastrar Aluno</button>
          </form>
        </div>
      </div>

      {/* SEÇÃO ANALÍTICA: RANKING E DIFICULDADES */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {/* RANKING INTERCLASSES */}
        <div style={{ flex: '1 1 400px', backgroundColor: '#fff', border: '2px solid #f1c40f', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#d35400' }}>🏆 Ranking Interclasses</h3>
          {rankingTurmas.length === 0 ? <span style={{ color: '#7f8c8d' }}>Nenhuma pontuação.</span> : (
            rankingTurmas.map((turma, index) => (
              <div key={turma.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: index === 0 ? '#fff9e6' : '#f8f9fa', borderBottom: '1px solid #eee', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                <span>{index + 1}º Lugar - {turma.nome_turma}</span>
                <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{turma.pontos_totais} pts</span>
              </div>
            ))
          )}
        </div>

        {/* RASTREADOR DE DIFICULDADES */}
        <div style={{ flex: '1 1 400px', backgroundColor: '#fff', border: '2px solid #e74c3c', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#c0392b' }}>🚨 Rastreador de Dificuldades</h3>
          <p style={{ fontSize: '13px', color: '#555', margin: '0 0 10px 0' }}>Fases com maior número de falhas por turma.</p>
          {dificuldades.length === 0 ? <span style={{ color: '#7f8c8d' }}>Nenhum erro registrado ainda.</span> : (
            dificuldades.map((dif, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#fdf2f0', borderBottom: '1px solid #f5b7b1', fontSize: '14px' }}>
                <span><strong>{dif.nome_turma}</strong> - Fase {dif.fase}</span>
                <span style={{ color: '#c0392b', fontWeight: 'bold' }}>{dif.quantidade_erros} erros</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* NOVO: TABELA DE TOP PROGRAMADORES COMPLETA */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0, color: '#f39c12', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🌟 Top Programadores (Ranking Individual)
        </h3>
        <p style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '15px' }}>Acompanhe o desempenho, as medalhas e a fase atual de todos os alunos cadastrados.</p>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '15px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', color: '#555' }}>
              <th style={{ padding: '12px' }}>Posição</th>
              <th style={{ padding: '12px' }}>Nome do Aluno</th>
              <th style={{ padding: '12px' }}>Turma</th>
              <th style={{ padding: '12px' }}>Pontos</th>
              <th style={{ padding: '12px' }}>Medalhas (Conquistas)</th>
              <th style={{ padding: '12px' }}>Fase Atual</th>
            </tr>
          </thead>
          <tbody>
            {alunosOrdenados.map((aluno, index) => (
              <tr key={aluno.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff' }}>
                <td style={{ padding: '12px' }}>
                  {index === 0 ? '🥇 1º' : index === 1 ? '🥈 2º' : index === 2 ? '🥉 3º' : `${index + 1}º`}
                </td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#2c3e50' }}>{aluno.nome}</td>
                <td style={{ padding: '12px', color: '#7f8c8d' }}>{obterNomeTurma(aluno.turma_id)}</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#27ae60' }}>{aluno.pontos_totais} pts</td>
                <td style={{ padding: '12px' }}>{renderizarMedalhas(aluno.pontos_totais)}</td>
                <td style={{ padding: '12px', color: '#34495e' }}>Fase {aluno.nivel_atual > 8 ? 8 : aluno.nivel_atual}</td>
              </tr>
            ))}
            {alunosOrdenados.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '15px', textAlign: 'center', color: '#7f8c8d' }}>Nenhum aluno registrado no sistema.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DashboardProfessor;