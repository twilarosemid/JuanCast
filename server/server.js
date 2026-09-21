const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
// Increase limit to 500mb to accept Base64 image strings safely
app.use(express.json({ limit: '500mb' })); 
app.use(cors());

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas!"))
  .catch((err) => console.error("Database connection error:", err));

// 2a. Define the User Schema (Authentication)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true }, 
  password: { type: String, required: true },
  otp: { type: String }, 
  isVerified: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

// 2b. Define the Profile Schema (Public Info)
// 2b. Define the Profile Schema (Public Info)
const profileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true }, 
  birthdate: { type: String, required: true },
  gender: { type: String },
  // NEW FIELDS BELOW
  avatar: { type: String, default: "" }, 
  lastNameChange: { type: Date },
  lastUsernameChange: { type: Date }
});
const Profile = mongoose.model('Profile', profileSchema);

// 3. Configure the Email Sender
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// NEW: API Route to check if a username is available
app.post('/api/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    const existingUsername = await Profile.findOne({ username });
    
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already taken." });
    }
    
    res.status(200).json({ message: "Username is available!" });
  } catch (error) {
    res.status(500).json({ error: "Server error checking username." });
  }
});

// ==========================================
// Chat Post Schema & Routes
// ==========================================

// 1. Define the Post Schema
// 1. Define the Post Schema
const postSchema = new mongoose.Schema({
  user: { type: String, required: true },
  avatar: { type: String, default: "" }, // <-- NEW: Added avatar field
  text: { type: String, required: true },
  likes: { type: [String], default: [] }, 
  replies: { type: Array, default: [] } 
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

// 2. API Route: Get all posts (Newest first)
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// 3a. API Route: Create a new post
// 3c. API Route: Add a reply to a post
app.post('/api/posts/:id/reply', async (req, res) => {
  try {
    const { user, avatar, text } = req.body; // <-- NEW: Accept avatar
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // NEW: Include avatar in the reply object
    const newReply = { user, avatar, text, createdAt: new Date() }; 
    post.replies.push(newReply);
    await post.save();
    
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to reply to post" });
  }
});

// 3b. API Route: Toggle Like a post 
app.put('/api/posts/:id/like', async (req, res) => {
  try {
    const { user } = req.body; 
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    
    // Toggle logic: If user is in the array, remove them. If not, add them.
    if (post.likes.includes(user)) {
      post.likes = post.likes.filter(u => u !== user);
    } else {
      post.likes.push(user);
    }
    
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// 3c. API Route: Add a reply to a post
app.post('/api/posts/:id/reply', async (req, res) => {
  try {
    const { user, text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newReply = { user, text, createdAt: new Date() };
    post.replies.push(newReply);
    await post.save();
    
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to reply to post" });
  }
});
// ==========================================

// 4. API Route: Request OTP
app.post('/api/request-otp', async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ message: "User already exists." });
    }

    const existingPhone = await User.findOne({ phone, email: { $ne: email } });
    if (existingPhone && existingPhone.isVerified) {
      return res.status(400).json({ message: "Phone number is already registered." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!user) {
      user = new User({ email, phone, password: hashedPassword, otp });
    } else {
      user.password = hashedPassword;
      user.otp = otp;
      user.phone = phone; 
    }
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your JuanCast Verification Code',
      text: `Your 6-digit verification code is: ${otp}`
    });

    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process request." });
  }
});

// 5. API Route: Verify OTP & Create Profile
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp, fullName, username, birthdate, gender } = req.body;
    
    const existingUsername = await Profile.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already taken. Please try another." });
    }

    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid verification code." });

    user.isVerified = true;
    user.otp = undefined; 
    await user.save();

    const newProfile = new Profile({
      email,
      fullName,
      username,
      birthdate,
      gender
    });
    await newProfile.save();

    res.status(200).json({ message: "Account and Profile created successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify account." });
  }
});

// 6. API Route: User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const profile = await Profile.findOne({ email });

    res.status(200).json({ 
      message: "Login successful!", 
      user: {
        id: user._id,
        email: user.email,
        username: profile ? profile.username : email, 
        fullName: profile ? profile.fullName : "User" 
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during login." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ==========================================
// Profile Management Routes
// ==========================================

// GET: Fetch the current user's profile
app.get('/api/users/me', async (req, res) => {
  try {
    const { email } = req.query; // Grab email from the URL
    if (!email) return res.status(400).json({ message: "Email required" });

    const profile = await Profile.findOne({ email });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PUT: Update profile with 7-day and 30-day cooldowns
app.put('/api/users/update-profile', async (req, res) => {
  try {
    const { email, fullName, username, avatar } = req.body;
    
    const profile = await Profile.findOne({ email });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const now = new Date();

    // 1. Check Username Cooldown (30 days)
    if (username !== profile.username) {
      // Prevent taking someone else's username
      const usernameExists = await Profile.findOne({ username });
      if (usernameExists) return res.status(400).json({ message: "Username is already taken." });

      if (profile.lastUsernameChange) {
        const daysSinceUsernameChange = (now - profile.lastUsernameChange) / (1000 * 60 * 60 * 24);
        if (daysSinceUsernameChange < 30) {
          return res.status(400).json({ 
            message: `You must wait ${Math.ceil(30 - daysSinceUsernameChange)} more days to change your @username.` 
          });
        }
      }
      profile.username = username;
      profile.lastUsernameChange = now;
    }

    // 2. Check Name Cooldown (7 days)
    if (fullName !== profile.fullName) {
      if (profile.lastNameChange) {
        const daysSinceNameChange = (now - profile.lastNameChange) / (1000 * 60 * 60 * 24);
        if (daysSinceNameChange < 7) {
          return res.status(400).json({ 
            message: `You must wait ${Math.ceil(7 - daysSinceNameChange)} more days to change your name.` 
          });
        }
      }
      profile.fullName = fullName;
      profile.lastNameChange = now;
    }

    // 3. Update Avatar
    if (avatar) {
      profile.avatar = avatar;
    }

    await profile.save();
    res.status(200).json({ message: "Profile updated successfully!", profile });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile." });
  }
});