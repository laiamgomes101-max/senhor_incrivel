






async function loginCustomizado(email, senha) {
  try {

    mostrarNotificacao('Conectando', 'Fazendo login...', 'info');


    const response = await AuthAPI.login(email, senha);


    if (response.token) {
      Auth.setToken(response.token);
      Auth.setUserData({
        id: response.user.id,
        email: response.user.email,
        tipo: response.user.tipo
      });


      initSocket(response.user.id);


      mostrarNotificacao('Sucesso', 'Login realizado!', 'success');
      setTimeout(() => window.location.href = 'feed.html', 1500);
    }
  } catch (erro) {
    mostrarNotificacao('Erro', erro.message, 'error');
  }
}






async function carregarFeedCustomizado() {
  try {
    const response = await FeedAPI.buscarFeed();
    const posts = response.data.posts || [];

    let html = '<div class="posts-container">';

    posts.forEach(post => {
      html += `
        <div class="post-card">
          <div class="post-header">
            <strong>${post.autor}</strong>
            <small>${formatarData(post.data_criacao)}</small>
          </div>
          <p>${post.conteudo}</p>
          <div class="post-stats">
            <span>👍 ${post.likes}</span>
            <span>💬 ${post.comentarios}</span>
          </div>
        </div>
      `;
    });

    html += '</div>';
    document.getElementById('feedContainer').innerHTML = html;
  } catch (erro) {
    console.error('Erro ao carregar feed:', erro);
  }
}







async function criarPostCustomizado(conteudo) {
  try {
    const userData = Auth.getUserData();

    const response = await FeedAPI.criarPost(
      conteudo,
      userData.id,
      'texto'
    );

    if (response.status === 'success') {
      mostrarNotificacao('Sucesso', 'Post criado com sucesso!', 'success');


      const socket = getSocket();
      if (socket) {
        socket.emit('novo_post', response.data);
      }


      carregarFeedCustomizado();
    }
  } catch (erro) {
    mostrarNotificacao('Erro', 'Erro ao criar post: ' + erro.message, 'error');
  }
}






const perfilCache = new Map();

async function buscarPerfilComCache(candidatoId) {

  if (perfilCache.has(candidatoId)) {
    return perfilCache.get(candidatoId);
  }

  try {
    const response = await CandidatoAPI.buscarPerfil(candidatoId);
    const perfil = response.data;


    perfilCache.set(candidatoId, perfil);


    setTimeout(() => {
      perfilCache.delete(candidatoId);
    }, 5 * 60 * 1000);

    return perfil;
  } catch (erro) {
    console.error('Erro ao buscar perfil:', erro);
    throw erro;
  }
}







function configurarNotificacoesEmTempoReal(userId) {
  const socket = getSocket();

  if (!socket) {
    console.error('Socket.io não inicializado');
    return;
  }


  socket.emit('autenticar', userId);


  socket.on('notificacao_recebida', (notif) => {
    console.log('Notificação recebida:', notif);


    mostrarNotificacao(notif.titulo, notif.mensagem, 'info');


    reproduzirSomNotificacao();


    atualizarBadgeNotificacoes();
  });


  socket.on('feed_atualizado', (post) => {
    console.log('Novo post no feed:', post);
    mostrarNotificacao('Novo Post', 'Novo post no feed!', 'info');
  });
}

