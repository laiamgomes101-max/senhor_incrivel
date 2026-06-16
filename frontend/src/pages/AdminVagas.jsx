// Página: AdminVagas
// Propósito: Interface para administração de vagas.
import { useState, useEffect } from 'react'
import api from '../api/client'

export default function AdminVagas() {
  const [vagas, setVagas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/vagas').then(({ data }) => {
      setVagas(data.vagas || [])
    }).finally(() => setLoading(false))
  }, [])

  const remover = async (id) => {
    await api.delete(`/admin/vagas/${id}`)
    setVagas(vagas.filter(v => v.id !== id))
  }

  return (
    <div className="admin-vagas">
      <h1>Vagas</h1>
      {loading ? <p>Carregando...</p> : (
        <ul>
          {vagas.map(v => (
            <li key={v.id}>
              {v.titulo} — {v.descricao}
              <button onClick={() => remover(v.id)}>Apagar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
