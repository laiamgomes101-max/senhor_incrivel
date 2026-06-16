// Importa componentes e estilos usados na página inicial
import { Link } from 'react-router-dom'
import '../styles/themes.css'
import '../styles/HomePage.css'
import AutoCard from '../components/AutoCard'

// Componente da página inicial da aplicação
export default function HomePage() {
  return (
    <div className="landing-page">
      <div className="landing-glow landing-glow-large" />
      <div className="landing-glow landing-glow-purple" />
      <div className="landing-glow landing-glow-pink" />
      <div className="landing-dot landing-dot-top" />
      <div className="landing-dot landing-dot-bottom" />
      {/* Navegação superior com card de destaque no canto esquerdo e botões no canto direito */}
      <nav className="landing-nav landing-nav-no-brand">
        <div className="landing-card-top-left">
          <AutoCard
            items={[
              { title: 'Análise rápida', text: 'Gere um feedback do seu currículo em segundos.' },
              { title: 'Extração automática', text: 'Dados do currículo extraídos automaticamente.' },
              { title: 'Sugestões práticas', text: 'Receba dicas para melhorar seu perfil.' }
            ]}
            interval={3000}
          />
        </div>

        <div className="landing-actions">
          <Link to="/login?onlyLogin=1" className="landing-link">
            Entrar
          </Link>
          <Link to="/register" className="landing-button">
            Cadastrar
          </Link>
        </div>
      </nav>

      <main className="landing-main landing-main-compact">
        <div className="landing-copy">
          <p className="landing-eyebrow">Avaliação de currículos com inteligência</p>
          <h1 className="landing-title">
            <span>Avalie seu currículo</span>
            <span className="landing-title-highlight">com inteligência.</span>
          </h1>

          <p className="landing-subtitle">
            A maneira mais rápida de entender se o seu perfil está pronto para o mercado de engenharia.
          </p>
          <p className="landing-description">
            Analise seus currículos em segundos, identifique pontos de melhoria e destaque-se no mercado de trabalho.
          </p>

          <div className="landing-cta">
            <Link to="/register" className="btn btn-primary">
              Criar conta gratuita
            </Link>
            <Link to="/demo" className="btn btn-secondary">
              Ver demonstração
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
