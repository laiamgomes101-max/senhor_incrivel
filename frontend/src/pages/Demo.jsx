// Página: Demo
// Propósito: Página de demonstração da plataforma.
import { Link } from 'react-router-dom'
import './Demo.css'

export default function Demo() {
  return (
    <div className="demo-page">
      <nav className="demo-nav">
        <Link to="/" className="demo-brand">
          Plataforma
        </Link>
        <div className="demo-nav-actions">
          <Link to="/login" className="demo-nav-link">
            Entrar
          </Link>
          <Link to="/register" className="demo-button">
            Cadastrar
          </Link>
        </div>
      </nav>

      <main className="demo-content">
        <header className="demo-header">
          <h1>Demonstração da Plataforma</h1>
          <p className="demo-intro">
            Veja como nossos recursos ajudam candidatos e empresas a avaliar currículos e conectar-se às oportunidades certas.
          </p>
        </header>

        <section className="demo-grid">
          <article className="demo-card">
            <h2>Para Candidatos</h2>
            <ul className="demo-list">
              <li>Upload do currículo em PDF</li>
              <li>Sugestões de melhoria</li>
              <li>Gerar resumo sobre seu Curriculo</li>
              <li>Carta de apresentação</li>
            </ul>
          </article>

          <article className="demo-card">
            <h2>Para Empresas</h2>
            <ul className="demo-list">
              <li>Publicação de vagas</li>
              <li>Analise por competências, experiência e habilidade</li>
              <li>Gerar Resumo</li>
               <li>Comparar Curriculos</li>
            </ul>
          </article>
        </section>

        <section className="demo-steps">
          <h2>Como Funciona</h2>
          <div className="demo-step-grid">
            <div className="demo-step">
              <div className="demo-step-number">1</div>
              <h3>Cadastre-se</h3>
              <p>Crie sua conta em minutos e acesse a ferramenta.</p>
            </div>
            <div className="demo-step">
              <div className="demo-step-number">2</div>
              <h3>Configure seu perfil</h3>
              <p>Adicione suas informações e envie o currículo.</p>
            </div>
            <div className="demo-step">
              <div className="demo-step-number">3</div>
              <h3>Use a plataforma</h3>
              <p>Receba análises e conecte-se a oportunidades de forma rápida.</p>
            </div>
          </div>
        </section>

        <div className="demo-register-cta">
          <Link to="/register" className="demo-register-link">
            Criar conta gratuita
          </Link>
        </div>
      </main>
    </div>
  )
}
