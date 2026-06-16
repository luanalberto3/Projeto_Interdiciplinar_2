import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import * as ptBr from 'blockly/msg/pt-br';

Blockly.setLocale(ptBr);

const MISSOES = {
  1: { titulo: "Fase 1: Preparando a Expedição", texto: "Para a nossa expedição começar, o robô precisa organizar os suprimentos. Sabendo que temos tripulantes e passageiros, construa a operação necessária para que o robô consiga calcular o total de coletes salva-vidas." },
  2: { titulo: "Fase 2: Rota Segura", texto: "Há recifes e tartarugas no mar de Tambaú! O robô deve estar preparado para agir, mas a mudança de rota só deve acontecer no momento em que ele detectar um perigo. Como ensinamos o robô a tomar essa decisão sozinho?" },
  3: { titulo: "Fase 3: Limpeza da Orla", texto: "Encontramos uma longa trilha de plásticos na areia. É cansativo dar a ordem de 'recolher' dezenas de vezes separadas. Identifique o padrão e use a estrutura correta para automatizar essa rotina!" },
  4: { titulo: "Fase 4: Correnteza no Farol do Cabo Branco", texto: "O mar está agitado perto do Farol. O robô precisa monitorar as ondas e disparar um alerta caso a velocidade da água alcance um nível acima do seguro. Utilize uma ferramenta que compare duas informações." },
  5: { titulo: "Fase 5: Feirinha de Artesanato", texto: "Ancoramos perto do Mercado de Artesanato de Tambaú! Ganhamos um baú de lembrancinhas que precisa ser distribuído igualmente entre todos da turma. Qual recurso matemático fraciona essas quantidades?" },
  6: { titulo: "Fase 6: Reflorestamento na Lagoa (Desafio Duplo)", texto: "Missão no Parque da Lagoa! O robô precisa caminhar automaticamente ao redor da lagoa e exibir na tela o cálculo de mudas." },
  7: { titulo: "Fase 7: Patrulha em Picãozinho (Desafio Duplo)", texto: "Mergulho nas piscinas naturais! O robô fará uma patrulha ininterrupta pelo fundo do mar. Mas atenção: ele só deve fotografar SE encontrar um coral doente." },
  8: { titulo: "Fase 8: Pane em Areia Vermelha (Desafio Mestre)", texto: "O tanque principal furou! Tome a decisão de ativar o motor de emergência 'Se' o nível ficar perigoso após perder combustível. Dica: Use um bloco de 'Comparação' para conectar a Matemática ao bloco 'Se', e o 'imprimir' para o motor." },
  9: { titulo: "🏆 Expedição Concluída!", texto: "Você é um mestre da Lógica! A expedição pela Paraíba foi um sucesso absoluto. Seu código salvou a natureza e ajudou a equipe. Você pode navegar pelos botões acima para revisar as fases anteriores." }
};

