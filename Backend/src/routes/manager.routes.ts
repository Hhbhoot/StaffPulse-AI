import { Router } from 'express';
import {
  createStaff,
  getOwnStaff,
  getTeamAttendance,
  getTeamLeaves,
  updateLeaveStatus,
  getAIReport,
  getTeamStats,
  getStaffDetails,
} from '../controllers/manager.controller';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// Protect all manager routes
router.use(verifyToken);
router.use(authorizeRoles('MANAGER'));

router.post('/staff', createStaff);
router.get('/staff', getOwnStaff);
router.get('/staff/:id', getStaffDetails);
router.get('/team-attendance', getTeamAttendance);
router.get('/attendance/stats', getTeamStats);
router.get('/team-leaves', getTeamLeaves);
router.put('/leaves/:id/status', updateLeaveStatus);
router.get('/reports', getAIReport);

export default router;
