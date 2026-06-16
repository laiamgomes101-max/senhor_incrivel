// Página: AdminEmpresas
// Propósito: Listar e aprovar empresas cadastradas.
import { useState, useEffect } from 'react'
import api from '../api/client'

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/empresas').then(({ data }) => {
      setEmpresas(data.empresas || [])
    }).finally(() => setLoading(false))
  }, [])

  const aprovar = async (id) => {
    await api.post(`/admin/empresas/${id}/aprovar`)
    setEmpresas(empresas.filter(e => e.id !== id))
  }

  return (
    <div className="admin-empresas">
      <h1>Empresas</h1>
      {loading ? <p>Carregando...</p> : (
        <ul>
          {empresas.map(e => (
            <li key={e.id}>
              {e.nome} ({e.email})
              <button onClick={() => aprovar(e.id)}>Aprovar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
