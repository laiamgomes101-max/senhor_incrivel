import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function killPort3001() {
  try {
    // Tentar com netstat/taskkill
    const cmd = process.platform === 'win32' 
      ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr 3001') do taskkill /PID %a /F 2>nul`
      : `lsof -ti:3001 | xargs kill -9 2>/dev/null || true`;
    
    console.log('Tentando liberar porta 3001...');
    const { stdout, stderr } = await execAsync(cmd, { shell: true });
    
    if (stdout) console.log('stdout:', stdout);
    if (stderr && !stderr.includes('não encontrado')) console.log('stderr:', stderr);
    
    console.log('✅ Porta 3001 liberada');
    return true;
  } catch (error) {
    // Pode não ter encontrado nada, o que é ok
    console.log('ℹ️ Nenhum processo encontrado na porta 3001 (ou não conseguiu matar)');
    return false;
  }
}

console.log('🔧 Iniciando processo de limpeza...');
await killPort3001();
console.log('✅ Pronto para reiniciar o servidor');
