





const API_URL = 'http://localhost:3001';
const axios = require('axios');

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});





async function testarFeed() {
  console.log('\n🎯 Testando Feed...\n');

  try {

    const feedCompleto = await client.get('/api/feed');
    console.log('Feed Completo:', feedCompleto.data);


    const posts = await client.get('/api/feed/posts?page=1&limit=5');
    console.log('Posts (página 1):', posts.data);


    const vagas = await client.get('/api/feed/vagas?page=1&limit=5');
    console.log('Vagas (página 1):', vagas.data);


    const novoPost = await client.post('/api/feed', {
      conteudo: 'Olá! Este é meu primeiro post 🎉',
      userId: 1,
      tipo: 'texto'
    });
    console.log('Post criado:', novoPost.data);


    const trending = await client.get('/api/feed/trending');
    console.log('Trending:', trending.data);

  } catch (error) {
    console.error('Erro ao testar feed:', error.response?.data || error.message);
  }
}





async function testarNotificacoes() {
  console.log('\n🔔 Testando Notificações...\n');

  try {

    const notif = await client.post('/api/notificacoes', {
      userId: 1,
      titulo: 'Nova vaga!',
      mensagem: 'Uma vaga de React Developer foi publicada',
      tipo: 'vaga',
      dados: { vagaId: 123, empresa: 'TechCorp' }
    });
    console.log('Notificação enviada:', notif.data);


    const notifMassa = await client.post('/api/notificacoes/massa', {
      userIds: [1, 2, 3],
      titulo: 'Manutenção do sistema',
      mensagem: 'Sistema em manutenção das 22h às 23h',
      tipo: 'alerta'
    });
    console.log('Notificações em massa:', notifMassa.data);


    const notificacoes = await client.get('/api/notificacoes/usuario/1');
    console.log('Notificações do usuário 1:', notificacoes.data);

  } catch (error) {
    console.error('Erro ao testar notificações:', error.response?.data || error.message);
  }
}





async function testarChat() {
  console.log('\n💬 Testando Chat...\n');

  try {

    const conversa = await client.post('/api/chat', {
      usuarioId1: 1,
      usuarioId2: 2
    });
    console.log('Conversa iniciada:', conversa.data);
    const roomId = conversa.data.data.roomId;


    const conversaBuscada = await client.get(`/api/chat/${roomId}`);
    console.log('Conversa buscada:', conversaBuscada.data);


    const conversasDoUsuario = await client.get('/api/chat/usuario/1');
    console.log('Conversas do usuário 1:', conversasDoUsuario.data);


    const status = await client.get('/api/chat/status/online');
    console.log('Status de usuários online:', status.data);

  } catch (error) {
    console.error('Erro ao testar chat:', error.response?.data || error.message);
  }
}





async function testarSocketIO() {
  console.log('\n🔌 Testando Socket.io...\n');

  const io = require('socket.io-client');

  const socket = io(API_URL);

  socket.on('connect', () => {
    console.log('✅ Conectado ao servidor WebSocket');


    socket.emit('autenticar', 1);
    console.log('📝 Autenticação enviada para usuário 1');


    socket.emit('entrar_conversa', '1_2');
    console.log('📍 Entrou na conversa 1_2');


    setTimeout(() => {
      socket.emit('enviar_mensagem', {
        roomId: '1_2',
        usuarioId: 1,
        mensagem: 'Olá! Como você está?'
      });
      console.log('💬 Mensagem enviada');
    }, 1000);


    setTimeout(() => {
      socket.emit('novo_post', {
        conteudo: 'Meu novo post via WebSocket!',
        usuario_id: 1
      });
      console.log('📝 Novo post emitido');
    }, 2000);
  });

  socket.on('nova_mensagem', (data) => {
    console.log('📨 Nova mensagem recebida:', data);
  });

  socket.on('feed_atualizado', (post) => {
    console.log('🔄 Feed atualizado:', post);
  });

  socket.on('usuario_online', (data) => {
    console.log('👤 Usuário online:', data);
  });

  socket.on('notificacao_recebida', (notif) => {
    console.log('🔔 Notificação recebida:', notif);
  });

  socket.on('disconnect', () => {
    console.log('❌ Desconectado do servidor');
  });


  await new Promise(resolve => setTimeout(resolve, 5000));
  socket.disconnect();
}





async function executarTodosTestes() {
  console.log('🚀 Iniciando testes da API Node.js...');

  try {
    await testarFeed();
    await testarNotificacoes();
    await testarChat();
    await testarSocketIO();

    console.log('\n✅ Testes concluídos!');
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }

  process.exit(0);
}


if (require.main === module) {
  executarTodosTestes();
}

module.exports = {
  testarFeed,
  testarNotificacoes,
  testarChat,
  testarSocketIO
};