function EditorBlocos() {
  const blocklyDiv = useRef(null);
  const workspace = useRef(null);

  const [alunoLogado, setAlunoLogado] = useState(null);
  const [nomeLogin, setNomeLogin] = useState('');
  const [codigoLogin, setCodigoLogin] = useState('');
  const [faseSelecionada, setFaseSelecionada] = useState(1);
  
  const [rankingAlunos, setRankingAlunos] = useState([]);
  const [rankingTurmas, setRankingTurmas] = useState([]);

  const carregarRanking = async () => {
    try {
      const resAlunos = await fetch('http://127.0.0.1:8000/api/ranking-alunos');
      setRankingAlunos(await resAlunos.json());

      const resTurmas = await fetch('http://127.0.0.1:8000/api/ranking-turmas');
      setRankingTurmas(await resTurmas.json());
    } catch (erro) {
      console.error("Erro ao carregar rankings:", erro);
    }
  };

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('alunoLogado');
    if (usuarioSalvo) {
      const aluno = JSON.parse(usuarioSalvo);
      setAlunoLogado(aluno);
      setFaseSelecionada(aluno.nivel_atual > 8 ? 8 : aluno.nivel_atual);
      carregarRanking(); 
    }
  }, []);

  useEffect(() => {
    if (alunoLogado && blocklyDiv.current && !workspace.current) {
      workspace.current = Blockly.inject(blocklyDiv.current, {
        toolbox: `
          <xml>
            <category name="Lógica" colour="%{BKY_LOGIC_HUE}">
              <block type="controls_if"></block>
              <block type="logic_compare"></block>
            </category>
            <category name="Matemática" colour="%{BKY_MATH_HUE}">
              <block type="math_number"></block>
              <block type="math_arithmetic"></block>
            </category>
            <category name="Repetição" colour="%{BKY_LOOPS_HUE}">
              <block type="controls_repeat_ext">
                <value name="TIMES"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
              </block>
              <block type="controls_whileUntil"></block>
            </category>
            <category name="Texto" colour="%{BKY_TEXTS_HUE}">
              <block type="text_print"></block>
            </category>
          </xml>
        `,
      });
    }
  }, [alunoLogado]);

  useEffect(() => {
    if (workspace.current) {
      workspace.current.clear();
    }
  }, [faseSelecionada]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeLogin, codigo_acesso: codigoLogin })
      });
      const dados = await res.json();
      
      if (dados.status === 'sucesso') {
        setAlunoLogado(dados.aluno);
        localStorage.setItem('alunoLogado', JSON.stringify(dados.aluno));
        setFaseSelecionada(dados.aluno.nivel_atual > 8 ? 8 : dados.aluno.nivel_atual);
        carregarRanking(); 
      } else {
        alert(dados.mensagem);
      }
    } catch (erro) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  const handleLogout = () => {
    setAlunoLogado(null);
    localStorage.removeItem('alunoLogado');
    workspace.current = null;
  };

  const handleTestarCodigo = async () => {
    if (workspace.current) {
      const blocosPrincipais = workspace.current.getTopBlocks(false);
      
      if (blocosPrincipais.length > 1) {
        alert("🧩 Peças soltas detectadas! Você precisa conectar todos os blocos formando um único algoritmo antes de testar.");
        return; 
      }

      const codigoGerado = javascriptGenerator.workspaceToCode(workspace.current);
      if (!codigoGerado && blocosPrincipais.length === 0) {
        alert("Área vazia! Arraste blocos para resolver a missão.");
        return;
      }

      try {
        const resposta = await fetch('http://127.0.0.1:8000/api/validar-codigo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: codigoGerado, aluno_id: alunoLogado.id, fase_testada: faseSelecionada }) 
        });
        const dados = await resposta.json();
        
        alert(dados.mensagem);

        if (dados.status === 'sucesso' && dados.novo_nivel) {
          const alunoAtualizado = { ...alunoLogado, nivel_atual: dados.novo_nivel };
          setAlunoLogado(alunoAtualizado);
          localStorage.setItem('alunoLogado', JSON.stringify(alunoAtualizado));
          setFaseSelecionada(dados.novo_nivel > 8 ? 9 : dados.novo_nivel);
          carregarRanking(); 
        }
      } catch (erro) {
        alert("Erro de conexão com o servidor.");
      }
    }
  };

  if (!alunoLogado) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', maxWidth: '400px', margin: '40px auto', border: '1px solid #ccc' }}>
        <h2 style={{ color: '#2c3e50', marginTop: 0 }}>Acesso do Aluno</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          <input type="text" placeholder="Seu Nome" aria-label="Digite seu nome" value={nomeLogin} onChange={(e) => setNomeLogin(e.target.value)} style={{ padding: '12px', fontSize: '15px', borderRadius: '4px', border: '1px solid #ccc' }} required />
          <input type="password" placeholder="Código Numérico" aria-label="Digite seu código" value={codigoLogin} onChange={(e) => setCodigoLogin(e.target.value)} style={{ padding: '12px', fontSize: '15px', borderRadius: '4px', border: '1px solid #ccc' }} required />
          <button type="submit" style={{ padding: '12px', fontSize: '16px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Entrar</button>
        </form>
      </div>
    );
  }

  const missaoAtual = MISSOES[faseSelecionada];

  return (
    <div>
      {/* SELETOR DE FASES */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }} aria-label="Navegação de fases">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((numFase) => {
          const bloqueada = numFase > alunoLogado.nivel_atual;
          const selecionada = numFase === faseSelecionada;
          return (
            <button
              key={numFase}
              onClick={() => setFaseSelecionada(numFase)}
              disabled={bloqueada}
              aria-label={bloqueada ? `Fase ${numFase} bloqueada` : `Ir para Fase ${numFase}`}
              aria-pressed={selecionada}
              style={{
                padding: '8px 12px', border: 'none', borderRadius: '4px', fontWeight: 'bold',
                cursor: bloqueada ? 'not-allowed' : 'pointer',
                backgroundColor: selecionada ? '#00bcd4' : (bloqueada ? '#e0e0e0' : '#4CAF50'),
                color: selecionada || !bloqueada ? 'white' : '#9e9e9e',
                boxShadow: selecionada ? '0 0 0 3px #f39c12' : 'none'
              }}
            >
              Fase {numFase} {bloqueada ? '🔒' : (numFase < alunoLogado.nivel_atual ? '✅' : '▶️')}
            </button>
          );
        })}
      </div>

      {/* MISSÃO ATUAL */}
      <div aria-live="polite" role="region" aria-label="Missão atual" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e0f7fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #00bcd4' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', color: '#006064' }}>{missaoAtual.titulo}</h3>
          <p style={{ margin: 0, color: '#00838f', fontSize: '14px' }}>{missaoAtual.texto}</p>
        </div>
        <button onClick={handleLogout} aria-label="Sair da sua conta" style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Sair</button>
      </div>

      {/* TELA DE FINALIZAÇÃO DA FASE 9 */}
      <div style={{ display: faseSelecionada === 9 ? 'block' : 'none', padding: '40px', textAlign: 'center', backgroundColor: '#e8f5e9', border: '2px dashed #4CAF50', borderRadius: '8px' }}>
        <h2 style={{ color: '#2e7d32' }}>🎉 Jogo Finalizado!</h2>
        <p>Utilize os botões acima para selecionar e refazer qualquer fase que desejar.</p>
      </div>

      {/* ÁREA DE BLOCOS */}
      <div style={{ display: faseSelecionada === 9 ? 'none' : 'block' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div ref={blocklyDiv} role="application" aria-label="Área de trabalho de blocos" style={{ height: '400px', width: '100%', border: '1px solid #ccc', borderRadius: '8px' }} />
        </div>
        <button 
          style={{ marginTop: '15px', padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          onClick={handleTestarCodigo}
        >
          Testar meu código
        </button>
      </div>

      {/* SEÇÃO DE RANKINGS */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '40px' }}>
        
        {/* RANKING INTERCLASSES */}
        <div style={{ flex: '1 1 350px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#d35400', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏆 Ranking Interclasses (Geral)
          </h3>
          <p style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '15px' }}>Sua nota colabora para a pontuação da sua turma!</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '15px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', color: '#555' }}>
                <th style={{ padding: '10px' }}>Posição</th>
                <th style={{ padding: '10px' }}>Turma</th>
                <th style={{ padding: '10px' }}>Nota Total</th>
              </tr>
            </thead>
            <tbody>
              {rankingTurmas.map((turma, index) => (
                <tr 
                  key={turma.id} 
                  style={{ 
                    borderBottom: '1px solid #eee',
                    backgroundColor: alunoLogado && turma.id === alunoLogado.turma_id ? '#fff9e6' : 'transparent', 
                    fontWeight: alunoLogado && turma.id === alunoLogado.turma_id ? 'bold' : 'normal'
                  }}
                >
                  <td style={{ padding: '10px' }}>
                    {index === 0 ? '🥇 1º' : index === 1 ? '🥈 2º' : index === 2 ? '🥉 3º' : `${index + 1}º`}
                  </td>
                  <td style={{ padding: '10px', color: '#2c3e50' }}>
                    {turma.nome_turma} {alunoLogado && turma.id === alunoLogado.turma_id && "(Sua Turma)"}
                  </td>
                  <td style={{ padding: '10px', color: '#27ae60', fontWeight: 'bold' }}>{turma.pontos_totais} pts</td>
                </tr>
              ))}
              {rankingTurmas.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '10px', textAlign: 'center', color: '#7f8c8d' }}>Nenhum dado registrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* RANKING INDIVIDUAL */}
        <div style={{ flex: '1 1 450px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#f39c12', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🌟 Top Programadores (Individual)
          </h3>
          <p style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '15px' }}>Alunos com melhor desempenho em Lógica.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '15px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', color: '#555' }}>
                <th style={{ padding: '10px' }}>Posição</th>
                <th style={{ padding: '10px' }}>Aluno</th>
                <th style={{ padding: '10px' }}>Turma</th>
                <th style={{ padding: '10px' }}>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {rankingAlunos.map((aluno, index) => (
                <tr 
                  key={aluno.id} 
                  style={{ 
                    borderBottom: '1px solid #eee', 
                    backgroundColor: alunoLogado && aluno.id === alunoLogado.id ? '#e8f4f8' : 'transparent',
                    fontWeight: alunoLogado && aluno.id === alunoLogado.id ? 'bold' : 'normal'
                  }}
                >
                  <td style={{ padding: '10px' }}>
                    {index === 0 ? '🥇 1º' : index === 1 ? '🥈 2º' : index === 2 ? '🥉 3º' : `${index + 1}º`}
                  </td>
                  <td style={{ padding: '10px', color: '#2c3e50' }}>
                    {aluno.nome} {alunoLogado && aluno.id === alunoLogado.id && "(Você)"}
                  </td>
                  <td style={{ padding: '10px', color: '#7f8c8d' }}>{aluno.nome_turma}</td>
                  <td style={{ padding: '10px', color: '#27ae60', fontWeight: 'bold' }}>{aluno.pontos_totais} pts</td>
                </tr>
              ))}
              {rankingAlunos.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '10px', textAlign: 'center', color: '#7f8c8d' }}>Nenhum dado registrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default EditorBlocos;