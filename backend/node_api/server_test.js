




import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();


const app = express();


const server = createServer(app);


app.use(cors());
app.use(express.json());



app.get('/', (req, res) => {
  res.json({
    message: 'Servidor Node.js rodando!',
    status: 'ok',
    version: '1.0'
  });
});

app.get('/test', (req, res) => {
  res.json({ test: 'Conexão Node.js funcionando!' });
});


app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('# HELP http_requests_total Total HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{method="GET",endpoint="/"} 1\n');
});



const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});


io.on('connection', (socket) => {
  console.log(`Novo usuário conectado: ${socket.id}`);

  socket.on('user_login', (data) => {
    console.log(`Usuário ${data.email} fez login`);

    io.emit('usuario_conectado', {
      usuario: data,
      total_conectados: io.engine.clientsCount
    });
  });

  socket.on('disconnect', () => {
    console.log(`Usuário desconectado: ${socket.id}`);
  });
});



const PORT = process.env.PORT || 3002;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Node.js rodando na porta ${PORT}`);
  console.log(`Socket.io habilitado`);
});