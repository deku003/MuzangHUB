const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Set up Multer storage for handling incoming video chunks
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload folder for video chunks
const uploadFolder = path.join(__dirname, 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

// Route to handle video chunk uploads
app.post('/upload-chunk', upload.single('file'), (req, res) => {
    const { file, body } = req;
    const { chunkIndex, totalChunks, fileName } = body;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const chunkPath = path.join(uploadFolder, `${fileName}.part${chunkIndex}`);
    
    // Write the chunk to the file system
    fs.writeFile(chunkPath, file.buffer, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save chunk' });
        }

        // If this is the last chunk, combine all chunks into one file
        if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
            const fullFilePath = path.join(uploadFolder, fileName);
            const writeStream = fs.createWriteStream(fullFilePath);

            // Read and append each chunk to form the final video file
            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = path.join(uploadFolder, `${fileName}.part${i}`);
                const chunk = fs.readFileSync(chunkPath);
                writeStream.write(chunk);
                // Delete chunk after writing
                fs.unlinkSync(chunkPath);
            }
            writeStream.end();
        }

        res.status(200).json({ message: `Chunk ${chunkIndex + 1} uploaded successfully.` });
    });
});

// Serve static files for the front-end (index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
