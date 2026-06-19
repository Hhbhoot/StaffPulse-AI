import { Router } from 'express';
import { login, me, updateProfile, uploadAvatar } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.post('/login', login);
router.get('/me', verifyToken, me as any);
router.put('/profile', verifyToken, updateProfile as any);
router.post('/avatar', verifyToken, upload.single('avatar'), uploadAvatar as any);

export default router;
