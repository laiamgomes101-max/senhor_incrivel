# Instruções para Reproduzir e Debugar ReferenceError (souEu/isOwner)

## Problema Identificado

O frontend em produção (Vercel) está lançando `ReferenceError: souEu is not defined` no perfil de candidato. Possível causa:
- Variável local `souEu` estava sendo referenciada fora do escopo do componente.
- Colisão com minificação/bundling do Webpack/Vite.

## Mudanças Aplicadas

1. **Refatoração de Variável**: Renomeada `souEu` → `isOwner` em:
   - `frontend/src/pages/Candidato.jsx` (linha 32 e referências)
   - `frontend/src/pages/Empresa.jsx` (linha 28 e referências)

2. **Hook Defensivo**: Criado `frontend/src/hooks/useIsOwner.js` para isolar lógica com try/catch.

3. **Endpoint Backend**: Adicionado `/api/curriculos/ia/analyze-profile` para análise de perfil IA.

## Passo-a-Passo para Reproduzir Localmente

### 1. Confirmar Git Status e Commits

```bash
cd C:\dev\plataforma-curriculos
git status
git log -n 5 --oneline
```

**Esperado**: Mudanças em `Candidato.jsx` e `Empresa.jsx` foram commitadas.

### 2. Instalar Dependências Frontend

```bash
npm --prefix frontend install
```

### 3. Reproduzir o Erro em Modo Dev

```bash
npm --prefix frontend run dev
```

Abra navegador em `http://localhost:5173` (ou a URL exibida). Navegue até `/app/candidato` com perfil logado.

**Esperado**: Página carrega sem erros de ReferenceError no console.

### 4. Verificar Console (DevTools)

- Pressione `F12` → **Console**
- Filtre por `ReferenceError`
- Se nenhum `souEu` aparecer, erro foi fixado ✅
- Se houver erro diferente, copie o stack trace completo

### 5. Build Local para Produção (Simulação)

```bash
npm --prefix frontend run build
```

**Esperado**: Build sucede sem avisos críticos. Verifique `frontend/dist/` foi gerado.

### 6. Rodar Backend Localmente (Suporte para Testes)

Em outro terminal PowerShell:

```bash
cd C:\dev\plataforma-curriculos\backend\flask_app
# Se usar venv (ative-o antes)
# Exemplo: .\.venv\Scripts\Activate (PowerShell) ou .\.venv\Scripts\activate.bat (cmd)
python -m flask run
```

Backend rodará em `http://localhost:5000`. Frontend (localhost:5173) chamará `http://localhost:5000/api/*`.

### 7. Testar Endpoint de Análise IA (Novo)

Com backend rodando, faça uma requisição POST de teste:

```bash
# Em outro terminal
curl -X POST http://localhost:5000/api/curriculos/ia/analyze-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "profile": {
      "curriculo": {
        "habilidades": ["React", "Python"],
        "idiomas": ["Inglês"],
        "experiencia": [{"titulo": "Dev", "empresa": "X"}],
        "educacao": ["Bacharel"]
      },
      "headline": "Desenvolvedor",
      "sobre": "Tenho experiência"
    }
  }'
```

**Esperado**: Retorna `200 OK` com JSON contendo `analysis` e `suggestions`.

## Coleta de Logs para Debug (Opção D)

Se encontrar erros, copie e Cole aqui:

### Console Errors (DevTools → Console)
```
[COLAR ERROS AQUI]
```

### Network Requests (DevTools → Network → aba "Fetch/XHR")
- Procure por requisições para `/api/*`
- Se houver 404 ou 5XX, procure pelo request:
  - URL completa
  - Status code
  - Response (corpo)

### Command Line Output
Se rodar `npm run dev` ou `npm run build` localmente, colas a saída:
```
[COLAR SAÍDA AQUI]
```

## Rollback (Se Necessário)

Se as mudanças piorarem a situação:

```bash
git reset --hard HEAD~1
git push origin main --force
```

## Próximos Passos

1. Execute os comandos acima localmente (itens 1-6).
2. Cole o resultado/erro no console aqui se encontrar algo.
3. Após validação local, Vercel fará redeploy automático após o push (já feito).
4. Monitore https://apwemi.vercel.app/app/candidato em um navegador com DevTools aberto (F12).

---

**Documentação Criada**: `backend/docs/FRONTEND_DEBUG_SOUEU_ERROR.md` (este arquivo pode ser commitado como referência)
