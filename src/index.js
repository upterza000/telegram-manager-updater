const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import services
const TelegramService = require('./services/TelegramService');
const VideoProcessor = require('./services/VideoProcessor');
const GoogleDriveService = require('./services/GoogleDriveService');

// Import controllers
const VideoController = require('./controllers/VideoController');

class TelegramManagerUpdater {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        
        // Initialize services
        this.telegramService = new TelegramService();
        this.videoProcessor = new VideoProcessor();
        this.googleDriveService = new GoogleDriveService();
        
        // Initialize controller
        this.videoController = new VideoController(
            this.telegramService,
            this.videoProcessor,
            this.googleDriveService
        );
        
        this.setupMiddleware();
        this.setupRoutes();
        this.ensureDirectories();
    }
    
    setupMiddleware() {
        this.app.use(express.json({ limit: '100mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '100mb' }));
        
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'OK', timestamp: new Date().toISOString() });
        });
        
        // Video processing endpoints
        this.app.post('/api/process-video', this.videoController.processVideo.bind(this.videoController));
        this.app.post('/api/search-videos', this.videoController.searchVideos.bind(this.videoController));
        this.app.get('/api/status/:jobId', this.videoController.getJobStatus.bind(this.videoController));
        
        // N8N webhook endpoint
        this.app.post('/webhook/process-video', this.videoController.webhookProcessVideo.bind(this.videoController));
    }
    
    ensureDirectories() {
        const dirs = [
            process.env.TEMP_DIR || './temp',
            process.env.OUTPUT_DIR || './output',
            './config'
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log(`🚀 Telegram Manager Updater running on port ${this.port}`);
            console.log(`📋 Health check: http://localhost:${this.port}/health`);
            console.log(`🎬 Video API: http://localhost:${this.port}/api/process-video`);
        });
    }
}

// Start the application
if (require.main === module) {
    const app = new TelegramManagerUpdater();
    app.start();
}

module.exports = TelegramManagerUpdater;