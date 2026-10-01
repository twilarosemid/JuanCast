const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getPollDisplayTitle, sortRankings } = require('./contentUtils');
require('dotenv').config();

const app = express();
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const safeName = `${Date.now()}-${Math.random().toString(16).slice(2)}${path.extname(file.originalname || '.png')}`;
    cb(null, safeName);
  }
});

const upload = multer({ storage });

app.use(express.json({ limit: '500mb' })); 
app.use(cors());
app.use('/uploads', express.static(uploadDir));

// 1. Connect to MongoDB and auto-synchronize ranking positions on boot
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB Atlas!");
    await seedChikaArticles();
    await seedPolls();
    await seedRankings();

    // Auto-recalculate and sync database positions based on vote counts
    const allRankings = await Ranking.find().sort({ voteCount: -1, createdAt: 1 });
    for (let i = 0; i < allRankings.length; i++) {
      allRankings[i].position = i + 1;
      await allRankings[i].save();
    }
    console.log("Database ranking positions synchronized successfully.");
  })
  .catch((err) => console.error("Database connection error:", err));

// 2a. Define the User Schema (Authentication)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true }, 
  password: { type: String, required: true },
  otp: { type: String }, 
  isVerified: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});
const User = mongoose.model('User', userSchema);

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getAdminEmails = () => {
  const configured = (process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

  return [...new Set([...configured, 'adminjuancast@gmail.com', 'gulfericdonato6@gmail.com'])];
};

const resolveAdminStatus = (user = {}) => {
  if (!user) return false;
  const normalizedEmail = normalizeEmail(user.email);
  const role = String(user.role || '').trim().toLowerCase();
  return Boolean(user.isAdmin) || role === 'admin' || getAdminEmails().includes(normalizedEmail);
};

// 2b. Define the Profile Schema (Public Info & Currency)
const profileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true }, 
  birthdate: { type: String, required: true },
  gender: { type: String },
  avatar: { type: String, default: "" },
  coverPhoto: { type: String, default: "" },
  coverPosition: {
    x: { type: Number, default: 50 },
    y: { type: Number, default: 50 }
  },
  followers: { type: [String], default: [] },
  following: { type: [String], default: [] },
  stars: { type: Number, default: 100 }, 
  suns: { type: Number, default: 100 },
  dailyStreak: { type: Number, default: 0 },    // <-- ADDED FOR DAILY REWARDS
  lastClaimDate: { type: Date, default: null }, // <-- ADDED FOR DAILY REWARDS
  lastNameChange: { type: Date },
  lastUsernameChange: { type: Date }
});
const Profile = mongoose.model('Profile', profileSchema);

// 2c. Define Content Schemas
const chikaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, default: "" },
  url: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});
const Chika = mongoose.model('Chika', chikaSchema);

const pollSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Poll = mongoose.model('Poll', pollSchema);

const rankingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  youtubeUrl: { type: String, default: '' },
  youtubeStartTime: { type: Number, default: 0 }, // <-- ADD THIS LINE
  voteCount: { type: Number, default: 0 },
  position: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});
const Ranking = mongoose.model('Ranking', rankingSchema);

const normalizeImageUrl = (value = '') => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const cleanPath = value.startsWith('/') ? value : `/${value}`;
  const formattedPath = cleanPath.startsWith('/uploads/') ? cleanPath : `/uploads/${cleanPath.replace(/^\//, '')}`;
  return `http://localhost:5000${formattedPath}`;
};

const seedChikaArticles = async () => {
  try {
    const count = await Chika.countDocuments();
    if (count === 0) {
      await Chika.create(defaultChikaArticle);
      console.log('Seeded default Chika article.');
    }
  } catch (error) {
    console.error('Error seeding Chika data:', error);
  }
};

const seedPolls = async () => {
  try {
    const count = await Poll.countDocuments();
    if (count === 0) {
      await Poll.insertMany(defaultPolls);
      console.log('Seeded default poll data.');
    }
  } catch (error) {
    console.error('Error seeding Poll data:', error);
  }
};

