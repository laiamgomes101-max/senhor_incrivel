// Página: Register
// Propósito: Tela para criar nova conta (candidato/empresa).
import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import flaskClient from '../api/flaskClient'
// ThemeToggle removed — theme is static now
import './Login.css'
import '../styles/themes.css'

const validatePassword = (pwd) => {
  const requirements = {
    length: pwd.length >= 8,
    hasNumbers: /\d/.test(pwd),
    hasLetters: /[a-zA-Z]/.test(pwd)
  }
  
  const strength = Object.values(requirements).filter(Boolean).length
  
  return {
    requirements,
    strength: Math.min(strength, 3),
    isValid: requirements.length && requirements.hasNumbers && requirements.hasLetters
  }
}

export default function Register() {
  const [tipo, setTipo] = useState('candidato')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const passwordValidation = password ? validatePassword(password) : null
  // show/hide password with auto-hide
  const [showPwd, setShowPwd] = useState(false)
  const hideRef = useRef(null)

  useEffect(() => {
    return () => {
      if (hideRef.current) clearTimeout(hideRef.current)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      if (!passwordValidation.isValid) {
        setErro('Senha deve ter 8+ caracteres com números e letras')
        setLoading(false)
        return
      }
      
      const endpoint = tipo === 'candidato'
        ? '/api/auth/register/candidato'
        : '/api/auth/register/empresa'
      const payload = { email, password, nome: nome || undefined }
      const { data } = await flaskClient.post(endpoint, payload)
      const responsePayload = data?.data || data
      login(responsePayload)
      navigate('/app')
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao processar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      

      <svg className="background-pattern" viewBox="0 0 1200 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.5)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
          </linearGradient>
        </defs>
        
        <circle cx="100" cy="100" r="40" fill="rgba(99, 102, 241, 0.3)" />
        <circle cx="1100" cy="150" r="50" fill="rgba(59, 130, 246, 0.25)" />
        <circle cx="600" cy="700" r="60" fill="rgba(139, 92, 246, 0.2)" />
        <circle cx="200" cy="600" r="35" fill="rgba(99, 102, 241, 0.25)" />
        <circle cx="1000" cy="450" r="45" fill="rgba(59, 130, 246, 0.2)" />
        
        <line x1="100" y1="100" x2="600" y2="700" stroke="rgba(99, 102, 241, 0.1)" strokeWidth="1" />
        <line x1="1100" y1="150" x2="600" y2="700" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
        <line x1="200" y1="600" x2="1000" y2="450" stroke="rgba(139, 92, 246, 0.08)" strokeWidth="1" />
        <line x1="100" y1="100" x2="1100" y2="150" stroke="rgba(99, 102, 241, 0.08)" strokeWidth="1" />
      </svg>

      <div className="login-card">
        <h1>Criar Conta</h1>
        <p className="subtitle">Junte-se à plataforma de currículos</p>

        <div className="tipo-tabs">
          <button
            className={tipo === 'candidato' ? 'active' : ''}
            onClick={() => setTipo('candidato')}
          >
            Candidato
          </button>
          <button
            className={tipo === 'empresa' ? 'active' : ''}
            onClick={() => setTipo('empresa')}
          >
            Empresa
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-panel register-form-panel">
          <input
            type="text"
            placeholder={tipo === 'candidato' ? 'Seu nome' : 'Nome da empresa'}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="pwd-row">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="show-pwd-btn"
              aria-pressed={showPwd}
              onClick={() => {
                if (showPwd) {
                  setShowPwd(false)
                  if (hideRef.current) clearTimeout(hideRef.current)
                } else {
                  setShowPwd(true)
                  if (hideRef.current) clearTimeout(hideRef.current)
                  hideRef.current = setTimeout(() => setShowPwd(false), 5000)
                }
              }}
            >{showPwd ? 'Ocultar' : 'Mostrar'}</button>
          </div>
          
          {password && passwordValidation && !passwordValidation.isValid && (
            <div className="requirements">
              <div className={`req ${passwordValidation.requirements.length ? 'ok' : ''}`}>
                <span className="icon">{passwordValidation.requirements.length ? '✓' : '○'}</span>
                8 ou mais caracteres
              </div>
              <div className={`req ${passwordValidation.requirements.hasNumbers ? 'ok' : ''}`}>
                <span className="icon">{passwordValidation.requirements.hasNumbers ? '✓' : '○'}</span>
                Números (0-9)
              </div>
              <div className={`req ${passwordValidation.requirements.hasLetters ? 'ok' : ''}`}>
                <span className="icon">{passwordValidation.requirements.hasLetters ? '✓' : '○'}</span>
                Letras (A-Z, a-z)
              </div>
            </div>
          )}
          
          {erro && <p className="erro">{erro}</p>}
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !passwordValidation?.isValid}
          >
            {loading ? 'Processando...' : 'Cadastrar'}
          </button>
        </form>

        <p className="subtitle" style={{ marginTop: '1rem' }}>
          Já tem conta? <Link to="/login" style={{ color: 'rgba(99, 102, 241, 1)' }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
