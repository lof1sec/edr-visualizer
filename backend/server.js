const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const convertedDir = path.join(__dirname, 'converted');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(convertedDir)) fs.mkdirSync(convertedDir);

// 1. Endpoint to upload files
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { logType } = req.body; // 'crowdstrike' or 'defender'
  const filePath = req.file.path;
  const fileName = req.file.filename;

  if (logType === 'defender') {
    // Convert Defender CSV to JSONL
    const jsonlFilePath = path.join(convertedDir, `${fileName}.jsonl`);
    let rowCount = 0;

    const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const writeStream = fs.createWriteStream(jsonlFilePath, { encoding: 'utf-8' });

    readStream
      .pipe(csv())
      .on('data', (row) => {
        writeStream.write(JSON.stringify(row) + '\n');
        rowCount++;
      })
      .on('end', () => {
        writeStream.end();
        console.log(`Conversion complete! Successfully transformed ${rowCount} rows from ${filePath} to ${jsonlFilePath}.`);
        res.json({ message: 'File uploaded and converted successfully', filename: `${fileName}.jsonl`, type: 'defender' });
      })
      .on('error', (err) => {
        console.error('Error during conversion:', err);
        res.status(500).json({ error: 'Error converting file' });
      });
  } else if (logType === 'crowdstrike') {
    // Crowdstrike is already JSONL, just move it to converted directory
    const newFilePath = path.join(convertedDir, fileName);
    fs.rename(filePath, newFilePath, (err) => {
      if (err) {
         console.error('Error moving file:', err);
         return res.status(500).json({ error: 'Error processing file' });
      }
      res.json({ message: 'File uploaded successfully', filename: fileName, type: 'crowdstrike' });
    });
  } else {
    // Delete invalid file
    fs.unlinkSync(filePath);
    res.status(400).json({ error: 'Invalid log type. Must be crowdstrike or defender' });
  }
});

// 2. Endpoint to list available converted files
app.get('/api/files', (req, res) => {
  fs.readdir(convertedDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to scan directory' });
    }
    // Filter only jsonl files or files without extensions if needed, returning all for now
    res.json({ files });
  });
});

// 3. Endpoint to stream a specific file's content
app.get('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(convertedDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.setHeader('Content-Type', 'application/jsonx'); // or text/plain
  const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  readStream.pipe(res);
});

// 4. Endpoint to delete a file
app.delete('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(convertedDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to delete file' });
    }
    res.json({ message: 'File deleted successfully' });
  });
});

// 5. In-memory storage for session state (for simplicity, could use a db)
let savedStates = {};

app.post('/api/state/:filename', (req, res) => {
  const filename = req.params.filename;
  savedStates[filename] = req.body;
  res.json({ message: 'State saved successfully' });
});

app.get('/api/state/:filename', (req, res) => {
  const filename = req.params.filename;
  const state = savedStates[filename] || null;
  res.json({ state });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
