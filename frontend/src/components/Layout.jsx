import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../api/client'
import './Layout.css'

export default function Layout() {
  const { user, candidato, empresa, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const nome = candidato?.nome || empresa?.nome || user?.nome || user?.email?.split('@')[0] || 'Usuário'
  const avatarUrl = candidato?.foto_url || empresa?.logo_url || user?.foto_url || ''
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let mounted = true
    if (!user) return
    api.get('/notificacoes?nao_lidas=true').then(({ data }) => {
      if (!mounted) return
      const list = data.notificacoes || []
      setUnread(Array.isArray(list) ? list.length : 0)
    }).catch(() => {})
    return () => { mounted = false }
  }, [user])

  return (
    <div className="layout">
      <header className="header">
        <div className="brand-row">
          <NavLink to="/app" className="logo">
            <img src="/logo.svg" alt="Logo Currículos" className="app-logo" />
            <span className="logo-text">Currículos</span>
          </NavLink>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-label="Alternar menu"
            onClick={() => setMenuOpen(open => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <nav className={`nav ${menuOpen ? 'expanded' : 'collapsed'}`}>
          <NavLink to="/app" end>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {empresa ? 'Minhas Vagas' : 'Feed'}
          </NavLink>
          <NavLink to="/app/notificacoes">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Notificações{unread > 0 && <span className="notif-badge">{unread}</span>}
          </NavLink>
          {candidato && (
            <NavLink to="/app/candidato">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 21v-2a4 4 0 0 1 3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Meu Perfil
            </NavLink>
          )}
          {/* Aba de envio de CV removida - currículos agora preenchidos manualmente no perfil */}
          {candidato && (
            <NavLink to="/app/resultado-cv">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 3H7a2 2 0 0 0-2 2v14l4-3h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Resultado CV
            </NavLink>
          )}
          {empresa && (
            <>
              <NavLink to="/app/candidato">Candidatos</NavLink>
              <NavLink to="/app/empresa">Minha Empresa</NavLink>
            </>
          )}
          {user?.tipo === 'admin' && (
            <NavLink to="/app/admin">Admin</NavLink>
          )}
          {(candidato || empresa) && (
            <NavLink to="/app/ia">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Assistência
            </NavLink>
          )}
        </nav>
        <div className="user-menu">
          <button onClick={toggleTheme} className="btn-theme" title={`Mudar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`} aria-label={`Mudar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}>
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="theme-icon">
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24M13.54 13.54l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24M13.54 10.46l4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="theme-icon">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <div className="user-profile">
            {avatarUrl ? (
              <img src={avatarUrl} alt={nome ? `${nome} — avatar` : 'Avatar do usuário'} className="user-avatar" />
            ) : (
              <span className="user-avatar-placeholder">{nome?.[0]?.toUpperCase() || 'U'}</span>
            )}
            <span className="user-name">{nome}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">Sair</button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
