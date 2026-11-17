import { Router } from 'express';
import {
  getInquiries,
  createInquiry,
  updateInquiry,
  deleteInquiry
} from '../controllers/inquiries.controller.js';

const router = Router();

router.get('/', getInquiries);
router.post('/', createInquiry);
router.put('/', updateInquiry);
router.patch('/', updateInquiry);
router.delete('/', deleteInquiry);

export default router;
