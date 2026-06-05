import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import * as PtBr from 'blockly/msg/pt-br';
import { javascriptGenerator } from 'blockly/javascript';


Blockly.setLocale(PtBr);

function EditorBlocos() {
  const blocklyDiv = useRef(null);
  const workspace = useRef(null);

  useEffect(() => {
    
    if (!workspace.current) {
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
            <category name="Variáveis" colour="%{BKY_VARIABLES_HUE}" custom="VARIABLE"></category>
          </xml>
        `,
        
        trashcan: true,
        move: { scrollbars: true, drag: true, wheel: true },
        zoom: { controls: true, startScale: 1.2 } 
      });
    }
  }, []);

  
  const handleTestarCodigo = async () => {
    if (workspace.current) {
      const codigoGerado = javascriptGenerator.workspaceToCode(workspace.current);
      
      if (!codigoGerado) {
        alert("Sua área de trabalho está vazia! Arraste alguns blocos primeiro.");
        return;
      }

      try {
        
        const resposta = await fetch('http://127.0.0.1:8000/api/validar-codigo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ codigo: codigoGerado }) 
        });

   
        const dados = await resposta.json();
        
        
        alert(dados.mensagem);

      } catch (erro) {
        alert("Erro de conexão. O servidor Back-end Python está rodando?");
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Desafio 1: Lógica Básica</h2>
      
      {}
      <div 
        ref={blocklyDiv} 
        style={{ height: '500px', width: '100%', border: '2px solid #ccc', borderRadius: '8px' }}
        aria-label="Área interativa de programação por blocos. Use o mouse ou atalhos para arrastar."
        tabIndex="0"
      ></div>
      
      <button 
        style={{ marginTop: '15px', padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
        onClick={handleTestarCodigo}
      >
        Testar meu código
      </button>
    </div>
  );
}

export default EditorBlocos;