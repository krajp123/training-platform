import { Router } from 'express';
import { requireAdmin, requireAdminRoles } from '../admin-auth/controller.js';
import {
  downloadLearnerResume, getAdminOverview, getAuditLog, getLearnerAvatar, getLearnerProfile,
  listAdminEnrollments, listAdminLearners, sendLearnerLoginCode, setEnrollmentProgress, setLearnerStatus,
  updateLearnerProfile,
} from './controller.js';

const router = Router();

router.use(requireAdmin);
router.get('/overview', getAdminOverview);
router.get('/learners', requireAdminRoles('owner', 'course_manager', 'support'), listAdminLearners);
router.get('/learners/:id/profile', requireAdminRoles('owner', 'course_manager', 'support'), getLearnerProfile);
router.get('/learners/:id/avatar', requireAdminRoles('owner', 'course_manager', 'support'), getLearnerAvatar);
router.get('/learners/:id/resume', requireAdminRoles('owner', 'course_manager', 'support'), downloadLearnerResume);
router.patch('/learners/:id/profile', requireAdminRoles('owner', 'support'), updateLearnerProfile);
router.post('/learners/:id/request-login-code', requireAdminRoles('owner', 'support'), sendLearnerLoginCode);
router.patch('/learners/:id/status', requireAdminRoles('owner', 'support'), setLearnerStatus);
router.get('/enrollments', requireAdminRoles('owner', 'course_manager', 'finance', 'support'), listAdminEnrollments);
router.patch('/enrollments/:id/progress', requireAdminRoles('owner', 'course_manager'), setEnrollmentProgress);
router.get('/audit-log', requireAdminRoles('owner'), getAuditLog);

export default router;