const seedRankings = async () => {
  try {
    const count = await Ranking.countDocuments();
    if (count === 0) {
      await Ranking.insertMany(defaultRankings);
      console.log('Seeded default ranking data.');
    }
  } catch (error) {
    console.error('Error seeding Ranking data:', error);
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// -----------------------------------------------------------
// PROFILE & DAILY REWARD ROUTES (NEW)
// -----------------------------------------------------------

// Fetch logged-in user profile by email
app.get('/api/users/me', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const profile = await Profile.findOne({ email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' } });
    if (!profile) return res.status(404).json({ message: "Profile not found." });

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Server error fetching profile." });
  }
});

// Fetch user profile by username (for public viewing)
app.get('/api/users/profile/:username', async (req, res) => {
  try {
    const profile = await Profile.findOne({ username: { $regex: `^${escapeRegex(req.params.username)}$`, $options: 'i' } });
    if (!profile) return res.status(404).json({ message: "Profile not found." });

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching public profile:", error);
    res.status(500).json({ error: "Server error fetching profile." });
  }
});

// Process Daily Claim
app.post('/api/users/daily-claim', async (req, res) => {
  try {
    const { email, dayClaimed, rewardValue, currency } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const profile = await Profile.findOne({ email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' } });
    if (!profile) return res.status(404).json({ message: "User profile not found." });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Normalize last claim to midnight of that day for comparison
    const lastClaimTime = profile.lastClaimDate 
        ? new Date(profile.lastClaimDate.getFullYear(), profile.lastClaimDate.getMonth(), profile.lastClaimDate.getDate()).getTime() 
        : null;

    if (lastClaimTime === today) {
        return res.status(400).json({ message: 'Reward already claimed today. Come back tomorrow!' });
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Update streak logic
    if (lastClaimTime === yesterday.getTime()) {
        profile.dailyStreak += 1;
    } else {
        profile.dailyStreak = 1; // Reset to 1 if missed a day
    }

    if (profile.dailyStreak > 7) {
        profile.dailyStreak = 1; // Loop back after day 7
    }

    // Allocate rewards
    if (currency === 'STARS') {
        profile.stars += rewardValue;
    } else if (currency === 'SUNS') {
        profile.suns += rewardValue;
    } else if (currency === 'BOTH') {
        profile.stars += rewardValue.stars || 0;
        profile.suns += rewardValue.suns || 0;
    }

    profile.lastClaimDate = now;
    await profile.save();

    res.status(200).json(profile);
  } catch (error) {
    console.error("Daily claim error:", error);
    res.status(500).json({ error: "Internal server error while claiming reward." });
  }
});

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

// Chat Posts
const postSchema = new mongoose.Schema({
  user: { type: String, required: true },
  avatar: { type: String, default: '' },
  text: { type: String, required: true },
  likes: { type: [String], default: [] },
  // ADD THIS REPLIES ARRAY:
  replies: [{
    user: String,
    avatar: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { user, avatar, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Post text cannot be empty" });
    }
    const newPost = new Post({ user, avatar: avatar || "", text, likes: [], replies: [] });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// POST: Add a reply to a specific post
app.post('/api/posts/:id/reply', async (req, res) => {
  try {
    const { user, avatar, text } = req.body;
    
    // 1. Find the post by the ID in the URL
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // 2. Add the new reply to the array
    post.replies.push({ 
      user, 
      avatar: avatar || '', 
      text 
    });

    // 3. Save it to the database
    await post.save();

    // 4. Send the FULL updated post back to React so it can re-render the UI
    res.status(200).json(post);
    
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ message: 'Error adding reply', error: error.message });
  }
});

const serializeImage = (item = {}) => ({
  ...item,
  imageUrl: normalizeImageUrl(item.imageUrl)
});

// Chika API Routes
app.get('/api/chika', async (req, res) => {
  try {
    const articles = await Chika.find().sort({ createdAt: -1 });
    res.status(200).json(articles.map((article) => serializeImage(article.toObject())));
  } catch (error) {
    console.error('Error fetching Chika articles:', error);
    res.status(500).json({ error: 'Failed to fetch Chika articles' });
  }
});

app.post('/api/chika', upload.single('image'), async (req, res) => {
  try {
    const { title, description, url } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }
    const article = await Chika.create({
      title,
      description,
      imageUrl: normalizeImageUrl(req.file ? `/uploads/${req.file.filename}` : ''),
      url: url || ''
    });
    res.status(201).json(serializeImage(article.toObject()));
  } catch (error) {
    console.error('Error creating Chika article:', error);
    res.status(500).json({ error: 'Failed to create Chika article' });
  }
});

app.put('/api/chika/:id', upload.single('image'), async (req, res) => {
  try {
    const article = await Chika.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Chika article not found.' });
    }
    article.title = req.body.title || article.title;
    article.description = req.body.description || article.description;
    article.url = req.body.url ?? article.url;
    if (req.file) {
      article.imageUrl = normalizeImageUrl(`/uploads/${req.file.filename}`);
    }
    await article.save();
    res.status(200).json(serializeImage(article.toObject()));
  } catch (error) {
    console.error('Error updating Chika article:', error);
    res.status(500).json({ error: 'Failed to update Chika article' });
  }
});

app.delete('/api/chika/:id', async (req, res) => {
  try {
    const removed = await Chika.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: 'Chika article not found.' });
    }
    res.status(200).json({ message: 'Chika article deleted.' });
  } catch (error) {
    console.error('Error deleting Chika article:', error);
    res.status(500).json({ error: 'Failed to delete Chika article' });
  }
});

// Polls API Routes
app.get('/api/polls', async (req, res) => {
  try {
    const polls = await Poll.find().sort({ fromDate: 1 });
    res.status(200).json(polls.map((poll) => ({
      ...poll.toObject(),
      imageUrl: normalizeImageUrl(poll.imageUrl),
      displayTitle: getPollDisplayTitle ? getPollDisplayTitle(poll.title, poll.fromDate) : poll.title
    })));
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

app.post('/api/polls', upload.single('image'), async (req, res) => {
  try {
    const { title, fromDate, toDate } = req.body;
    if (!title || !fromDate || !toDate) {
      return res.status(400).json({ message: 'Title, fromDate, and toDate are required.' });
    }
    const poll = await Poll.create({
      title,
      imageUrl: normalizeImageUrl(req.file ? `/uploads/${req.file.filename}` : ''),
      fromDate: new Date(fromDate),
      toDate: new Date(toDate)
    });
    res.status(201).json({
      ...poll.toObject(),
      imageUrl: normalizeImageUrl(poll.imageUrl),
      displayTitle: poll.title
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

app.put('/api/polls/:id', upload.single('image'), async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }
    poll.title = req.body.title || poll.title;
    poll.fromDate = req.body.fromDate ? new Date(req.body.fromDate) : poll.fromDate;
    poll.toDate = req.body.toDate ? new Date(req.body.toDate) : poll.toDate;
    if (req.file) {
      poll.imageUrl = normalizeImageUrl(`/uploads/${req.file.filename}`);
    }
    await poll.save();
    res.status(200).json({
      ...poll.toObject(),
      imageUrl: normalizeImageUrl(poll.imageUrl),
      displayTitle: poll.title
    });
  } catch (error) {
    console.error('Error updating poll:', error);
    res.status(500).json({ error: 'Failed to update poll' });
  }
});

app.delete('/api/polls/:id', async (req, res) => {
  try {
    const removed = await Poll.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: 'Poll not found.' });
    }
    res.status(200).json({ message: 'Poll deleted.' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ error: 'Failed to delete poll' });
  }
});

// Rankings API Routes
app.get('/api/rankings', async (req, res) => {
  try {
    const rankings = await Ranking.find().sort({ voteCount: -1, createdAt: 1 });
    
    const updatedRankings = await Promise.all(rankings.map(async (item, index) => {
      const newPos = index + 1;
      if (item.position !== newPos) {
        item.position = newPos;
        await item.save();
      }
      return serializeImage(item.toObject());
    }));

    res.status(200).json(updatedRankings);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

app.post('/api/rankings', upload.single('image'), async (req, res) => {
try {
    // Extract the new variable from req.body
    const { name, position, youtubeUrl, youtubeStartTime } = req.body; 
    
    if (!name) {
      return res.status(400).json({ message: 'Ranking name is required.' });
    }
    const ranking = await Ranking.create({
      name,
      youtubeUrl: youtubeUrl || '',
      youtubeStartTime: Number(youtubeStartTime) || 0, // <-- ADD THIS LINE
      imageUrl: normalizeImageUrl(req.file ? `/uploads/${req.file.filename}` : ''),
      voteCount: 0,
      position: Number(position || 1)
    });
    res.status(201).json(serializeImage(ranking.toObject()));
  } catch (error) {
    console.error('Error creating ranking:', error);
    res.status(500).json({ error: 'Failed to create ranking' });
  }
});

app.post('/api/rankings', upload.single('image'), async (req, res) => {
  try {
    // 1. Extract youtubeUrl from the request body
    const { name, position, youtubeUrl } = req.body; 
    
    if (!name) {
      return res.status(400).json({ message: 'Ranking name is required.' });
    }
    const ranking = await Ranking.create({
      name,
      youtubeUrl: youtubeUrl || '', // 2. Save it to the database
      imageUrl: normalizeImageUrl(req.file ? `/uploads/${req.file.filename}` : ''),
      voteCount: 0,
      position: Number(position || 1)
    });
    res.status(201).json(serializeImage(ranking.toObject()));
  } catch (error) {
    console.error('Error creating ranking:', error);
    res.status(500).json({ error: 'Failed to create ranking' });
  }
});

// CURRENCY-BASED VOTING ROUTE
app.post('/api/rankings/:id/vote', async (req, res) => {
  try {
    const { email, currencyType = 'stars', cost = 1 } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Login required to vote." });
    }

    const profile = await Profile.findOne({ email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' } });
    if (!profile) {
      return res.status(404).json({ message: "User profile not found." });
    }

    if (typeof profile.stars !== 'number') profile.stars = 100;
    if (typeof profile.suns !== 'number') profile.suns = 100;

    if (currencyType === 'stars' && profile.stars < cost) {
      return res.status(400).json({ message: "Not enough stars to vote!" });
    }
    if (currencyType === 'suns' && profile.suns < cost) {
      return res.status(400).json({ message: "Not enough suns to vote!" });
    }

    if (currencyType === 'stars') {
      profile.stars -= cost;
    } else {
      profile.suns -= cost;
    }
    await profile.save();

    const ranking = await Ranking.findById(req.params.id);
    if (!ranking) {
      return res.status(404).json({ message: 'Ranking not found.' });
    }

    ranking.voteCount = Number(ranking.voteCount || 0) + cost;
    await ranking.save();

    // Re-sort all rankings and update positions automatically based on votes
    const allRankings = await Ranking.find().sort({ voteCount: -1, createdAt: 1 });
    for (let i = 0; i < allRankings.length; i++) {
      allRankings[i].position = i + 1;
      await allRankings[i].save();
    }

    const updatedTarget = await Ranking.findById(req.params.id);

    res.status(200).json({
      ranking: serializeImage(updatedTarget.toObject()),
      remainingStars: profile.stars,
      remainingSuns: profile.suns
    });
  } catch (error) {
    console.error('Error voting for ranking:', error);
    res.status(500).json({ error: 'Failed to vote for ranking' });
  }
});

app.put('/api/rankings/:id', upload.single('image'), async (req, res) => {
  try {
    const ranking = await Ranking.findById(req.params.id);
    if (!ranking) {
      return res.status(404).json({ message: 'Ranking not found.' });
    }
    
    ranking.name = req.body.name || ranking.name;
    ranking.position = Number(req.body.position || ranking.position || 1);
    
    // 3. Update the youtubeUrl if a new one is provided
if (req.body.youtubeUrl !== undefined) {
      ranking.youtubeUrl = req.body.youtubeUrl;
    }
    
    // --- ADD THIS BLOCK ---
    if (req.body.youtubeStartTime !== undefined) {
      ranking.youtubeStartTime = Number(req.body.youtubeStartTime) || 0;
    }

    if (req.file) {
      ranking.imageUrl = normalizeImageUrl(`/uploads/${req.file.filename}`);
    }
    await ranking.save();
    res.status(200).json(serializeImage(ranking.toObject()));
  } catch (error) {
    console.error('Error updating ranking:', error);
    res.status(500).json({ error: 'Failed to update ranking' });
  }
});
// Authentication Routes
app.post('/api/request-otp', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    let user = await User.findOne({ email: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: 'i' } });
    if (user && user.isVerified) {
      return res.status(400).json({ message: "User already exists." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!user) {
      user = new User({ email: normalizedEmail, phone, password: hashedPassword, otp });
    } else {
      user.email = normalizedEmail;
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

app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp, fullName, username, birthdate, gender } = req.body;
    const normalizedEmail = normalizeEmail(email);
    
    const existingUsername = await Profile.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already taken. Please try another." });
    }

    const user = await User.findOne({ email: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: 'i' } });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid verification code." });

    user.email = normalizedEmail;
    user.isVerified = true;
    user.otp = undefined; 
    await user.save();

    const newProfile = new Profile({
      email: normalizedEmail,
      fullName,
      username,
      birthdate,
      gender,
      coverPhoto: ''
    });
    await newProfile.save();

    res.status(200).json({ message: "Account and Profile created successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify account." });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: 'i' } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const normalizedUserEmail = normalizeEmail(user.email);
    const profile = await Profile.findOne({ email: { $regex: `^${escapeRegex(normalizedUserEmail)}$`, $options: 'i' } });
    const isAdmin = resolveAdminStatus(user);

    if (isAdmin) {
      user.email = normalizedUserEmail;
      user.isAdmin = true;
      user.role = 'admin';
      await user.save();
    }

// Inside app.post('/api/login') ...
    
res.status(200).json({ 
        message: "Login successful!", 
        user: {
          id: user._id,
          email: normalizedUserEmail,
          username: profile ? profile.username : normalizedUserEmail,
          fullName: profile ? profile.fullName : "User",
          avatar: profile ? profile.avatar : "",
          coverPhoto: profile?.coverPhoto || '',
          stars: profile?.stars ?? 100, 
          suns: profile?.suns ?? 100,
          dailyStreak: profile?.dailyStreak ?? 0,
          lastClaimDate: profile?.lastClaimDate || null,
          isAdmin,
          role: isAdmin ? 'admin' : (user.role || 'user')
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error during login." });
    }
});
// Your banner routes or app.listen should come AFTER that closing line.

// --- YOUTUBE VIDEO SCHEMA ---
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  youtubeUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Video = mongoose.model('Video', videoSchema);

// --- YOUTUBE VIDEO API ROUTES ---
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

app.post('/api/videos', upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, youtubeUrl } = req.body;
    const newVideo = await Video.create({
      title,
      subtitle: subtitle || '',
      youtubeUrl: youtubeUrl || '',
      imageUrl: normalizeImageUrl(req.file ? `/uploads/${req.file.filename}` : ''),
    });
    res.status(201).json(newVideo);
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// --- BANNER SCHEMA ---
const bannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  linkUrl: { type: String, required: false },
  altText: { type: String, required: false, default: 'Promo Banner' },
  createdAt: { type: Date, default: Date.now }
});

const Banner = mongoose.model('Banner', bannerSchema);

// --- BANNER API ROUTES ---
// GET: Fetch all banners for the carousel
app.get('/api/banners', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });

    return res.status(200).json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);

    return res.status(500).json({
      message: 'Error fetching banners.'
    });
  }
});

