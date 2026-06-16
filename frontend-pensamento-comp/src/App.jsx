import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import EditorBlocos from './EditorBlocos';
import DashboardProfessor from './DashboardProfessor';

function App() {
  const [altoContraste, setAltoContraste] = useState(false);

  return (
    <BrowserRouter>
      <style>
        {`
          /* ACESSIBILIDADE DE TECLADO: Destaque visual forte ao usar o Tab */
          a:focus, button:focus, input:focus {
            outline: 3px solid #f39c12 !important;
            outline-offset: 3px !important;
          }

          /* MODO DE ALTO CONTRASTE */
          ${altoContraste ? `
            body, div, section, header, nav, table, th, td, p, h1, h2, h3, span, li, ul, input {
              background-color: #121212 !important;
              color: #ffff00 !important;
              border-color: #ffff00 !important;
            }
            button {
              background-color: #ffff00 !important;
              color: #000000 !important;
              border: 2px solid #ffff00 !important;
              font-weight: bold !important;
            }
            a {
              color: #00ffff !important;
            }
            .blocklyMainBackground { fill: #1e1e1e !important; }
            .blocklyToolboxDiv { background-color: #2d2d2d !important; }
            .blocklyText { fill: #000000 !important; }
          ` : ''}
        `}
      </style>

      <main style={{ minHeight: '100vh' }}>
        <header role="banner" style={{ backgroundColor: '#2c3e50', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '20px' }}>Pensamento Computacional</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <nav aria-label="Menu principal">
              <Link to="/" aria-label="Ir para a Área do Aluno" style={{ color: 'white', marginRight: '20px', textDecoration: 'none', fontWeight: 'bold' }}>Área do Aluno</Link>
              <Link to="/professor" aria-label="Ir para o Painel do Professor" style={{ color: '#f39c12', textDecoration: 'none', fontWeight: 'bold' }}>Painel do Professor</Link>
            </nav>

            <button 
              onClick={() => setAltoContraste(!altoContraste)}
              aria-pressed={altoContraste}
              aria-label={altoContraste ? "Desativar modo de alto contraste" : "Ativar modo de alto contraste para baixa visão"}
              style={{
                backgroundColor: '#ecf0f1',
                color: '#2c3e50',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {altoContraste ? '☀️ MODO NORMAL' : '🌗 ALTO CONTRASTE'}
            </button>
          </div>
        </header>

        <section role="main" style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 20px' }}>
          <Routes>
            <Route path="/" element={<EditorBlocos />} />
            <Route path="/professor" element={<DashboardProfessor />} />
          </Routes>
        </section>
      </main>
    </BrowserRouter>
  );
}

export default App;