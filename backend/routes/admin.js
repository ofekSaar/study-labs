import { Router } from 'express';
import {
  getAdminStats,
  getUsers,
  setUserRoles,
  deleteUser,
  getCourses,
  toggleCoursePublished,
  deleteCourse,
  getShopPrices,
  updateShopPrices,
  getInstructors,
} from '../controllers/adminController.js';

const router = Router();

// All routes require authenticate + requireAdmin (applied in server.js)

router.get('/stats', getAdminStats);

router.get('/users', getUsers);
router.put('/users/:id/role', setUserRoles);
router.delete('/users/:id', deleteUser);

router.get('/courses', getCourses);
router.put('/courses/:id/publish', toggleCoursePublished);
router.delete('/courses/:id', deleteCourse);

router.get('/instructors', getInstructors);

router.get('/shop/prices', getShopPrices);
router.put('/shop/prices', updateShopPrices);

export default router;
