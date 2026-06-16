import express from 'express';
import notificacaoController from '../controllers/notificacaoController.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  validateCreateNotificacao, 
  validateUpdateNotificacao, 
  validateCreateSystemNotification, 
  validateCreateBulkNotifications, 
  validateArchiveOldNotifications 
} from '../validation/notificacaoValidation.js';

const router = express.Router();


router.use(authenticateToken);


router.post('/', validateCreateNotificacao, notificacaoController.createNotificacao);
router.get('/:id', notificacaoController.getNotificacaoById);
router.put('/:id', validateUpdateNotificacao, notificacaoController.updateNotificacao);
router.delete('/:id', notificacaoController.deleteNotificacao);


router.get('/', notificacaoController.getMyNotificacoes);
router.get('/unread', notificacaoController.getNotificacoesNaoLidas);
router.put('/:id/read', notificacaoController.markAsRead);
router.put('/read-all', notificacaoController.markAllAsRead);
router.get('/stats', notificacaoController.getNotificacaoStats);


router.get('/tipo/:tipo', notificacaoController.getNotificacoesByTipo);


router.get('/date-range', notificacaoController.getNotificacoesByDateRange);


router.get('/referencia/:referenciaId/:referenciaTipo', notificacaoController.getNotificacoesByReferencia);


router.post('/system', validateCreateSystemNotification, notificacaoController.createSystemNotification);
router.post('/bulk', validateCreateBulkNotifications, notificacaoController.createBulkNotifications);
router.post('/archive', validateArchiveOldNotifications, notificacaoController.archiveOldNotifications);

export default router;