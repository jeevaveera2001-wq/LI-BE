import { Router } from 'express';
import {
  getSponsors,
  createSponsor
} from '../controllers/sponsors.controller.js';

const router = Router();

router.get('/', getSponsors);
router.post('/', createSponsor);

export default router;
