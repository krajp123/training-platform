import { Router } from 'express';
import multer from 'multer';
import {
  changePassword, deleteAvatar, deleteResume, downloadResume, getAvatar, getProfile,
  loginWithPassword, requestPhoneOtp, requestTwoFactorOtp, saveProfile, sendOtp,
  updateEmailMarketingConsent, uploadAvatar, uploadResume, verify, verifyPhoneOtp, verifyTwoFactorOtp,
} from './controller.js';

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
router.post('/password-login', loginWithPassword);
router.get('/profile', getProfile);
router.patch('/profile', saveProfile);
router.patch('/profile/notifications', updateEmailMarketingConsent);
router.patch('/profile/security/password', changePassword);
router.post('/profile/phone/request-otp', requestPhoneOtp);
router.post('/profile/phone/verify-otp', verifyPhoneOtp);
router.post('/profile/security/two-factor/request-otp', requestTwoFactorOtp);
router.post('/profile/security/two-factor/verify-otp', verifyTwoFactorOtp);
router.post('/profile/resume', resumeUpload.single('resume'), uploadResume);
router.get('/profile/resume', downloadResume);
router.delete('/profile/resume', deleteResume);
router.get('/profile/avatar', getAvatar);
router.post('/profile/avatar', avatarUpload.single('avatar'), uploadAvatar);
router.delete('/profile/avatar', deleteAvatar);

export default router;
