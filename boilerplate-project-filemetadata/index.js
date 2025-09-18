const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Multer: save to /uploads then we'll delete after reading metadata
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const upload = multer({
  dest: uploadDir,
  limits: {
    // optional: limit file size to 5 MB
    fileSize: 5 * 1024 * 1024
  }
});

// FCC expects POST /api/fileanalyse with form field 'upfile'
app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // multer file object: originalname, mimetype, size, path
  const { originalname: name, mimetype: type, size, path: filePath } = req.file;

  // respond with metadata
  res.json({ name, type, size });

  // cleanup: delete saved file asynchronously (don't block response)
  fs.unlink(filePath, (err) => {
    if (err) console.error('Failed to remove uploaded file:', err);
  });
});

// basic ping
app.get('/api/ping', (req, res) => res.json({ ok: true }));

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + listener.address().port);
});
