const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs-extra');

// Load environment variables
dotenv.config();

// Import services
const videoProcessor = require('./services/videoProcessor');
const googleDriveService = require('./services/googleDriveService');
const telegramService = require('./services/telegramService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure temp directory exists
const tempDir = process.env.TEMP_DIR || './temp';
fs.ensureDirSync(tempDir);

// Routes
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: require('../package.json').version
    });
});

// Process video workflow endpoint
app.post('/process-video', async (req, res) => {
    try {
        const { fileId, caption, buttons } = req.body;
        
        console.log(`Starting video processing for file ID: ${fileId}`);
        
        // Step 1: Download video from Google Drive
        const videoPath = await googleDriveService.downloadFile(fileId);
        console.log(`Video downloaded: ${videoPath}`);
        
        // Step 2: Process video with ffmpeg for streaming
        const processedVideoPath = await videoProcessor.processForStreaming(videoPath);
        console.log(`Video processed: ${processedVideoPath}`);
        
        // Step 3: Generate thumbnail
        const thumbnailPath = await videoProcessor.generateThumbnail(processedVideoPath);
        console.log(`Thumbnail generated: ${thumbnailPath}`);
        
        // Step 4: Send to Telegram
        const result = await telegramService.sendVideo({
            videoPath: processedVideoPath,
            thumbnailPath,
            caption,
            buttons
        });
        
        // Clean up temporary files
        await fs.remove(videoPath);
        await fs.remove(processedVideoPath);
        await fs.remove(thumbnailPath);
        
        res.json({
            success: true,
            telegramMessageId: result.message_id,
            message: 'Video processed and sent successfully'
        });
        
    } catch (error) {
        console.error('Error processing video:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Search videos in Google Drive
app.get('/search-videos', async (req, res) => {
    try {
        const { folderId } = req.query;
        const videos = await googleDriveService.searchVideos(folderId);
        
        res.json({
            success: true,
            videos
        });
        
    } catch (error) {
        console.error('Error searching videos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Trigger automatic video processing workflow
app.post('/workflow/auto-process', async (req, res) => {
    try {
        const { folderId, chatId } = req.body;
        
        console.log('Starting automatic video processing workflow');
        
        // Search for new videos
        const videos = await googleDriveService.searchVideos(folderId);
        
        const results = [];
        for (const video of videos) {
            try {
                const result = await processVideoWorkflow(video.id, video.name);
                results.push({ video: video.name, success: true, result });
            } catch (error) {
                console.error(`Error processing ${video.name}:`, error);
                results.push({ video: video.name, success: false, error: error.message });
            }
        }
        
        res.json({
            success: true,
            processedVideos: results.length,
            results
        });
        
    } catch (error) {
        console.error('Error in workflow:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

async function processVideoWorkflow(fileId, fileName) {
    // Download video from Google Drive
    const videoPath = await googleDriveService.downloadFile(fileId);
    
    // Process video for streaming
    const processedVideoPath = await videoProcessor.processForStreaming(videoPath);
    
    // Generate thumbnail
    const thumbnailPath = await videoProcessor.generateThumbnail(processedVideoPath);
    
    // Send to Telegram
    const result = await telegramService.sendVideo({
        videoPath: processedVideoPath,
        thumbnailPath,
        caption: `📹 ${fileName}\n\n#video #auto_processed`,
        buttons: [
            [{ text: '👍 Like', callback_data: `like_${fileId}` }],
            [{ text: '📤 Share', callback_data: `share_${fileId}` }]
        ]
    });
    
    // Clean up
    await fs.remove(videoPath);
    await fs.remove(processedVideoPath);
    await fs.remove(thumbnailPath);
    
    return result;
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Telegram Manager Updater server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;