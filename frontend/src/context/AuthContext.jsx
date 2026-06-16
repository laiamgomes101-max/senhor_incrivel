import { createContext, useContext, useState, useEffect } from 'react'
import flaskClient from '../api/flaskClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [candidato, setCandidato] = useState(null)
  const [empresa, setEmpresa] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(!!token) // inicia com true se houver token

  useEffect(() => {
    if (token) {
      setLoading(true)
      localStorage.setItem('token', token)
      flaskClient.get('/api/auth/me')
        .then(({ data }) => {
          const payload = data?.data || data
          const user = payload.user || payload
          setUser(user)
          if (user?.tipo === 'candidato') {
            setCandidato({
              id: user.id,
              nome: user.nome,
              email: user.email,
              foto_url: user.foto_url || user.foto || null
            })
            setEmpresa(null)
          } else if (user?.tipo === 'empresa') {
            setEmpresa({
              id: user.id,
              nome: user.nome,
              email: user.email,
              logo_url: user.logo_url || user.logo || null
            })
            setCandidato(null)
          } else {
            setCandidato(null)
            setEmpresa(null)
          }
          setLoading(false)
        })
        .catch((err) => {
          console.error('Erro ao recuperar usuário:', err)
          setToken(null)
          localStorage.removeItem('token')
          setLoading(false)
        })
    } else {
      setUser(null)
      setCandidato(null)
      setEmpresa(null)
      setLoading(false)
    }
  }, [token])

  const login = (data) => {
    const payload = data?.data || data
    const token = payload?.token
    const user = payload?.user || payload

    if (token) {
      localStorage.setItem('token', token)
    }
    setToken(token)
    setUser(user || null)
    if (user?.tipo === 'candidato') {
      setCandidato({
        id: user.id,
        nome: user.nome,
        email: user.email,
        foto_url: user.foto_url || user.foto || null
      })
      setEmpresa(null)
    } else if (user?.tipo === 'empresa') {
      setEmpresa({
        id: user.id,
        nome: user.nome,
        email: user.email,
        logo_url: user.logo_url || user.logo || null
      })
      setCandidato(null)
    } else {
      setCandidato(null)
      setEmpresa(null)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setCandidato(null)
    setEmpresa(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, candidato, setCandidato, empresa, setEmpresa, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
