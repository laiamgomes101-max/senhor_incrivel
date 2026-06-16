import http from 'http';
const server = http.createServer((req, res) => {
  if (req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, path: req.url }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  }
});
server.listen(3001, '127.0.0.1', () => {
  console.log('simple server listening on 3001');
});
