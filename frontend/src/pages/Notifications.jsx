// Página: Notifications
// Propósito: Listar notificações do usuário.
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import flaskClient from '../api/flaskClient'
import './Notifications.css'

export default function Notifications() {
  const { user } = useAuth()
  const [notificacoes, setNotificacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todas')

  useEffect(() => {
    if (!user) return

    const loadNotifications = async () => {
      setLoading(true)
      setError(null)
      try {
        const endpoint = filtro === 'nao_lidas' ? '/api/notificacoes?nao_lidas=true' : '/api/notificacoes'
        const { data } = await flaskClient.get(endpoint)
        setNotificacoes(data.notificacoes || [])
      } catch (err) {
        setError('Não foi possível carregar as notificações.')
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [user, filtro])

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1>Notificações</h1>
      </div>
      <div className="notifications-tabs">
        <button
          className={filtro === 'todas' ? 'active' : ''}
          onClick={() => setFiltro('todas')}
          type="button"
        >
          Todas
        </button>
        <button
          className={filtro === 'nao_lidas' ? 'active' : ''}
          onClick={() => setFiltro('nao_lidas')}
          type="button"
        >
          Não lidas
        </button>
      </div>
      {loading ? (
        <p>Carregando notificações...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : notificacoes.length === 0 ? (
        <p>Não há notificações para este filtro.</p>
      ) : (
        <div className="notifications-list">
          {notificacoes.map((notif, index) => (
            <article key={notif.id || index} className="notification-card">
              <div className="notification-header">
                <strong>{notif.titulo || 'Nova notificação'}</strong>
                <span>{notif.created_at ? new Date(notif.created_at).toLocaleString('pt-BR') : ''}</span>
              </div>
              <p>{notif.mensagem || notif.message || notif.texto || 'Detalhes não disponíveis.'}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
