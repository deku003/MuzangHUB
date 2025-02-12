const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const uploadFolder = path.join(__dirname, 'uploads');

// Enable CORS
app.use(cors());

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve static files (e.g., uploaded videos)
app.use('/uploads', express.static(uploadFolder));

// Upload video in chunks (as per your previous code)
app.post('/upload-chunk', upload.single('file'), (req, res) => {
    const { fileName, chunkIndex, totalChunks } = req.body;

    // Handle chunked upload logic here (if needed)
    console.log(`Chunk ${chunkIndex + 1} of ${totalChunks} received for ${fileName}`);

    // Respond with a success message once all chunks are uploaded
    res.json({ message: 'Chunk uploaded successfully' });
});

// Handle video deletion after playing
app.delete('/delete-video', (req, res) => {
    const { fileName } = req.query;

    if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
    }

    const videoPath = path.join(uploadFolder, fileName);

    // Check if file exists and delete it
    fs.unlink(videoPath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete the video file' });
        }
        res.status(200).json({ message: 'Video file deleted successfully' });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
