import { Router } from 'express';
import multer from 'multer';
import {
  createCourse, deleteCourse, getAdminHomepageFeaturedCourses, listAdminCourses,
  listCourses, listHomepageFeaturedCourses, saveHomepageFeaturedCourses, updateCourse,
} from './controller.js';
import { uploadCourseImage } from './image-controller.js';
import { requireAdminRoles } from '../admin-auth/controller.js';

const router = Router();
const courseImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return callback(null, true);
    const error = new Error('Course cover must be a JPEG, PNG, or WebP image.');
    error.statusCode = 400;
    return callback(error);
  },
});

router.get('/admin', requireAdminRoles('owner', 'course_manager'), listAdminCourses);
router.get('/admin/homepage-featured', requireAdminRoles('owner', 'course_manager'), getAdminHomepageFeaturedCourses);
router.get('/', listCourses);
router.get('/homepage-featured', listHomepageFeaturedCourses);
router.post('/image', requireAdminRoles('owner', 'course_manager'), courseImageUpload.single('image'), uploadCourseImage);
router.post('/', requireAdminRoles('owner', 'course_manager'), createCourse);
router.put('/admin/homepage-featured', requireAdminRoles('owner', 'course_manager'), saveHomepageFeaturedCourses);
router.patch('/:id', requireAdminRoles('owner', 'course_manager'), updateCourse);
router.delete('/:id', requireAdminRoles('owner', 'course_manager'), deleteCourse);

export default router;
