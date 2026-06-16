import React, { useState, useEffect } from 'react';

function DashboardProfessor() {
  const [professorLogado, setProfessorLogado] = useState(null);
  const [loginNome, setLoginNome] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [rankingTurmas, setRankingTurmas] = useState([]);
  
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

  const [dificuldades, setDificuldades] = useState([]);

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

      //Busca os erros
      const resDificuldades = await fetch('http://127.0.0.1:8000/api/dificuldades');
      setDificuldades(await resDificuldades.json());

    } catch (erro) {
      console.error("Erro ao carregar dados:", erro);
    }
  };

  // FUNÇÕES DE LOGIN
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

  // FUNÇÕES DE CADASTRO
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

  // Gamificação visual
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

  // TELA DE LOGIN DO PROFESSOR
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
          <strong>Conta Padrão (Teste):</strong><br/>
          Nome: <em>Admin</em><br/>
          Senha: <em>admin123</em>
        </div>
      </div>
    );
  }

  // TELA DO PAINEL DO PROFESSOR
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Painel do Professor - Bem-vindo, {professorLogado.nome}!</h2>
          <p>Gerencie suas turmas, adicione alunos e acompanhe o progresso geral.</p>
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Sair da Conta</button>
      </div>

      {/* CADASTRO DE TURMAS */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
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

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* RANKING INTERCLASSES */}
          <div style={{ backgroundColor: '#fff', border: '2px solid #f1c40f', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
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

          {/* TABELA DE ALUNOS */}
          <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>Progresso Geral da Turma</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '10px' }}>Nome</th>
                  <th style={{ padding: '10px' }}>Pontos</th>
                  <th style={{ padding: '10px' }}>Medalhas</th>
                  <th style={{ padding: '10px' }}>Fase</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((aluno) => (
                  <tr key={aluno.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{aluno.nome}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#27ae60' }}>{aluno.pontos_totais}</td>
                    <td style={{ padding: '10px' }}>{renderizarMedalhas(aluno.pontos_totais)}</td>
                    <td style={{ padding: '10px' }}>Fase {aluno.nivel_atual > 8 ? 8 : aluno.nivel_atual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardProfessor;