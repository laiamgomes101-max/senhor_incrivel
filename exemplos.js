/**
 * EXEMPLO: Como usar a localização Angola no seu projeto
 * 
 * Este arquivo mostra exemplos práticos de como integrar
 * as validações e formatações angolanas no seu backend
 */

// ============================================================================
// EXEMPLO 1: Usar em uma rota de registro de candidato
// ============================================================================

import express from 'express';
import { validateCandidatoAngola } from '../validation/angolaValidation.js';
import { formatarTelefoneAngola, formatarSalariaKwanza } from '../utils/angolaValidation.js';

const router = express.Router();

// Rota: POST /api/candidatos/registrar
// Body esperado:
// {
//   "nome": "João Silva",
//   "email": "joao@example.com",
//   "telefone": "+244 912 345 678",
//   "provincia": "Luanda",
//   "pretensao_salarial_min": 500000,
//   "pretensao_salarial_max": 1500000,
//   "habilidades": ["Python", "JavaScript"],
//   "disponibilidade": "Imediata"
// }

router.post('/registrar', validateCandidatoAngola, async (req, res) => {
  try {
    const candidato = req.body;

    // Dados já foram validados pelo middleware validateCandidatoAngola
    // Agora você pode salvar no banco com confiança

    // Formatar dados para exibição/armazenamento
    const telefoneLimpo = candidato.telefone.replace(/\D/g, '');
    const salarioFormatado = formatarSalariaKwanza(candidato.pretensao_salarial_min);

    // Exemplo: Salvar no banco
    // const result = await db.query(
    //   'INSERT INTO candidatos (nome, email, telefone, provincia, salario_min, salario_max) VALUES (?, ?, ?, ?, ?, ?)',
    //   [candidato.nome, candidato.email, telefoneLimpo, candidato.provincia, 
    //    candidato.pretensao_salarial_min, candidato.pretensao_salarial_max]
    // );

    res.status(201).json({
      success: true,
      message: 'Candidato registrado com sucesso',
      candidato: {
        nome: candidato.nome,
        telefone: formatarTelefoneAngola(candidato.telefone),
        provincia: candidato.provincia,
        salario_min: salarioFormatado,
        disponibilidade: candidato.disponibilidade
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro ao registrar candidato',
      details: error.message
    });
  }
});

// ============================================================================
// EXEMPLO 2: Usar em uma rota de criação de vaga
// ============================================================================

import { validateVagaAngola } from '../validation/angolaValidation.js';
import { formatarRangeSalariaKwanza } from '../utils/angolaValidation.js';

// Rota: POST /api/vagas/criar
// Body esperado:
// {
//   "titulo": "Desenvolvedor Python",
//   "descricao": "Procuramos desenvolvedor experiente...",
//   "provincia": "Luanda",
//   "salario_min": 800000,
//   "salario_max": 2000000,
//   "requisitos": ["Python", "Django", "REST API"],
//   "tipo_contrato": "Permanente"
// }

router.post('/criar', validateVagaAngola, async (req, res) => {
  try {
    const vaga = req.body;

    // Dados já foram validados pelo middleware validateVagaAngola
    // Range de salário já foi validado (max > min)
    // Província é uma das 18 válidas

    // Formatar para exibição
    const rangeFormatado = formatarRangeSalariaKwanza(vaga.salario_min, vaga.salario_max);

    res.status(201).json({
      success: true,
      message: 'Vaga criada com sucesso',
      vaga: {
        titulo: vaga.titulo,
        provincia: vaga.provincia,
        salario_range: rangeFormatado,
        tipo_contrato: vaga.tipo_contrato
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro ao criar vaga',
      details: error.message
    });
  }
});

// ============================================================================
// EXEMPLO 3: Usar em um controlador (MVC)
// ============================================================================

class CandidatoController {
  async obterCandidato(req, res) {
    try {
      const { id } = req.params;

      // Buscar no banco
      const candidato = await db.query(
        'SELECT * FROM candidatos WHERE id = ?',
        [id]
      );

      if (!candidato) {
        return res.status(404).json({ error: 'Candidato não encontrado' });
      }

      // Formatar para exibição
      return res.json({
        ...candidato,
        telefone: formatarTelefoneAngola(candidato.telefone),
        salario_min: formatarSalariaKwanza(candidato.pretensao_salarial_min),
        salario_max: formatarSalariaKwanza(candidato.pretensao_salarial_max)
      });

    } catch (error) {
      res.status(500).json({
        error: 'Erro ao obter candidato',
        details: error.message
      });
    }
  }

  async listarCandidatos(req, res) {
    try {
      const candidatos = await db.query('SELECT * FROM candidatos');

      // Formatar todos os candidatos
      const formatados = candidatos.map(c => ({
        ...c,
        telefone: formatarTelefoneAngola(c.telefone),
        salario_min: formatarSalariaKwanza(c.pretensao_salarial_min),
        salario_max: formatarSalariaKwanza(c.pretensao_salarial_max)
      }));

      res.json(formatados);

    } catch (error) {
      res.status(500).json({
        error: 'Erro ao listar candidatos',
        details: error.message
      });
    }
  }
}

// ============================================================================
// EXEMPLO 4: Usar em testes
// ============================================================================

import {
  validarTelefoneAngola,
  formatarTelefoneAngola,
  validarSalariaKwanza,
  formatarSalariaKwanza,
  validarProvinciaAngola
} from '../utils/angolaValidation.js';

// Testes de telefone
console.log('\n=== TESTES DE TELEFONE ===');
console.log(validarTelefoneAngola('+244 912 345 678'));     // true
console.log(formatarTelefoneAngola('+244912345678'));       // "+244 91 234 567"

// Testes de salário
console.log('\n=== TESTES DE SALÁRIO ===');
console.log(validarSalariaKwanza(1000000));                 // true
console.log(formatarSalariaKwanza(1000000));               // "1.000.000 Kz"
console.log(formatarSalariaKwanza(1000000, 'en'));         // "AOA 1,000,000"

// Testes de província
console.log('\n=== TESTES DE PROVÍNCIA ===');
console.log(validarProvinciaAngola('Luanda'));             // true
console.log(validarProvinciaAngola('lisboa'));             // false

// ============================================================================
// EXEMPLO 5: Usar com Express Middleware personalizado
// ============================================================================

// Middleware para formatar resposta
export function formatarRespostaAngola(req, res, next) {
  // Guardar o método json original
  const jsonOriginal = res.json;

  // Substituir com formatação Angola
  res.json = function (data) {
    if (data && Array.isArray(data)) {
      data = data.map(item => formatarItemAngola(item));
    } else if (data) {
      data = formatarItemAngola(data);
    }

    return jsonOriginal.call(this, data);
  };

  next();
}

function formatarItemAngola(item) {
  // Se tem telefone, formata
  if (item.telefone) {
    item.telefone_formatado = formatarTelefoneAngola(item.telefone);
  }

  // Se tem salário, formata
  if (item.pretensao_salarial_min) {
    item.salario_min_formatado = formatarSalariaKwanza(item.pretensao_salarial_min);
  }
  if (item.pretensao_salarial_max) {
    item.salario_max_formatado = formatarSalariaKwanza(item.pretensao_salarial_max);
  }

  return item;
}

// Usar no app
// app.use(formatarRespostaAngola);

// ============================================================================
// EXEMPLO 6: Validações personalizadas no controlador
// ============================================================================

async function atualizarCandidato(req, res) {
  try {
    const { id } = req.params;
    const atualizacoes = req.body;

    // Validação manual se necessário
    if (atualizacoes.telefone && !validarTelefoneAngola(atualizacoes.telefone)) {
      return res.status(400).json({
        error: 'Número de telefone inválido',
        exemplo: '+244 912 345 678'
      });
    }

    if (atualizacoes.provincia && !validarProvinciaAngola(atualizacoes.provincia)) {
      return res.status(400).json({
        error: 'Província inválida',
        opcoes: ['Luanda', 'Benguela', 'Huambo', '...']
      });
    }

    // Se passou nas validações, atualizar
    const resultado = await db.query(
      'UPDATE candidatos SET ? WHERE id = ?',
      [atualizacoes, id]
    );

    res.json({
      success: true,
      message: 'Candidato atualizado com sucesso'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro ao atualizar candidato',
      details: error.message
    });
  }
}

// ============================================================================
// INTEGRAÇÃO RÁPIDA - COPIE E COLE ISTO NO SEU CÓDIGO
// ============================================================================

/*

PASSO 1: Importe as validações
import { validateCandidatoAngola, validateVagaAngola } from '../validation/angolaValidation.js';
import { formatarTelefoneAngola, formatarSalariaKwanza } from '../utils/angolaValidation.js';

PASSO 2: Use no middleware das rotas
router.post('/candidatos/registrar', validateCandidatoAngola, async (req, res) => {
  // Seus dados já estão validados!
});

router.post('/vagas/criar', validateVagaAngola, async (req, res) => {
  // Seus dados já estão validados!
});

PASSO 3: Formate respostas
res.json({
  telefone: formatarTelefoneAngola(candidato.telefone),
  salario: formatarSalariaKwanza(candidato.salario)
});

*/

export default router;
