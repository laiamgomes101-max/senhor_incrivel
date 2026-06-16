



const API_CONFIG = {
  FLASK: 'http://localhost:5000',
  NODE: 'http://localhost:3001'
};



const Auth = {
  setToken(token) {
    localStorage.setItem('auth_token', token);
  },

  getToken() {
    return localStorage.getItem('auth_token');
  },

  clearToken() {
    localStorage.removeItem('auth_token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  getUserData() {
    return JSON.parse(localStorage.getItem('user_data') || '{}');
  },

  setUserData(data) {
    localStorage.setItem('user_data', JSON.stringify(data));
  }
};



async function request(url, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Erro na requisição');
    }

    return data;
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
}



const AuthAPI = {
  async registrarCandidato(email, senha, nome) {
    return request(`${API_CONFIG.FLASK}/api/auth/register/candidato`, {
      method: 'POST',
      body: JSON.stringify({ email, password: senha, nome })
    });
  },

  async registrarEmpresa(email, senha, nome) {
    return request(`${API_CONFIG.FLASK}/api/auth/register/empresa`, {
      method: 'POST',
      body: JSON.stringify({ email, password: senha, nome })
    });
  },

  async login(email, senha) {
    return request(`${API_CONFIG.FLASK}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password: senha })
    });
  },

  logout() {
    Auth.clearToken();
    Auth.setUserData({});
  }
};



const FeedAPI = {
  async buscarFeed() {
    return request(`${API_CONFIG.NODE}/api/feed`);
  },

  async buscarPosts(page = 1, limit = 10) {
    return request(`${API_CONFIG.NODE}/api/feed/posts?page=${page}&limit=${limit}`);
  },

  async buscarVagas(page = 1, limit = 10) {
    return request(`${API_CONFIG.NODE}/api/feed/vagas?page=${page}&limit=${limit}`);
  },

  async criarPost(conteudo, userId, tipo = 'texto') {
    return request(`${API_CONFIG.NODE}/api/feed`, {
      method: 'POST',
      body: JSON.stringify({ conteudo, userId, tipo })
    });
  },

  async buscarTrending() {
    return request(`${API_CONFIG.NODE}/api/feed/trending`);
  }
};



const NotificacaoAPI = {
  async enviar(userId, titulo, mensagem, tipo = 'alerta') {
    return request(`${API_CONFIG.NODE}/api/notificacoes`, {
      method: 'POST',
      body: JSON.stringify({ userId, titulo, mensagem, tipo })
    });
  },

  async enviarEmMassa(userIds, titulo, mensagem, tipo = 'alerta') {
    return request(`${API_CONFIG.NODE}/api/notificacoes/massa`, {
      method: 'POST',
      body: JSON.stringify({ userIds, titulo, mensagem, tipo })
    });
  },

  async buscarNotificacoes(userId) {
    return request(`${API_CONFIG.NODE}/api/notificacoes/usuario/${userId}`);
  },

  async marcarComoLida(notificacaoId) {
    return request(`${API_CONFIG.NODE}/api/notificacoes/${notificacaoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ lida: true })
    });
  }
};



const ChatAPI = {
  async iniciarConversa(usuarioId1, usuarioId2) {
    return request(`${API_CONFIG.NODE}/api/chat`, {
      method: 'POST',
      body: JSON.stringify({ usuarioId1, usuarioId2 })
    });
  },

  async buscarConversa(roomId) {
    return request(`${API_CONFIG.NODE}/api/chat/${roomId}`);
  },

  async buscarMensagens(roomId, limite = 50, offset = 0) {
    return request(`${API_CONFIG.NODE}/api/chat/${roomId}/mensagens?limite=${limite}&offset=${offset}`);
  },

  async buscarConversasDoUsuario(userId) {
    return request(`${API_CONFIG.NODE}/api/chat/usuario/${userId}`);
  },

  async buscarStatusOnline() {
    return request(`${API_CONFIG.NODE}/api/chat/status/online`);
  }
};



