const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/profile-pictures');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = fileTypes.test(file.mimetype);
  
  if (extname && mimeType) {
    return cb(null, true);
  } else {
    cb('Error: Only images are allowed!');
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

const uploadProfilePicture = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]);

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user); // Send the user data as response
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const getUserProfileById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Route to update user profile (with image upload handling)
// Example code in the userController.js
const updateUserProfile = async (req, res) => {
  const { name, status, socials, skillsToTeach, skillsToLearn } = req.body;
  
  let profilePicture = '';
  let certificate = '';
  if (req.files) {
    if (req.files.profilePicture) {
      profilePicture = req.files.profilePicture[0].filename;
    }
    if (req.files.certificate) {
      certificate = req.files.certificate[0].filename;
    }
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update profile data
    user.name = name;
    user.status = status;
    user.socials = socials;
    user.skillsToTeach = skillsToTeach;
    user.skillsToLearn = skillsToLearn;

    if (profilePicture) {
      user.profilePicture = profilePicture; // Set the new image
    }
    if (certificate) {
      user.certificate = certificate; // Set the new certificate
    }

    await user.save();
    res.json(user); // Send updated user back to frontend
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Change Password Controller
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    user.password = hashed;

    await user.save();

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Export functions and upload middleware
module.exports = { getUserProfile, getUserProfileById, updateUserProfile, changePassword, uploadProfilePicture };
