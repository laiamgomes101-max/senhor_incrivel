const axios = require('axios');

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';


let feed_cache = {
  posts: [],
  vagas: [],
  lastUpdate: 0
};

exports.getFeed = async (req, res) => {
  try {

    const postsResponse = await axios.get(`${FLASK_API_URL}/api/posts`);
    const posts = postsResponse.data || [];


    const vagasResponse = await axios.get(`${FLASK_API_URL}/api/vagas`);
    const vagas = vagasResponse.data || [];


    feed_cache = {
      posts,
      vagas,
      lastUpdate: Date.now()
    };

    res.json({
      status: 'success',
      data: {
        posts,
        vagas,
        total: posts.length + vagas.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar feed:', error.message);


    res.json({
      status: 'cached',
      message: 'Retornando dados em cache',
      data: feed_cache
    });
  }
};

exports.getPostsPaginados = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const postsResponse = await axios.get(
      `${FLASK_API_URL}/api/posts?page=${page}&limit=${limit}`
    );

    res.json({
      status: 'success',
      data: postsResponse.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar posts',
      error: error.message
    });
  }
};

exports.getVagasPaginadas = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const vagasResponse = await axios.get(
      `${FLASK_API_URL}/api/vagas?page=${page}&limit=${limit}`
    );

    res.json({
      status: 'success',
      data: vagasResponse.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar vagas',
      error: error.message
    });
  }
};

exports.criarPost = async (req, res) => {
  try {
    const { conteudo, userId, tipo } = req.body;

    if (!conteudo || !userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Conteúdo e userId são obrigatórios'
      });
    }

    const postResponse = await axios.post(
      `${FLASK_API_URL}/api/posts`,
      { conteudo, user_id: userId, tipo },
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );

    res.status(201).json({
      status: 'success',
      data: postResponse.data,
      message: 'Post criado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao criar post',
      error: error.message
    });
  }
};

exports.getTrendingTopics = async (req, res) => {
  try {

    const todosTextos = [
      ...feed_cache.posts.map(p => p.conteudo || ''),
      ...feed_cache.vagas.map(v => v.titulo + ' ' + v.descricao || '')
    ].join(' ').toLowerCase();


    const palavras = todosTextos.match(/\b[a-záéíóúãõç]{4,}\b/g) || [];
    const frequencia = {};

    palavras.forEach(palavra => {
      frequencia[palavra] = (frequencia[palavra] || 0) + 1;
    });

    const trending = Object.entries(frequencia)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([palavra, count]) => ({ palavra, count }));

    res.json({
      status: 'success',
      data: trending
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar trending topics',
      error: error.message
    });
  }
};