const CandidatoAPI = {
  async buscarPerfil(candidatoId) {
    return request(`${API_CONFIG.FLASK}/api/candidatos/${candidatoId}`);
  },

  async atualizarPerfil(candidatoId, dados) {
    return request(`${API_CONFIG.FLASK}/api/candidatos/${candidatoId}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
  },

  async buscarCurriculosDoCandidato(candidatoId) {
    return request(`${API_CONFIG.FLASK}/api/candidatos/${candidatoId}/curriculos`);
  },

  async buscarCandidaturas(candidatoId) {
    return request(`${API_CONFIG.FLASK}/api/candidatos/${candidatoId}/candidaturas`);
  }
};



const EmpresaAPI = {
  async buscarPerfil(empresaId) {
    return request(`${API_CONFIG.FLASK}/api/empresas/${empresaId}`);
  },

  async atualizarPerfil(empresaId, dados) {
    return request(`${API_CONFIG.FLASK}/api/empresas/${empresaId}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
  },

  async buscarVagas(empresaId) {
    return request(`${API_CONFIG.FLASK}/api/empresas/${empresaId}/vagas`);
  },

  async criarVaga(empresaId, dados) {
    return request(`${API_CONFIG.FLASK}/api/vagas`, {
      method: 'POST',
      body: JSON.stringify({ ...dados, empresa_id: empresaId })
    });
  }
};



const VagaAPI = {
  async buscarVagas(page = 1, limit = 10) {
    return request(`${API_CONFIG.FLASK}/api/vagas?page=${page}&limit=${limit}`);
  },

  async buscarVaga(vagaId) {
    return request(`${API_CONFIG.FLASK}/api/vagas/${vagaId}`);
  },

  async candidatar(vagaId) {
    return request(`${API_CONFIG.FLASK}/api/vagas/candidaturas`, {
      method: 'POST',
      body: JSON.stringify({ vaga_id: vagaId })
    });
  },

  async atualizarVaga(vagaId, dados) {
    return request(`${API_CONFIG.FLASK}/api/vagas/${vagaId}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
  },

  async deletarVaga(vagaId) {
    return request(`${API_CONFIG.FLASK}/api/vagas/${vagaId}`, { method: 'DELETE' });
  }
};



let socket = null;

function initSocket(userId) {
  if (typeof io === 'undefined') {
    console.error('Socket.io não está carregado. Certifique-se de carregar: <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>');
    return;
  }

  socket = io(API_CONFIG.NODE);

  socket.on('connect', () => {
    console.log('✅ Conectado ao servidor WebSocket');
    socket.emit('autenticar', userId);
  });

  socket.on('disconnect', () => {
    console.log('❌ Desconectado do servidor');
  });

  return socket;
}

function getSocket() {
  return socket;
}



function mostrarNotificacao(titulo, mensagem, tipo = 'info') {

  const notif = document.createElement('div');
  notif.className = `notificacao notificacao-${tipo}`;
  notif.innerHTML = `
    <strong>${titulo}</strong>
    <p>${mensagem}</p>
    <button onclick="this.parentElement.remove()">×</button>
  `;

  document.body.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 5000);
}

function formatarData(data) {
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatarHora(data) {
  return new Date(data).toLocaleTimeString('pt-BR');
}

function truncarTexto(texto, limite = 150) {
  if (texto.length > limite) {
    return texto.substring(0, limite) + '...';
  }
  return texto;
}



function redirecionarSeNaoAutenticado() {
  if (!Auth.isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

function redirecionarSeAutenticado() {
  if (Auth.isAuthenticated()) {
    const user = Auth.getUserData();
    if (user && user.tipo === 'empresa') {
      window.location.href = 'feed-empresa.html';
    } else {

      window.location.href = 'feed-candidato.html';
    }
  }
}