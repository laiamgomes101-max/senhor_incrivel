// Componente: CandidatoDashboard.jsx
// Propósito: Dashboard completo para candidatos com feed e notificações
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import FeedPublico from '../components/FeedPublico'
import NotificacoesFeed from '../components/NotificacoesFeed'
import './CandidatoDashboard.css'

export default function CandidatoDashboard() {
  const { user, candidato } = useAuth()
  const [activeTab, setActiveTab] = useState('feed')
  const [unreadCount, setUnreadCount] = useState(0)

  // Contar notificações não lidas periodicamente
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/notificacoes?nao_lidas=true', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setUnreadCount((data.notificacoes || []).length)
        }
      } catch (err) {
        console.error('Erro ao contar notificações:', err)
      }
    }, 30000) // Atualizar a cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="login-required">
          <h2>Faça login para acessar seu dashboard</h2>
          <p>Você precisa estar autenticado para usar essa funcionalidade</p>
        </div>
      </div>
    )
  }

  return (
    <div className="candidato-dashboard">
      <div className="dashboard-container">
        {/* Header com Abas */}
        <header className="dashboard-header">
          <div className="header-content">
            <div className="user-info">
              <img
                src={candidato?.foto_url || 'https://via.placeholder.com/50'}
                alt={candidato?.nome}
                className="user-avatar"
              />
              <div>
                <h1>Bem-vindo, {candidato?.nome}</h1>
                <p className="user-headline">{candidato?.headline || 'Candidato'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="dashboard-nav">
          <button
            className={`nav-button ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <span className="nav-icon">📰</span>
            <span>Feed</span>
          </button>

          <button
            className={`nav-button ${activeTab === 'notificacoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notificacoes')}
          >
            <span className="nav-icon">🔔</span>
            <span>Notificações</span>
            {unreadCount > 0 && (
              <span className="badge">{unreadCount}</span>
            )}
          </button>

          <button
            className={`nav-button ${activeTab === 'perfil' ? 'active' : ''}`}
            onClick={() => setActiveTab('perfil')}
          >
            <span className="nav-icon">👤</span>
            <span>Perfil</span>
          </button>
        </nav>

        {/* Main Content */}
        <main className="dashboard-content">
          {activeTab === 'feed' && (
            <section className="content-section">
              <FeedPublico />
            </section>
          )}

          {activeTab === 'notificacoes' && (
            <section className="content-section">
              <NotificacoesFeed />
            </section>
          )}

          {activeTab === 'perfil' && (
            <section className="content-section perfil-section">
              <div className="perfil-card">
                <h2>Meu Perfil</h2>

                <div className="perfil-info">
                  <div className="info-group">
                    <label>Nome</label>
                    <p>{candidato?.nome}</p>
                  </div>

                  <div className="info-group">
                    <label>Email</label>
                    <p>{user?.email}</p>
                  </div>

                  {candidato?.headline && (
                    <div className="info-group">
                      <label>Headline</label>
                      <p>{candidato.headline}</p>
                    </div>
                  )}

                  {candidato?.localizacao && (
                    <div className="info-group">
                      <label>Localização</label>
                      <p>{candidato.localizacao}</p>
                    </div>
                  )}

                  {candidato?.sobre && (
                    <div className="info-group">
                      <label>Sobre</label>
                      <p>{candidato.sobre}</p>
                    </div>
                  )}
                </div>

                <button className="edit-perfil-btn">
                  ✏️ Editar Perfil
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
