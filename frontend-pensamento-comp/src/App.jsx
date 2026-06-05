import EditorBlocos from './EditorBlocos';

function App() {
  return (
    <main>
      <header style={{ backgroundColor: '#2c3e50', color: 'white', padding: '15px', textAlign: 'center' }}>
        <h1>Plataforma de Pensamento Computacional</h1>
      </header>
      
      <section style={{ maxWidth: '900px', margin: '0 auto' }}>
        <EditorBlocos />
      </section>
    </main>
  );
}

export default App;