// Página: ChatPage
// Propósito: Interface de chat em tempo real entre usuários.
import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import CurriculoAnalysisPanel from '../components/CurriculoAnalysisPanel';
import {
  fetchChatRooms,
  fetchChatMessages,
  sendChatMessage,
  markChatMessagesRead
} from '../api/chatApi';

const SOCKET_URL = import.meta.env.VITE_NODE_API_URL || window.location.origin;

export default function ChatPage() {
  const { candidato, empresa, loading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [candidaturaData, setCandidaturaData] = useState(null);

  const role = empresa ? 'empresa' : candidato ? 'candidato' : null;
  const userId = empresa?.id || candidato?.id;

  const socket = useMemo(
    () => io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket']
    }),
    []
  );

  useEffect(() => {
    if (!role || !userId) return;

    socket.connect();
    socket.emit('join:user', userId);

    socket.on('connect', () => {
      setStatusMessage('Conectado ao chat em tempo real');
    });

    socket.on('new_message', (message) => {
      if (String(message.chat_room_id) === String(activeRoom?.id)) {
        setMessages((prev) => [...prev, message]);
      }
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          String(room.id) === String(message.chat_room_id)
            ? { ...room, ultimaMensagem: message, unread_count: room.unread_count + 1 }
            : room
        )
      );
    });

    socket.on('messages_read', ({ roomId }) => {
      setRooms((prev) =>
        prev.map((room) =>
          String(room.id) === String(roomId) ? { ...room, unread_count: 0 } : room
        )
      );
    });

    return () => {
      socket.disconnect();
      socket.off();
    };
  }, [role, userId, socket, activeRoom]);

  useEffect(() => {
    if (!role || !userId) return;
    loadRooms();
  }, [role, userId]);

  const loadRooms = async () => {
    try {
      const response = await fetchChatRooms(userId, role);
      setRooms(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar salas de chat:', error);
      setStatusMessage('Falha ao carregar conversas.');
    }
  };

  const openRoom = async (room) => {
    setActiveRoom(room);
    setCandidaturaData(null);
    socket.emit('join_room', { roomId: room.id, userId });

    try {
      const response = await fetchChatMessages(room.id);
      setMessages(response.data.data.messages || []);
      await markChatMessagesRead(room.id, userId);
      setRooms((prev) =>
        prev.map((item) =>
          String(item.id) === String(room.id) ? { ...item, unread_count: 0 } : item
        )
      );

      // Se é uma sala de candidatura e é empresa, carrega dados do candidato
      if (room.room_type === 'candidatura' && role === 'empresa' && room.candidatura_id) {
        try {
          const candidaturaResponse = await fetch(
            `/api/curriculo-analysis/candidatura/${room.candidatura_id}/dados`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (candidaturaResponse.ok) {
            const candidaturaJson = await candidaturaResponse.json();
            setCandidaturaData(candidaturaJson.data);
          }
        } catch (err) {
          console.warn('Erro ao carregar dados da candidatura:', err);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!activeRoom || !draft.trim()) return;

    const recipientId = role === 'empresa' ? activeRoom.candidato_id : activeRoom.empresa_id;
    const payload = {
      senderId: userId,
      recipientId,
      content: draft.trim(),
      messageType: 'text'
    };

    try {
      const response = await sendChatMessage(activeRoom.id, payload);
      const message = response.data.data;
      setMessages((prev) => [...prev, message]);
      socket.emit('chat_message', { roomId: activeRoom.id, ...payload });
      setDraft('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setStatusMessage('Erro ao enviar mensagem.');
    }
  };

  if (loading) {
    return <div>Carregando chat...</div>;
  }

  if (!role) {
    return <div>É necessário estar autenticado como candidato ou empresa para usar o chat.</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '80vh' }}>
      <aside style={{ width: 320, borderRight: '1px solid #ddd', padding: '1rem' }}>
        <h2>Conversas</h2>
        {rooms.length === 0 ? (
          <p>Nenhuma conversa encontrada.</p>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => openRoom(room)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                border: activeRoom?.id === room.id ? '2px solid #007bff' : '1px solid #ccc',
                borderRadius: 8,
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <strong>{room.vaga_titulo || `Sala ${room.id}`}</strong>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                {room.ultimaMensagem?.content || 'Sem mensagens ainda'}
              </div>
              {room.unread_count > 0 && (
                <span style={{ color: '#007bff', fontWeight: 'bold' }}>{room.unread_count} não lidas</span>
              )}
            </button>
          ))
        )}
      </aside>

      <section style={{ flex: 1, padding: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2>Chat em tempo real</h2>
          <p>{statusMessage}</p>
        </div>

        {!activeRoom ? (
          <p>Selecione uma conversa para ver o histórico.</p>
        ) : (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Vaga:</strong> {activeRoom.vaga_titulo || 'Sem vaga vinculada'}
            </div>

            <div style={{
              border: '1px solid #ddd',
              padding: '1rem',
              minHeight: '400px',
              maxHeight: '70vh',
              overflowY: 'auto',
              marginBottom: '1rem',
              background: '#f9f9f9'
            }}>
              {messages.length === 0 ? (
                <p>Sem mensagens nesta sala.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      marginBottom: '0.75rem',
                      padding: '0.75rem',
                      background: message.sender_id === userId ? '#d1e7dd' : '#fff',
                      borderRadius: 8,
                      alignSelf: message.sender_id === userId ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#555' }}>
                      {message.sender_name || message.sender_id} • {new Date(message.created_at).toLocaleString()}
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>{message.content}</div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                placeholder="Escreva sua mensagem..."
                style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid #ccc' }}
              />
              <button
                onClick={handleSendMessage}
                style={{ padding: '0.75rem 1rem', borderRadius: 8, background: '#007bff', color: '#fff', border: 'none' }}
              >
                Enviar
              </button>
            </div>

            {/* Painel de Análise de Currículo - apenas para empresas */}
            {candidaturaData && role === 'empresa' && (
              <CurriculoAnalysisPanel
                candidaturaId={activeRoom.candidatura_id}
                candidatoNome={candidaturaData.candidato_nome}
                role={role}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}
