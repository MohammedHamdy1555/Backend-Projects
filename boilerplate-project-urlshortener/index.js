require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const dns = require('dns');
const urlparser = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

const client = new MongoClient(process.env.MONGO_URI); // 👈 correct env var
let urls; // collection reference

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("urlshortner"); // 👈 database name
    urls = db.collection("urls");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}
connectDB();

// Your first API endpoint
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', function(req, res) {
  console.log(req.body);
  const url = req.body.url;
  const dnslookup = dns.lookup(urlparser.parse(url).hostname,
async (err, address) => {
  if (!address) {
    res.json({ error: "Invalid URL" });
  }
  else {
    const urlCount = await urls.countDocuments();
    const urlDoc = {
      url,
      short_url: urlCount
    }
    const result = await urls.insertOne(urlDoc);
    console.log(result);
    res.json({ original_url: url, short_url: urlCount });
  }
}  
);
});

app.get('/api/shorturl/:shorturl', async function(req, res) {
  const shorturl = parseInt(req.params.shorturl);
  const urlDoc = await urls.findOne({ short_url: shorturl });
  if (urlDoc) {
    res.redirect(urlDoc.url);
  }
  else {
    res.json({ error: "No url found" });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
