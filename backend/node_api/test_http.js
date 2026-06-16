import http from 'http';

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Servidor funcionando!', status: 'ok' }));
  } else if (req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ test: 'Conexão Node.js funcionando!' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Rota não encontrada' }));
  }
});

server.listen(3001, () => {
  console.log('✅ Servidor HTTP simples rodando em http://localhost:3001');
  console.log('Tente acessar:');
  console.log('  http://localhost:3001/');
  console.log('  http://localhost:3001/test');
});

server.on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err.message);
  process.exit(1);
});
