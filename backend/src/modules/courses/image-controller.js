import { uploadImage, validateImageFile } from '../../utils/cloudinary.js';

export async function uploadCourseImage(request, response, next) {
  try {
    validateImageFile(request.file, 5 * 1024 * 1024, 'Course cover');
    const { url } = await uploadImage(request.file, 'skillpath/course-covers');
    return response.json({ url });
  } catch (error) {
    return next(error);
  }
}
