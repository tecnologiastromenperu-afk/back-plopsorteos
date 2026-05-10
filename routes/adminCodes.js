import express from 'express';
import multer from 'multer';
import {
  createAdminCode,
  listAdminCodes,
  getAdminCodeById,
  updateAdminCode,
  deleteAdminCode,
  importAdminCodesCsv,
  importAdminCodesExcel,
} from '../controllers/adminCodesController.js';
import {
  createCodeValidation,
  updateCodeValidation,
  paginationValidation,
  handleValidationErrors,
} from '../middleware/adminValidation.js';
import { requireAdminAuth } from '../middleware/requireAdminAuth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAdminAuth);

router.get('/', paginationValidation, handleValidationErrors, listAdminCodes);
router.get('/:id', getAdminCodeById);
router.post('/', createCodeValidation, handleValidationErrors, createAdminCode);
router.patch('/:id', updateCodeValidation, handleValidationErrors, updateAdminCode);
router.delete('/:id', deleteAdminCode);
router.post('/import/csv', upload.single('file'), importAdminCodesCsv);
router.post('/import/excel', upload.single('file'), importAdminCodesExcel);

export default router;
