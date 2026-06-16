











import express from 'express';
import pool from '../database.js';
import { analisarCurriculo, extrairTudo, verificarFlask } from '../utils/flaskApi.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();







router.get('/status', async (req, res) => {
  try {
    const status = await verificarFlask();

    if (status.online) {
      return res.json({
        message: 'Flask está online ✅',
        status: status.status,
        version: status.version
      });
    } else {
      return res.status(503).json({
        message: 'Flask está offline ❌',
        error: status.error
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});













router.post('/curriculo', authenticate, requireRole('candidato'), async (req, res) => {
  try {
    let { curriculo_id, vaga_id, curriculo_texto } = req.body;
    const user_id = req.user.id;


    if (!vaga_id) {
      return res.status(400).json({ error: 'Campo obrigatório: vaga_id' });
    }


    if (curriculo_id && !curriculo_texto) {
      const cRes = await pool.query(
        'SELECT texto_completo FROM curriculos WHERE id=$1 AND usuario_id=$2',
        [curriculo_id, user_id]
      );
      if (cRes.rows.length === 0) {
        return res.status(404).json({ error: 'Currículo não encontrado' });
      }
      curriculo_texto = cRes.rows[0].texto_completo;
    }

    if (!curriculo_texto || typeof curriculo_texto !== 'string') {
      return res.status(400).json({ error: 'Texto do currículo é obrigatório' });
    }

    console.log(`📊 Iniciando análise para usuário ${user_id}`);
    console.log(`   Currículo ID: ${curriculo_id}, Vaga ID: ${vaga_id}`);


    const vagaRes = await pool.query(
      'SELECT requisitos FROM vagas WHERE id = $1',
      [vaga_id]
    );
    const vagaRequisitos = vagaRes.rows.length ? vagaRes.rows[0].requisitos || [] : [];
    console.log(`   Requisitos da vaga: ${vagaRequisitos.join(', ')}`);


    console.log(`\n🧠 Chamando Flask para análise...`);
    const analise = await analisarCurriculo(curriculo_texto, vagaRequisitos);
    console.log(`✅ Análise concluída: ${analise.compatibilidade_pct}% compatível`);


    await pool.query(
      'INSERT INTO analises (user_id, curriculo_id, vaga_id, resultado) VALUES ($1, $2, $3, $4)',
      [user_id, curriculo_id, vaga_id, JSON.stringify(analise)]
    );

    console.log(`💾 Resultado salvo no banco de dados`);


    res.json({
      message: 'Análise concluída com sucesso ✅',
      analise: {
        ...analise,
        meta: {
          user_id,
          curriculo_id,
          vaga_id,
          data_analise: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
    res.status(500).json({
      error: 'Erro ao analisar currículo',
      message: error.message
    });
  }
});












router.post('/rapido', authenticate, async (req, res) => {
  try {
    const { curriculo_texto, curriculo_id } = req.body;

    if (!curriculo_texto) {
      return res.status(400).json({
        error: 'curriculo_texto é obrigatório'
      });
    }

    console.log(`🔍 Análise rápida iniciada`);


    const informacoes = await extrairTudo(curriculo_texto);

    console.log(`✅ Análise rápida concluída`);


    try {
      await pool.query(
        'INSERT INTO analises (user_id, curriculo_id, vaga_id, resultado) VALUES ($1,$2,$3,$4)',
        [req.user.id, curriculo_id || null, null, JSON.stringify(informacoes)]
      );
      console.log('💾 Análise rápida armazenada no banco');
    } catch (saveErr) {
      console.error('Erro ao salvar análise rápida:', saveErr.message);
    }

    res.json({
      message: 'Informações extraídas com sucesso',
      dados: informacoes
    });

  } catch (error) {
    console.error('❌ Erro na análise rápida:', error.message);
    res.status(500).json({
      error: 'Erro ao extrair informações',
      message: error.message
    });
  }
});






router.get('/historico', authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;


    const historicoRes = await pool.query(
      'SELECT * FROM analises WHERE user_id = $1 ORDER BY data_analise DESC',
      [user_id]
    );
    const historico = historicoRes.rows;

    res.json({
      message: `${historico.length} análise(s) encontrada(s)`,
      historico
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});






router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;


    await pool.query(
      'DELETE FROM analises WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    res.json({
      message: 'Análise removida com sucesso'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;