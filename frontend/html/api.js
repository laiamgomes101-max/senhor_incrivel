
console.log('api.js iniciando...');
const API_BASE = 'http://127.0.0.1:5000/api';

class ApiClient {
  constructor() {
    console.log('ApiClient constructor chamado');
    this.token = localStorage.getItem('token');
    this.userData = JSON.parse(localStorage.getItem('userData') || '{}');
    console.log('Carregado do localStorage:');
    console.log('  - token:', this.token);
    console.log('  - userData:', this.userData);

    if (this.userData && this.userData.tipo === 'empresa' && !this.userData.empresa_id) {
      this.userData.empresa_id = this.userData.id;
      localStorage.setItem('userData', JSON.stringify(this.userData));
      console.log('empresa_id ajustado a partir de id para compatibilidade');
    }
  }

  setToken(token) {
    console.log('setToken chamado com:', token);
    this.token = token;
    localStorage.setItem('token', token);
    console.log('Token salvo no localStorage:', localStorage.getItem('token'));
  }

  setUserData(data) {
    console.log('setUserData chamado com:', data);
    this.userData = data;
    localStorage.setItem('userData', JSON.stringify(data));
    console.log('userData salvo no localStorage:', localStorage.getItem('userData'));
  }

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(method, endpoint, data = null, includeAuth = true) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders(includeAuth)
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.msg || `Erro ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }


  async register(tipo, email, password, nome) {
    const data = { email, password, nome };
    const endpoint = `/auth/register/${tipo}`;
    const result = await this.request('POST', endpoint, data, false);

    this.setToken(result.token);

    const base = result.user || {};
    if (result.empresa && result.empresa.id) base.empresa_id = result.empresa.id;
    if (result.candidato && result.candidato.id) base.candidato_id = result.candidato.id;
    this.setUserData(base);
    return result;
  }

  async login(email, password) {
    const data = { email, password };
    const result = await this.request('POST', '/auth/login', data, false);

    console.log('Login bem-sucedido, resultado:', result);
    this.setToken(result.token);

    const base = result.user || {};
    if (result.empresa && result.empresa.id) base.empresa_id = result.empresa.id;
    if (result.candidato && result.candidato.id) base.candidato_id = result.candidato.id;
    this.setUserData(base);
    console.log('userData salvo:', this.userData);
    return result;
  }

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    this.token = null;
    this.userData = {};
  }

  async me() {
    return this.request('GET', '/auth/me');
  }

  async changeEmail(newEmail) {
    return this.request('POST', '/auth/change-email', { email: newEmail });
  }

  async changePassword(oldPassword, newPassword) {
    return this.request('POST', '/auth/change-password', { 
      old_password: oldPassword,
      new_password: newPassword 
    });
  }


  async listVagas(page = 1, perPage = 20, empresaId = null) {
    let endpoint = `/vagas/?page=${page}&per_page=${perPage}`;
    if (empresaId) {
      endpoint += `&empresa_id=${empresaId}`;
    }
    console.log('ApiClient.listVagas -> fazendo GET', endpoint);
    return this.request('GET', endpoint);
  }

  async getVaga(vagaId) {
    return this.request('GET', `/vagas/${vagaId}`);
  }

  async createVaga(titulo, descricao, requisitos, tipoContrato, localizacao, salarioMin, salarioMax) {
    const data = {
      titulo,
      descricao,
      requisitos,
      tipo_contrato: tipoContrato,
      localizacao,
      salario_min: salarioMin,
      salario_max: salarioMax,
      ativa: true
    };
    return this.request('POST', '/vagas/', data);
  }

  async updateVaga(vagaId, updates) {
    return this.request('PATCH', `/vagas/${vagaId}`, updates);
  }


  async createCandidatura(vagaId) {
    const data = { vaga_id: vagaId };
    return this.request('POST', '/vagas/candidaturas', data);
  }

  async updateCandidatura(candidaturaId, status, feedback = null, scoreAnalise = null) {
    const data = { status };
    if (feedback !== null) data.feedback = feedback;
    if (scoreAnalise !== null) data.score_analise = scoreAnalise;
    return this.request('PATCH', `/vagas/candidaturas/${candidaturaId}`, data);
  }


  async uploadCurriculo(file) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE}/curriculos/upload`;
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    };

    const response = await fetch(url, options);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao enviar currículo');
    }
    return await response.json();
  }

  async parseCurriculo(experiencia, educacao, habilidades, idiomas) {
    const data = {
      experiencia,
      educacao,
      habilidades,
      idiomas
    };
    return this.request('POST', '/curriculos/parse', data);
  }

  async getCurriculo(curriculoId) {
    return this.request('GET', `/curriculos/${curriculoId}`);
  }

  async analyzeCurriculo(curriculoId, vagaId) {
    const data = {
      curriculo_id: curriculoId,
      vaga_id: vagaId
    };
    return this.request('POST', '/curriculos/analyze', data);
  }

  async screenCandidates(vagaId, top_k = 5, mark = false) {
    const data = { top_k, mark };
    return this.request('POST', `/curriculos/vagas/${vagaId}/screen`, data);
  }
}


const api = new ApiClient();
console.log('api.js carregado completamente. Instância global criada:', api);


function redirectIfNotAuth() {
  if (!api.token) {
    window.location.href = 'login.html';
  }
}


function redirectIfNotCandidato() {
  console.log('redirectIfNotCandidato chamado');
  console.log('  - token:', api.token ? 'existe' : 'não existe');
  console.log('  - userData completo:', api.userData);
  console.log('  - userData.tipo:', api.userData?.tipo);

  redirectIfNotAuth();


  setTimeout(() => {
    const tipo = api.userData?.tipo;
    console.log('Verificação de tipo candidato - tipo:', tipo);


    if (tipo === 'empresa') {
      console.log('Detectado empresa, redirecionando para feed-empresa.html');
      window.location.href = 'feed-empresa.html';
    } else if (tipo === 'candidato') {
      console.log('Confirmado candidato, permanecendo na página');
    } else {
      console.warn('Tipo não identificado ou indefinido:', tipo);
    }
  }, 200);
}


function redirectIfNotEmpresa() {
  console.log('redirectIfNotEmpresa chamado');
  console.log('  - token:', api.token ? 'existe' : 'não existe');
  console.log('  - userData completo:', api.userData);
  console.log('  - userData.tipo:', api.userData?.tipo);

  redirectIfNotAuth();


  setTimeout(() => {
    const tipo = api.userData?.tipo;
    console.log('Verificação de tipo empresa - tipo:', tipo);


    if (tipo === 'candidato') {
      console.log('Detectado candidato, redirecionando para feed-candidato.html');
      window.location.href = 'feed-candidato.html';
    } else if (tipo === 'empresa') {
      console.log('Confirmado empresa, permanecendo na página');
    } else {
      console.warn('Tipo não identificado ou indefinido:', tipo);
    }
  }, 200);
}