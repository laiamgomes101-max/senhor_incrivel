import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


console.log('Iniciando servidor de teste...');
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  env: { ...process.env, NODE_ENV: 'test' },
  stdio: 'inherit'
});


setTimeout(async () => {
  console.log('Executando testes de integração...');

  try {

    const { stdout, stderr } = await execAsync('npm test', { cwd: __dirname });
    console.log('STDOUT:', stdout);
    if (stderr) console.log('STDERR:', stderr);

    console.log('Testes passaram!');
    server.kill('SIGTERM');
    process.exit(0);

  } catch (error) {
    console.log('STDERR:', error.stderr);
    console.log(`Testes falharam: ${error.message}`);
    server.kill('SIGTERM');
    process.exit(1);
  }

}, 5000); 


process.on('SIGINT', () => {
  console.log('Encerrando servidor...');
  server.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Encerrando servidor...');
  server.kill('SIGTERM');
  process.exit(0);
});