function reproduzirSomNotificacao() {

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 1000;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function atualizarBadgeNotificacoes() {
  const badge = document.querySelector('[data-notifications-badge]');
  if (badge) {
    const count = parseInt(badge.textContent) || 0;
    badge.textContent = count + 1;
    badge.style.display = count + 1 > 0 ? 'block' : 'none';
  }
}







async function buscarVagasComFiltro(filtros = {}) {
  try {
    const response = await FeedAPI.buscarVagas(
      filtros.page || 1,
      filtros.limit || 10
    );

    let vagas = response.data.vagas || [];


    if (filtros.titulo) {
      vagas = vagas.filter(v =>
        v.titulo.toLowerCase().includes(filtros.titulo.toLowerCase())
      );
    }


    if (filtros.localizacao) {
      vagas = vagas.filter(v =>
        v.localizacao.toLowerCase().includes(filtros.localizacao.toLowerCase())
      );
    }


    if (filtros.salarioMin) {
      vagas = vagas.filter(v => v.salario >= filtros.salarioMin);
    }


    if (filtros.ordenar === 'recente') {
      vagas.sort((a, b) => new Date(b.data) - new Date(a.data));
    }
    if (filtros.ordenar === 'salario') {
      vagas.sort((a, b) => b.salario - a.salario);
    }

    return vagas;
  } catch (erro) {
    console.error('Erro ao buscar vagas:', erro);
    throw erro;
  }
}











class PaginadorDatos {
  constructor(pagina = 1, limite = 10) {
    this.pagina = pagina;
    this.limite = limite;
    this.total = 0;
  }

  async carregarPagina(tipo = 'posts') {
    try {
      let response;

      if (tipo === 'posts') {
        response = await FeedAPI.buscarPosts(this.pagina, this.limite);
      } else if (tipo === 'vagas') {
        response = await FeedAPI.buscarVagas(this.pagina, this.limite);
      }

      this.total = response.pagination?.total || 0;
      return response.data;
    } catch (erro) {
      console.error('Erro ao carregar página:', erro);
      throw erro;
    }
  }

  get totalPaginas() {
    return Math.ceil(this.total / this.limite);
  }

  proxima() {
    if (this.pagina < this.totalPaginas) {
      this.pagina++;
    }
  }

  anterior() {
    if (this.pagina > 1) {
      this.pagina--;
    }
  }

  irParaPagina(num) {
    if (num >= 1 && num <= this.totalPaginas) {
      this.pagina = num;
    }
  }
}








function validarFormulario(campos) {
  const erros = {};

  for (const [nome, valor] of Object.entries(campos)) {
    if (!valor || valor.trim() === '') {
      erros[nome] = `${nome} é obrigatório`;
      continue;
    }


    if (nome === 'email') {
      if (!valor.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        erros[nome] = 'Email inválido';
      }
    }

    if (nome === 'telefone') {
      if (!valor.match(/^\d{10,11}$/)) {
        erros[nome] = 'Telefone deve ter 10-11 dígitos';
      }
    }

    if (nome === 'cep') {
      if (!valor.match(/^\d{5}-?\d{3}$/)) {
        erros[nome] = 'CEP inválido';
      }
    }
  }

  return erros;
}
















class InfiniteScroll {
  constructor(container, carregarMais, opcoes = {}) {
    this.container = container;
    this.carregarMais = carregarMais;
    this.carregando = false;
    this.temMais = true;
    this.page = 1;

    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    this.container.appendChild(sentinel);

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.carregando && this.temMais) {
            this.proximaPagina();
          }
        });
      },
      { rootMargin: '100px' }
    );

    observer.observe(sentinel);
  }

  async proximaPagina() {
    if (this.carregando) return;

    this.carregando = true;
    try {
      const resultado = await this.carregarMais(this.page);
      if (resultado.items && resultado.items.length > 0) {
        this.page++;
      } else {
        this.temMais = false;
      }
    } finally {
      this.carregando = false;
    }
  }
}











function inicializarModoEscuro() {

  const prefereDark = window.matchMedia('(prefers-color-scheme: dark)').matches;


  const modoSalvo = localStorage.getItem('modo-escuro');

  if (modoSalvo !== null) {
    aplicarModo(modoSalvo === 'true');
  } else if (prefereDark) {
    aplicarModo(true);
  }


  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    aplicarModo(e.matches);
  });
}

function aplicarModo(escuro) {
  if (escuro) {
    document.documentElement.classList.add('dark-mode');
    localStorage.setItem('modo-escuro', 'true');
  } else {
    document.documentElement.classList.remove('dark-mode');
    localStorage.setItem('modo-escuro', 'false');
  }
}

function alternarModo() {
  const estaEscuro = document.documentElement.classList.contains('dark-mode');
  aplicarModo(!estaEscuro);
}







function exportarParaCSV(dados, nomeArquivo = 'dados.csv') {
  const headers = Object.keys(dados[0]);
  const csv = [headers.join(',')];

  dados.forEach(item => {
    const row = headers.map(header => {
      const valor = item[header];
      return typeof valor === 'string' && valor.includes(',')
        ? `"${valor}"`
        : valor;
    });
    csv.push(row.join(','));
  });

  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

function exportarParaJSON(dados, nomeArquivo = 'dados.json') {
  const json = JSON.stringify(dados, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}