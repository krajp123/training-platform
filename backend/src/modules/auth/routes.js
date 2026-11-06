import { Router } from 'express';
import multer from 'multer';
import { deleteAvatar, deleteResume, downloadResume, getAvatar, getProfile, saveProfile, sendOtp, uploadAvatar, uploadResume, verify } from './controller.js';

const router = Router();
const resumeUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return callback(null, true);
    const error = new Error('Profile photo must be a JPEG, PNG, or WebP image.');
    error.statusCode = 400;
    return callback(error);
  },
});

router.post('/request-otp', sendOtp);
router.post('/verify-otp', verify);
router.get('/profile', getProfile);
router.patch('/profile', saveProfile);
router.post('/profile/resume', resumeUpload.single('resume'), uploadResume);
router.get('/profile/resume', downloadResume);
router.delete('/profile/resume', deleteResume);
router.get('/profile/avatar', getAvatar);
router.post('/profile/avatar', avatarUpload.single('avatar'), uploadAvatar);
router.delete('/profile/avatar', deleteAvatar);

export default router;
