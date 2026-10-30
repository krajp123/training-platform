import { Router } from 'express';
import {
  createCourse, deleteCourse, listCourses, updateCourse,
} from '../controllers/courseController.js';

const router = Router();

router.get('/', listCourses);
router.post('/', createCourse);
router.patch('/:id', updateCourse);
router.delete('/:id', deleteCourse);

export default router;
