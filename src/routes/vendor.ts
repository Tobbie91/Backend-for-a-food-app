import express from 'express';
import { authVendor} from '../middleware/authorization'
import { createFood, deleteFood, GetAllVendors, GetFoodByVendor, updateVendorProfile, vendorLogin,vendorProfile  } from '../controller/vendorController';
import { upload } from '../utils/multer';

const router = express.Router();

router.post('/login', vendorLogin)
router.post('/create-food', authVendor, upload.single('image'), createFood)
router.get('/get-profile', authVendor, vendorProfile )
router.get('/get-all-vendors', GetAllVendors)
router.delete('/delete-food/:foodid', authVendor, deleteFood)
router.patch('/update-vendor-profile',authVendor, upload.single('coverImage'), updateVendorProfile)
router.get('/get-vendor-food/:id', GetFoodByVendor )

export default router;