








import axios from 'axios';


const FLASK_BASE_URL = process.env.FLASK_API || 'http://localhost:5000';


const flaskClient = axios.create({
  baseURL: FLASK_BASE_URL,
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json'
  }
});







export async function analisarCurriculo(curriculoTexto, vagaRequisitos) {
  try {
    if (!curriculoTexto || typeof curriculoTexto !== 'string') {
      throw new Error('Currículo deve ser uma string');
    }
    if (!Array.isArray(vagaRequisitos)) {
      throw new Error('Requisitos deve ser um array');
    }
    const response = await flaskClient.post('/api/analisar', {
      curriculo_texto: curriculoTexto,
      vaga_requisitos: vagaRequisitos,
    });
    return response.data;
  } catch (error) {
    let msg = error.message;
    if (error.response) msg += ` (${error.response.status}: ${JSON.stringify(error.response.data)})`;
    console.error('Erro ao analisar currículo:', msg);
    throw new Error(`Flask Erro: ${msg}`);
  }
}






export async function extrairSkills(curriculoTexto) {
  try {
    const response = await flaskClient.post('/api/extrair-skills', {
      curriculo_texto: curriculoTexto
    });
    return response.data.skills;
  } catch (error) {
    console.error('Erro ao extrair skills:', error.message);
    throw error;
  }
}




export async function extrairExperiencia(curriculoTexto) {
  try {
    const response = await flaskClient.post('/api/extrair-experiencia', {
      curriculo_texto: curriculoTexto
    });
    return response.data.anos_experiencia;
  } catch (error) {
    console.error('Erro ao extrair experiência:', error.message);
    throw error;
  }
}




export async function extrairEducacao(curriculoTexto) {
  try {
    const response = await flaskClient.post('/api/extrair-educacao', {
      curriculo_texto: curriculoTexto
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao extrair educação:', error.message);
    throw error;
  }
}




export async function extrairTudo(curriculoTexto, vagaRequisitos = null) {
  try {
    const payload = { curriculo_texto: curriculoTexto };
    if (vagaRequisitos) {
      payload.vaga_requisitos = vagaRequisitos;
    }

    const response = await flaskClient.post('/api/extrair-tudo', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao extrair tudo:', error.message);
    throw error;
  }
}




export async function verificarFlask() {
  try {
    const response = await flaskClient.get('/');
    return {
      online: true,
      status: response.data.status,
      version: response.data.version
    };
  } catch (error) {
    return {
      online: false,
      error: error.message
    };
  }
}







export async function extractInformation(text) {
  try {
    const resp = await flaskClient.post('/ia/extract', { texts: [text] });
    return resp.data.extracted[0];
  } catch (error) {
    console.error('Erro extractInformation:', error.message);
    throw error;
  }
}




export async function computeCompatibility(cvInfo, vagaInfo) {
  try {
    const resp = await flaskClient.post('/ia/compatibility', { cv_info: cvInfo, vaga_info: vagaInfo });
    return resp.data.compatibility_pct ?? resp.data.compatibility;
  } catch (error) {
    console.error('Erro computeCompatibility:', error.message);
    throw error;
  }
}




export async function recommendVagas(text, vagas, top_k = 5) {
  try {
    const resp = await flaskClient.post('/ia/recommend', { text, vagas, top_k });
    return resp.data.recommendations;
  } catch (error) {
    console.error('Erro recommendVagas:', error.message);
    throw error;
  }
}




















export default {
  analisarCurriculo,
  extrairSkills,
  extrairExperiencia,
  extrairEducacao,
  extrairTudo,
  verificarFlask,
  extractInformation,
  computeCompatibility,
  recommendVagas
};