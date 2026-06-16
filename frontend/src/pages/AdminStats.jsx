// Página: AdminStats
// Propósito: Exibir estatísticas do sistema.
import { useState, useEffect } from 'react'
import api from '../api/client'

export default function AdminStats() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data))
  }, [])

  if (!stats) return <p>Carregando...</p>
  return (
    <div className="admin-stats">
      <h1>Estatísticas</h1>
      <ul>
        <li>Total usuários: {stats.totalUsuarios}</li>
        <li>Total empresas: {stats.totalEmpresas}</li>
        <li>Total vagas: {stats.totalVagas}</li>
      </ul>
    </div>
  )
}
