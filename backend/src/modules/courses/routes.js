import { Router } from 'express';
import {
  createCourse, deleteCourse, getAdminHomepageFeaturedCourses, listAdminCourses,
  listCourses, listHomepageFeaturedCourses, saveHomepageFeaturedCourses, updateCourse,
} from './controller.js';
import { requireAdminRoles } from '../admin-auth/controller.js';

const router = Router();

router.get('/admin', requireAdminRoles('owner', 'course_manager'), listAdminCourses);
router.get('/admin/homepage-featured', requireAdminRoles('owner', 'course_manager'), getAdminHomepageFeaturedCourses);
router.get('/', listCourses);
router.get('/homepage-featured', listHomepageFeaturedCourses);
router.post('/', requireAdminRoles('owner', 'course_manager'), createCourse);
router.put('/admin/homepage-featured', requireAdminRoles('owner', 'course_manager'), saveHomepageFeaturedCourses);
router.patch('/:id', requireAdminRoles('owner', 'course_manager'), updateCourse);
router.delete('/:id', requireAdminRoles('owner', 'course_manager'), deleteCourse);

export default router;
