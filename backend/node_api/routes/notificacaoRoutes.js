const express = require('express');
const notificacaoController = require('../controllers/notificacaoController');

const router = express.Router();


router.post('/', notificacaoController.enviarNotificacao);


router.post('/massa', notificacaoController.enviarNotificacaoEmMassa);


router.get('/usuario/:userId', notificacaoController.buscarNotificacoes);


router.patch('/:notificacaoId', notificacaoController.marcarComoLida);


router.delete('/usuario/:userId', notificacaoController.limparNotificacoes);

module.exports = router;