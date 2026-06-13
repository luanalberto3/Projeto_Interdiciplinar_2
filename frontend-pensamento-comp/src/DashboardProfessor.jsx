import React, { useState, useEffect } from 'react';

function DashboardProfessor() {
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [nomeNovaTurma, setNomeNovaTurma] = useState('');
  const [rankingTurmas, setRankingTurmas] = useState([]);
  
  const carregarDados = async () => {
    try {
      const resAlunos = await fetch('http://127.0.0.1:8000/api/alunos');
      const dadosAlunos = await resAlunos.json();
      setAlunos(dadosAlunos);

      // Busca o ranking
      const resRanking = await fetch('http://127.0.0.1:8000/api/ranking-turmas');
      const dadosRanking = await resRanking.json();
      setRankingTurmas(dadosRanking);     
    } catch (erro) {
      console.error("Erro ao carregar dados:", erro);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleCriarTurma = async (e) => {
    e.preventDefault();

    if (!nomeNovaTurma.trim()) {
      alert("Por favor, digite um nome para a turma.");
      return;
    }

    try {
      const resposta = await fetch('http://127.0.0.1:8000/api/turmas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_turma: nomeNovaTurma }),
      });

      const resultado = await resposta.json();
      alert(resultado.mensagem);

      setNomeNovaTurma('');
      carregarDados();
    } catch (erro) {
      alert("Erro ao conectar com o servidor para criar a turma.");
    }
  };

  // NOVA FUNÇÃO: Sistema de Gamificação (Badges)
  const renderizarMedalhas = (pontos) => {
    const medalhas = [];
    if (pontos >= 10) medalhas.push('🥉 Aprendiz de Lógica');
    if (pontos >= 30) medalhas.push('🥈 Desenvolvedor Júnior');
    if (pontos >= 50) medalhas.push('🥇 Mestre dos Blocos');
    if (pontos >= 100) medalhas.push('🏆 Lenda do Código');

    if (medalhas.length === 0) return <span style={{ color: '#7f8c8d', fontSize: '13px' }}>Sem conquistas</span>;

    return medalhas.map((m, index) => (
      <span key={index} style={{ 
        display: 'inline-block', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeeba', 
        padding: '4px 8px', 
        borderRadius: '12px', 
        fontSize: '12px', 
        marginRight: '5px', 
        marginBottom: '5px', 
        color: '#856404', 
        fontWeight: 'bold' 
      }}>
        {m}
      </span>
    ));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Painel do Professor</h2>
      <p>Gerencie suas turmas, acompanhe o progresso e acesse atividades pedagógicas.</p>

      {/* SEÇÃO: CRIAR E LISTAR TURMAS */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e9ecef' }}>
        <h3>Gerenciamento de Turmas</h3>
        <form onSubmit={handleCriarTurma} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Ex: 7º Ano B, 8º Ano C..."
            value={nomeNovaTurma}
            onChange={(e) => setNomeNovaTurma(e.target.value)}
            style={{ padding: '10px', fontSize: '15px', flex: '1', borderRadius: '4px', border: '1px solid #ccc' }}
            aria-label="Nome da nova turma"
          />
          <button
            type="submit"
            style={{ padding: '10px 20px', fontSize: '15px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Criar Turma
          </button>
        </form>
        <div>
          <strong>Turmas Ativas: </strong>
          {turmas.length === 0 ? (
            <span style={{ color: '#7f8c8d' }}>Nenhuma turma cadastrada.</span>
          ) : (
            turmas.map((t) => (
              <span key={t.id} style={{ display: 'inline-block', backgroundColor: '#e2e8f0', padding: '5px 12px', borderRadius: '20px', marginRight: '8px', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                📁 {t.nome_turma}
              </span>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Tabela de Alunos com Medalhas */}
        <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* NOVO: PODIUM DO RANKING COLABORATIVO */}
          <div style={{ backgroundColor: '#fff', border: '2px solid #f1c40f', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#d35400', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏆 Ranking Interclasses (Pontuação Global)
            </h3>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '15px' }}>
              Os pontos de todos os alunos são somados para a nota geral da turma. Estimule a colaboração!
            </p>
            
            {rankingTurmas.length === 0 ? (
              <span style={{ color: '#7f8c8d' }}>Nenhuma pontuação registrada.</span>
            ) : (
              rankingTurmas.map((turma, index) => (
                <div key={turma.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: index === 0 ? '#fff9e6' : '#f8f9fa', borderBottom: '1px solid #eee', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                  <span>
                    {index === 1 ? '🥇 ' : index === 2 ? '🥈 ' : index === 3 ? '🥉 ' : '🎖️ '}
                    {index + 1}º Lugar - {turma.nome_turma}
                  </span>
                  <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{turma.pontos_totais} pts</span>
                </div>
              ))
            )}
          </div>

          {/* Tabela de Alunos Existente */}
          <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>Progresso e Conquistas (Gamificação)</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '10px' }}>Nome do Aluno</th>
                  <th style={{ padding: '10px' }}>Pontos</th>
                  <th style={{ padding: '10px' }}>Medalhas (Badges)</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((aluno) => (
                  <tr key={aluno.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{aluno.nome}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#27ae60' }}>{aluno.pontos_totais}</td>
                    <td style={{ padding: '10px' }}>{renderizarMedalhas(aluno.pontos_totais)}</td>
                    <td style={{ padding: '10px' }}>{aluno.pontos_totais >= 30 ? '🔥 Avançado' : '🌱 Iniciante'}</td>
                  </tr>
                ))}
                {alunos.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '10px', textAlign: 'center', color: '#7f8c8d' }}>
                      Nenhum aluno registrou atividades ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Atividades Desplugadas */}
        <div style={{ flex: '1 1 250px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
          <h3>Atividades Desplugadas</h3>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li style={{ marginBottom: '10px' }}><strong>Dança dos Algoritmos:</strong> Crie uma coreografia em sala usando comandos de repetição (laços).</li>
            <li><strong>Sanduíche Lógico:</strong> Peça aos alunos que escrevam os passos exatos para fazer um sanduíche, treinando a decomposição de problemas.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DashboardProfessor;