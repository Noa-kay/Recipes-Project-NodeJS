const bcrypt = require('bcrypt');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Category = require('../models/Category');

const getAllUsers = async (_req, res, next) => {
  try {
    const users = await User.find({}, { password: 0 });
    return res.status(200).json(users);
  } catch (err) {
    return next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const isSelf = req.user.id === targetUserId;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) return next({ status: 403, message: 'Forbidden' });

    const user = await User.findById(targetUserId);
    if (!user) return next({ status: 404, message: 'User not found' });

    if (!isAdmin) {
      const isOldValid = await bcrypt.compare(req.body.oldPassword, user.password);
      if (!isOldValid) return next({ status: 400, message: 'Old password is incorrect' });
    }

    user.password = await bcrypt.hash(req.body.newPassword, 10);
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    return next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next({ status: 404, message: 'User not found' });

    const userRecipes = await Recipe.find({ addedBy: user._id }, { _id: 1 });
    const recipeIds = userRecipes.map((recipe) => recipe._id);

    if (recipeIds.length > 0) {
      await Recipe.deleteMany({ _id: { $in: recipeIds } });
      await Category.updateMany(
        { recipes: { $in: recipeIds } },
        { $pull: { recipes: { $in: recipeIds } } }
      );
      await Category.updateMany({}, [{ $set: { recipeCount: { $size: '$recipes' } } }]);
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAllUsers, updatePassword, deleteUser };
