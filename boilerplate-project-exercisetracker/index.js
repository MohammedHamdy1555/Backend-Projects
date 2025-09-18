const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const { Schema } = mongoose

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const UserSchema = new Schema({
  username: String,
})
const User = mongoose.model('User', UserSchema)

const exerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date
})
const Exercise = mongoose.model('Exercise', exerciseSchema)

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(()=> console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const username = req.body.username;
    if (!username) return res.status(400).json({ error: 'username required' });
    const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id').exec();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { description, duration } = req.body;
    let { date } = req.body;

    if (!description || !duration) {
      return res.status(400).json({ error: 'description and duration are required' });
    }

    const dur = parseInt(duration);
    if (isNaN(dur)) return res.status(400).json({ error: 'duration must be a number' });

    const dateObj = date ? new Date(date) : new Date();
    if (isNaN(dateObj.getTime())) return res.status(400).json({ error: 'invalid date' });

    const exercise = new Exercise({
      user_id: user._id,
      description,
      duration: dur,
      date: dateObj
    });

    await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    });
  }
  catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

// Get logs with optional from, to, limit
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { from, to, limit } = req.query;
    const filter = { user_id: user._id };

    if (from || to) {
      filter.date = {};
      if (from) {
        const f = new Date(from);
        if (isNaN(f.getTime())) return res.status(400).json({ error: 'invalid from date' });
        filter.date.$gte = f;
      }
      if (to) {
        const t = new Date(to);
        if (isNaN(t.getTime())) return res.status(400).json({ error: 'invalid to date' });
        filter.date.$lte = t;
      }
    }

    let query = Exercise.find(filter).select('description duration date').sort({ date: 1 });
    if (limit) {
      const lim = parseInt(limit);
      if (isNaN(lim)) return res.status(400).json({ error: 'limit must be a number' });
      query = query.limit(lim);
    }

    const exercises = await query.exec();
    const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log
    });
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});