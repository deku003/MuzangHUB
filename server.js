const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);  // Attach WebSocket server to Express

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

    console.log(`Chunk ${chunkIndex + 1} of ${totalChunks} received for ${fileName}`);
    res.json({ message: 'Chunk uploaded successfully' });
});

// Handle video deletion after playing
app.delete('/delete-video', (req, res) => {
    const { fileName } = req.query;

    if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
    }

    const videoPath = path.join(uploadFolder, fileName);

    fs.unlink(videoPath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete the video file' });
        }
        res.status(200).json({ message: 'Video file deleted successfully' });
    });
});

// WebSocket connection
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for video upload and broadcast to all connected clients
    socket.on('video-uploaded', (videoUrl) => {
        console.log('Video uploaded:', videoUrl);
        io.emit('new-video', videoUrl);  // Broadcast to all clients
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
