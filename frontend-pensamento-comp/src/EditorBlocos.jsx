import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import * as ptBr from 'blockly/msg/pt-br';

Blockly.setLocale(ptBr);

// ESTRUTURA DOS NÍVEIS (BNCC)
const MISSOES = {
  1: {
    titulo: "Fase 1: Preparando a Expedição (Decomposição)",
    texto: "Antes de navegar por João Pessoa, precisamos dividir um problema maior em partes menores. Use um bloco de Matemática para calcular quantos coletes salva-vidas o barco precisa!"
  },
  2: {
    titulo: "Fase 2: Resgate em Tambaú (Abstração/Lógica)",
    texto: "Uma tartaruga está no caminho! O robô só deve virar o barco SE houver perigo. Use o bloco de lógica 'Se / Faça' para criar uma condição de segurança."
  },
  3: {
    titulo: "Fase 3: Limpeza da Orla (Padrões/Laços)",
    texto: "Encontramos muito plástico na água! Reconhecer padrões nos ajuda a não repetir código. Use um bloco de Repetição (Laços) para mandar o robô recolher o lixo várias vezes seguidas."
  },
  4: {
    titulo: "🏆 Parabéns! Missões Concluídas!",
    texto: "Você dominou os 4 pilares do Pensamento Computacional. Continue explorando os blocos livremente ou ajude seus colegas de turma!"
  }
};

function EditorBlocos() {
  const blocklyDiv = useRef(null);
  const workspace = useRef(null);

  const [alunoLogado, setAlunoLogado] = useState(null);
  const [nomeLogin, setNomeLogin] = useState('');
  const [codigoLogin, setCodigoLogin] = useState('');

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('alunoLogado');
    if (usuarioSalvo) setAlunoLogado(JSON.parse(usuarioSalvo));
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
                <value name="TIMES">
                  <shadow type="math_number">
                    <field name="NUM">10</field>
                  </shadow>
                </value>
              </block>
              <block type="controls_whileUntil"></block>
            </category>
          </xml>
        `,
      });
    }
  }, [alunoLogado]);

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
      const codigoGerado = javascriptGenerator.workspaceToCode(workspace.current);
      if (!codigoGerado) {
        alert("Área vazia! Arraste blocos para resolver a missão.");
        return;
      }
      try {
        const resposta = await fetch('http://127.0.0.1:8000/api/validar-codigo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: codigoGerado, aluno_id: alunoLogado.id }) 
        });
        const dados = await resposta.json();
        
        alert(dados.mensagem);

        // Se passou de fase, atualiza a tela instantaneamente!
        if (dados.status === 'sucesso' && dados.novo_nivel) {
          const alunoAtualizado = { ...alunoLogado, nivel_atual: dados.novo_nivel };
          setAlunoLogado(alunoAtualizado);
          localStorage.setItem('alunoLogado', JSON.stringify(alunoAtualizado));
          workspace.current.clear(); // Limpa os blocos para a nova fase
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
          <input type="text" placeholder="Seu Nome" value={nomeLogin} onChange={(e) => setNomeLogin(e.target.value)} style={{ padding: '12px', fontSize: '15px', borderRadius: '4px', border: '1px solid #ccc' }} required />
          <input type="password" placeholder="Código Numérico" value={codigoLogin} onChange={(e) => setCodigoLogin(e.target.value)} style={{ padding: '12px', fontSize: '15px', borderRadius: '4px', border: '1px solid #ccc' }} required />
          <button type="submit" style={{ padding: '12px', fontSize: '16px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Entrar</button>
        </form>
        <div style={{ marginTop: '25px', fontSize: '13px', color: '#7f8c8d', textAlign: 'left', backgroundColor: '#eee', padding: '10px', borderRadius: '4px' }}>
          <strong>Dados para Teste:</strong><br/>
          <em>6º Ano:</em> Ana (1111) ou Bruno (2222)
        </div>
      </div>
    );
  }

  // Determina qual missão mostrar na tela
  const nivelSeguro = alunoLogado.nivel_atual > 4 ? 4 : alunoLogado.nivel_atual;
  const missaoAtual = MISSOES[nivelSeguro];

  return (
    <div>
      {/* Banner da Missão Dinâmico */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e0f7fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #00bcd4' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', color: '#006064' }}>{missaoAtual.titulo}</h3>
          <p style={{ margin: 0, color: '#00838f', fontSize: '14px' }}>{missaoAtual.texto}</p>
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Sair</button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div ref={blocklyDiv} style={{ height: '400px', width: '100%', border: '1px solid #ccc', borderRadius: '8px' }} />
      </div>
      
      <button 
        style={{ marginTop: '15px', padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
        onClick={handleTestarCodigo}
        disabled={alunoLogado.nivel_atual > 3} // Desativa o botão se já zerou o jogo
      >
        {alunoLogado.nivel_atual > 3 ? "Jogo Concluído!" : "Testar meu código"}
      </button>
    </div>
  );
}

export default EditorBlocos;