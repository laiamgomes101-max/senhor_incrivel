const express = require('express');
const feedController = require('../controllers/feedController');

const router = express.Router();


router.get('/', feedController.getFeed);


router.get('/posts', feedController.getPostsPaginados);


router.get('/vagas', feedController.getVagasPaginadas);


router.post('/', feedController.criarPost);


router.get('/trending', feedController.getTrendingTopics);

module.exports = router;