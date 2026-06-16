import express from 'express';
import curriculoController from '../controllers/curriculoController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateCreateCurriculo, validateUpdateCurriculo } from '../validation/curriculoValidation.js';

const router = express.Router();


router.use(authenticateToken);


router.post('/', validateCreateCurriculo, curriculoController.createCurriculo);
router.get('/:id', curriculoController.getCurriculoById);
router.put('/:id', validateUpdateCurriculo, curriculoController.updateCurriculo);
router.delete('/:id', curriculoController.deleteCurriculo);


router.get('/me', curriculoController.getMyCurriculo);
router.get('/me/stats', curriculoController.getCurriculoStats);


router.get('/search', curriculoController.searchCurriculos);
router.get('/filter/skills', curriculoController.getCurriculosBySkills);
router.get('/filter/location', curriculoController.getCurriculosByLocation);
router.get('/filter/experience', curriculoController.getCurriculosByExperienceLevel);
router.get('/filter/education', curriculoController.getCurriculosByEducationLevel);
router.get('/filter/disponibilidade', curriculoController.getCurriculosByDisponibilidade);
router.get('/filter/salary', curriculoController.getCurriculosByPretensaoSalarial);

export default router;