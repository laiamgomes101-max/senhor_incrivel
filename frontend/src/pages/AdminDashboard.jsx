// Página: AdminDashboard
// Propósito: Navegação do painel do administrador.
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1>Painel do Administrador</h1>
      <ul>
        <li><Link to="/app/admin/usuarios">Gerenciar Usuários</Link></li>
        <li><Link to="/app/admin/empresas">Gerenciar Empresas</Link></li>
        <li><Link to="/app/admin/vagas">Gerenciar Vagas</Link></li>
        <li><Link to="/app/admin/stats">Estatísticas</Link></li>
      </ul>
    </div>
  )
}
