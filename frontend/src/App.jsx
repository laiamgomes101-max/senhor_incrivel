import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import Demo from './pages/Demo'
import Feed from './pages/Feed'
import FeedEmpresa from './pages/FeedEmpresa'
import Candidato from './pages/Candidato'
import Empresa from './pages/Empresa'
import ChatIA from './pages/ChatIA'
import ChatPage from './pages/ChatPage'
import Notifications from './pages/Notifications'
import ResultadoCV from './pages/ResultadoCV'
import Settings from './pages/Settings'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsuarios from './pages/AdminUsuarios'
import AdminEmpresas from './pages/AdminEmpresas'
import AdminVagas from './pages/AdminVagas'
import AdminStats from './pages/AdminStats'

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</div>
  }
  
  if (!token) return <Navigate to="/" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</div>
  }

  if (!user || user.tipo !== 'admin') {
    return <Navigate to="/app" replace />
  }

  return children
}

function FeedWrapper() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</div>
  }
  
  return user?.tipo === 'empresa' ? <FeedEmpresa /> : <Feed />
}

function IARoute({ children }) {
  const { candidato, empresa, loading } = useAuth()

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</div>
  }

  if (!candidato && !empresa) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/demo" element={<Demo />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FeedWrapper />} />
        <Route path="candidato/:id?" element={<Candidato />} />
        <Route path="empresa/:id?" element={<Empresa />} />
        <Route path="notificacoes" element={<Notifications />} />
        <Route
          path="ia"
          element={
            <IARoute>
              <ChatIA />
            </IARoute>
          }
        />
        <Route path="chat" element={<ChatPage />} />
        {/* Rota de upload de CV removida - currículos preenchidos manualmente no perfil */}
        <Route path="resultado-cv" element={<ResultadoCV />} />
        <Route path="settings" element={<Settings />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="admin/usuarios"
          element={
            <AdminRoute>
              <AdminUsuarios />
            </AdminRoute>
          }
        />
        <Route
          path="admin/empresas"
          element={
            <AdminRoute>
              <AdminEmpresas />
            </AdminRoute>
          }
        />
        <Route
          path="admin/vagas"
          element={
            <AdminRoute>
              <AdminVagas />
            </AdminRoute>
          }
        />
        <Route
          path="admin/stats"
          element={
            <AdminRoute>
              <AdminStats />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
