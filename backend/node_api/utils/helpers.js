




exports.validarToken = (token) => {
  if (!token) return null;
  try {

    return true;
  } catch (error) {
    return null;
  }
};




exports.respostaSucesso = (data, mensagem = 'Sucesso') => {
  return {
    status: 'success',
    message: mensagem,
    data,
    timestamp: new Date()
  };
};




exports.respostaErro = (mensagem, codigo = 'ERRO_GENERICO', detalhes = null) => {
  return {
    status: 'error',
    message: mensagem,
    code: codigo,
    detalhes,
    timestamp: new Date()
  };
};




exports.gerarRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};




exports.validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};




exports.paginar = (array, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    items: array.slice(offset, offset + limit),
    total: array.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(array.length / limit)
  };
};