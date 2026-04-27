const express = require('express');
const { getAllUsers, updatePassword, deleteUser } = require('../controllers/userController');
const { authRequired, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { updatePasswordSchema } = require('../validations/userValidation');

const router = express.Router();

router.use(authRequired);
router.get('/', requireRole('admin'), getAllUsers);
router.patch('/:id/password', validate(updatePasswordSchema), updatePassword);
router.delete('/:id', requireRole('admin'), deleteUser);

module.exports = router;
