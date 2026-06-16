import express from 'express';
import candidaturaController from '../controllers/candidaturaController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateCreateCandidatura, validateUpdateCandidaturaStatus, validateDateRange } from '../validation/candidaturaValidation.js';

const router = express.Router();


router.use(authenticateToken);


router.post('/', validateCreateCandidatura, candidaturaController.createCandidatura);
router.get('/:id', candidaturaController.getCandidaturaById);
router.put('/:id/status', validateUpdateCandidaturaStatus, candidaturaController.updateCandidaturaStatus);
router.delete('/:id', candidaturaController.deleteCandidatura);


router.get('/vaga/:vagaId', candidaturaController.getCandidaturasByVaga);
router.get('/vaga/:vagaId/stats', candidaturaController.getCandidaturaStats);
router.get('/vaga/:vagaId/status/:status', candidaturaController.getCandidaturasByStatus);
router.get('/vaga/:vagaId/date-range', validateDateRange, candidaturaController.getCandidaturasByDateRange);


router.get('/me', candidaturaController.getMyCandidaturas);
router.get('/me/stats', candidaturaController.getCandidatoStats);

export default router;