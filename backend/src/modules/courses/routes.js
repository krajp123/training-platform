import { Router } from 'express';
import {
  createCourse, deleteCourse, listCourses, updateCourse,
} from './controller.js';
import { requireAdmin } from '../admin-auth/controller.js';

const router = Router();

router.get('/', listCourses);
router.post('/', requireAdmin, createCourse);
router.patch('/:id', requireAdmin, updateCourse);
router.delete('/:id', requireAdmin, deleteCourse);

export default router;
