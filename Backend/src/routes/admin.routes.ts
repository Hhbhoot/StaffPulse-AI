import { Router } from 'express';
import {
  createUser,
  updateUser,
  deleteUser,
  assignManager,
  getAllAttendance,
  getAttendanceStats,
  getAllLeaves,
  updateLeaveStatus,
  uploadDocument,
  getAIReport,
  getAllUsers,
  getUserDetails,
} from '../controllers/admin.controller';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

// Protect all admin routes
router.use(verifyToken);
router.use(authorizeRoles('ADMIN'));

router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/assign-manager', assignManager);
router.get('/all-attendance', getAllAttendance);
router.get('/attendance/stats', getAttendanceStats);
router.get('/all-leaves', getAllLeaves);
router.put('/leaves/:id/status', updateLeaveStatus);
router.post('/documents', upload.single('file'), uploadDocument);
router.get('/reports', getAIReport);

export default router;
