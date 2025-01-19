const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from a .env file
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Error connecting to MongoDB Atlas:', err));


// Define schemas and models
const dsrSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  report_date: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

const entrySchema = new mongoose.Schema({
  dsr_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DSR', required: true },
  number: { type: String, required: true },
  adds: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

const DSR = mongoose.model('DSR', dsrSchema);
const Entry = mongoose.model('Entry', entrySchema);

// API Endpoints
app.use(express.static(path.resolve(__dirname, 'public')));


// Get all DSRs
app.get('/api/dsrs', async (req, res) => {
  try {
    const dsrs = await DSR.find().sort('name');
    res.json(dsrs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new DSR
app.post('/api/dsrs', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'DSR name is required' });
  }

  try {
    const newDsr = new DSR({ name });
    await newDsr.save();
    res.json(newDsr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete DSR and all associated entries
app.delete('/api/dsrs/:id', async (req, res) => {
  try {
    await DSR.findByIdAndDelete(req.params.id);
    await Entry.deleteMany({ dsr_id: req.params.id });
    res.json({ message: 'DSR and associated entries deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get entries for a DSR
app.get('/api/dsrs/:id/entries', async (req, res) => {
  try {
    const entries = await Entry.find({ dsr_id: req.params.id }).sort('number');
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new entry
app.post('/api/entries', async (req, res) => {
  const { dsr_id, number, adds } = req.body;

  try {
    const newEntry = new Entry({ dsr_id, number, adds });
    await newEntry.save();
    res.json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update entry adds
app.put('/api/entries/:id/adds', async (req, res) => {
  const { adds } = req.body;

  try {
    await Entry.findByIdAndUpdate(req.params.id, { adds });
    res.json({ message: 'Entry updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update entry number
app.put('/api/entries/:id/number', async (req, res) => {
  const { number } = req.body;

  try {
    await Entry.findByIdAndUpdate(req.params.id, { number });
    res.json({ message: 'Entry updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete entry
app.delete('/api/entries/:id', async (req, res) => {
  try {
    await Entry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get report date for a specific DSR
app.get('/api/dsrs/:id/report-date', async (req, res) => {
  try {
    const dsr = await DSR.findById(req.params.id);
    if (!dsr) {
      return res.status(404).json({ error: 'DSR not found' });
    }
    res.json({ date: dsr.report_date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update report date for a specific DSR
app.put('/api/dsrs/:id/report-date', async (req, res) => {
  const { date } = req.body;

  try {
    await DSR.findByIdAndUpdate(req.params.id, { report_date: date });
    res.json({ message: 'Report date updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
