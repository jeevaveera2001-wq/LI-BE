import { Router } from 'express';
import {
  getRegistrations,
  createRegistration,
  updateRegistration,
  deleteRegistration
} from '../controllers/registrations.controller.js';

const router = Router();

router.get('/', getRegistrations);
router.post('/', createRegistration);
router.put('/', updateRegistration);
router.patch('/', updateRegistration);
router.delete('/', deleteRegistration);

export default router;
