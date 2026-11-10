import { Router } from 'express';
import {
  createCourse, deleteCourse, listAdminCourses, listCourses, updateCourse,
} from './controller.js';
import { requireAdminRoles } from '../admin-auth/controller.js';

const router = Router();

router.get('/admin', requireAdminRoles('owner', 'course_manager'), listAdminCourses);
router.get('/', listCourses);
router.post('/', requireAdminRoles('owner', 'course_manager'), createCourse);
router.patch('/:id', requireAdminRoles('owner', 'course_manager'), updateCourse);
router.delete('/:id', requireAdminRoles('owner', 'course_manager'), deleteCourse);

export default router;
