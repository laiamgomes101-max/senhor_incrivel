import express from 'express';
import * as chatController from '../controllers/chatController.js';

const router = express.Router();

router.post('/', chatController.createRoom);
router.get('/', chatController.getRoomsForUser);
router.get('/usuario/:userId', chatController.getRoomsForUser);
router.get('/status/online', chatController.statusUsuario);
router.get('/:roomId', chatController.getRoom);
router.get('/:roomId/messages', chatController.getMessages);
router.post('/:roomId/messages', chatController.sendMessage);
router.post('/:roomId/read', chatController.markMessagesRead);
router.delete('/:roomId', chatController.deleteRoom);

export default router;
