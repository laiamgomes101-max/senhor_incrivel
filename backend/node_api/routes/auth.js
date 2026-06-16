import express from 'express';
import authController from '../controllers/authController.js';
import userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../validation/authValidation.js';

const router = express.Router();


router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);


router.use(authenticateToken); 

router.get('/me', authController.getCurrentUser);
router.post('/refresh-token', authController.refreshToken);


router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getUserById);
router.delete('/users/:id', userController.deleteUser);
router.get('/users/:id/stats', userController.getStats);

export default router;