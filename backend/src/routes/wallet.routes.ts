import { Router } from 'express';
import { getWallet, getBalance } from '../controllers/wallet.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyJWT, getWallet);
router.get('/balance', verifyJWT, getBalance);

export default router;