// POST: Upload and save a new banner
app.post('/api/banners', (req, res) => {
  upload.single('image')(req, res, async (uploadError) => {
    if (uploadError) {
      console.error('Banner upload error:', uploadError);

      return res.status(400).json({
        message: 'Failed to upload image.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Please select an image to upload.'
      });
    }

    try {
      const imageUrl =
        `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      const newBanner = await Banner.create({
        imageUrl,
        linkUrl: req.body.linkUrl || '',
        altText: req.body.altText || 'Promo Banner'
      });

      return res.status(201).json(newBanner);
    } catch (error) {
      console.error('Error saving banner:', error);

      fs.unlink(req.file.path, (cleanupError) => {
        if (cleanupError) {
          console.error('Error removing unsaved image:', cleanupError);
        }
      });

      return res.status(500).json({
        message: 'Failed to save banner.'
      });
    }
  });
});

// DELETE: Remove a banner from Admin Dashboard
app.delete('/api/banners/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid banner ID.'
      });
    }

    const deletedBanner = await Banner.findByIdAndDelete(req.params.id);

    if (!deletedBanner) {
      return res.status(404).json({
        message: 'Banner not found.'
      });
    }

    return res.status(200).json({
      message: 'Banner deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);

    return res.status(500).json({
      message: 'Error deleting banner.'
    });
  }
});

const reportSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  issue: { type: String, required: true },
  fileUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// POST: Submit a new issue report
// Notice we use upload.single('file') to match the formData.append('file', ...) from React
app.post('/api/reports', upload.single('file'), async (req, res) => {
  try {
    const { subject, issue } = req.body;

    if (!subject || !issue) {
      return res.status(400).json({ message: 'Subject and issue text are required.' });
    }

    // Create the report in MongoDB
    const newReport = await Report.create({
      subject,
      issue,
      // If a file was uploaded, generate its URL using your existing normalizer. Otherwise, leave empty.
      fileUrl: normalizeImageUrl(req.file ? `/uploads/${req.file.filename}` : '')
    });

    res.status(201).json({ 
      message: 'Report submitted successfully', 
      report: newReport 
    });

  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ message: 'Internal server error while saving report.' });
  }
});

// Optional GET route if you want to view reports later in your Admin Dashboard
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));