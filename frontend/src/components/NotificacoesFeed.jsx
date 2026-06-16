// Componente: NotificacoesFeed
// Propósito: Mostrar notificações de curtidas, comentários e respostas
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import flaskClient from '../api/flaskClient'
import './NotificacoesFeed.css'

export default function NotificacoesFeed() {
  const { user } = useAuth()
  const [notificacoes, setNotificacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todas')

  useEffect(() => {
    if (user) {
      carregarNotificacoes()
      // Recarregar a cada 30 segundos
      const interval = setInterval(carregarNotificacoes, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const carregarNotificacoes = async () => {
    try {
      const res = await flaskClient.get('/api/notificacoes/')
      let notifs = res.data.notificacoes || []

      // Filtrar por tipo
      if (filtro !== 'todas') {
        notifs = notifs.filter(n => n.tipo === filtro)
      }

      setNotificacoes(notifs)
    } catch (err) {
      console.error('Erro ao carregar notificações:', err)
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLida = async (notifId) => {
    try {
      await flaskClient.put(`/api/notificacoes/${notifId}/ler`)
      setNotificacoes(notificacoes.map(n =>
        n.id === notifId ? { ...n, lida: true } : n
      ))
    } catch (err) {
      console.error('Erro ao marcar como lida:', err)
    }
  }

  const getIconoNotificacao = (tipo) => {
    switch (tipo) {
      case 'curtida':
        return '❤️'
      case 'comentario':
        return '💬'
      case 'resposta':
        return '↩️'
      case 'vaga':
        return '💼'
      default:
        return '📢'
    }
  }

  const getTituloFiltro = () => {
    switch (filtro) {
      case 'curtida':
        return 'Curtidas'
      case 'comentario':
        return 'Comentários'
      case 'resposta':
        return 'Respostas'
      case 'vaga':
        return 'Vagas'
      default:
        return 'Todas as notificações'
    }
  }

  return (
    <div className="notificacoes-feed">
      <div className="notificacoes-header">
        <h2>🔔 Notificações</h2>
        <button
          className="refresh-btn"
          onClick={carregarNotificacoes}
          disabled={loading}
        >
          ↻ Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros">
        <button
          className={filtro === 'todas' ? 'filtro-btn active' : 'filtro-btn'}
          onClick={() => setFiltro('todas')}
        >
          Todas
        </button>
        <button
          className={filtro === 'curtida' ? 'filtro-btn active' : 'filtro-btn'}
          onClick={() => setFiltro('curtida')}
        >
          ❤️ Curtidas
        </button>
        <button
          className={filtro === 'comentario' ? 'filtro-btn active' : 'filtro-btn'}
          onClick={() => setFiltro('comentario')}
        >
          💬 Comentários
        </button>
        <button
          className={filtro === 'resposta' ? 'filtro-btn active' : 'filtro-btn'}
          onClick={() => setFiltro('resposta')}
        >
          ↩️ Respostas
        </button>
      </div>

      {/* Lista de Notificações */}
      <div className="notificacoes-list">
        {loading ? (
          <div className="loading">⏳ Carregando notificações...</div>
        ) : notificacoes.length === 0 ? (
          <div className="empty-state">
            <p>📭 Você não tem notificações</p>
            <small>Fique ligado para curtidas, comentários e respostas</small>
          </div>
        ) : (
          notificacoes.map((notif) => (
            <div
              key={notif.id}
              className={`notificacao-item ${notif.lida ? 'lida' : 'nao-lida'}`}
              onClick={() => !notif.lida && marcarComoLida(notif.id)}
            >
              <span className="notif-icone">
                {getIconoNotificacao(notif.tipo)}
              </span>

              <div className="notif-conteudo">
                <h4>{notif.titulo}</h4>
                <p>{notif.mensagem}</p>
                <small>
                  {new Date(notif.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </small>
              </div>

              <div className="notif-acoes">
                {notif.link && (
                  <a href={notif.link} className="notif-link">
                    Ver →
                  </a>
                )}
                {!notif.lida && (
                  <button
                    className="marcar-lida-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      marcarComoLida(notif.id)
                    }}
                    title="Marcar como lida"
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
