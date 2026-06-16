import express from 'express';
import vagaController from '../controllers/vagaController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateCreateVaga, validateUpdateVaga } from '../validation/vagaValidation.js';

const router = express.Router();


router.use(authenticateToken);


router.post('/', validateCreateVaga, vagaController.createVaga);
router.get('/', vagaController.getVagas);
router.get('/:id', vagaController.getVagaById);
router.put('/:id', validateUpdateVaga, vagaController.updateVaga);
router.delete('/:id', vagaController.deleteVaga);


router.get('/empresa/:empresaId', vagaController.getVagasByEmpresa);
router.get('/:id/stats', vagaController.getStats);

export default router;