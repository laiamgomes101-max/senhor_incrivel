// Página: AdminUsuarios
// Propósito: Gerenciar usuários (bloquear, listar).
import { useState, useEffect } from 'react'
import api from '../api/client'

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = () => {
    setLoading(true)
    api.get('/admin/usuarios').then(({ data }) => {
      setUsuarios(data.usuarios || [])
    }).finally(() => setLoading(false))
  }

  const handleBlock = (id) => {
    api.post(`/admin/usuarios/${id}/bloquear`).then(() => {
      loadUsuarios()
    })
  }

  return (
    <div className="admin-usuarios">
      <h1>Usuários</h1>
      {loading ? <p>Carregando...</p> : (
        <table>
          <thead><tr><th>ID</th><th>Nome</th><th>Email</th><th>Tipo</th><th>Criado em</th><th>Ações</th></tr></thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.nome}</td>
                <td>{u.email}</td>
                <td>{u.tipo}</td>
                <td>{new Date(u.criado_em).toLocaleString()}</td>
                <td>
                  {u.tipo !== 'bloqueado' && (
                    <button onClick={() => handleBlock(u.id)}>Bloquear</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
