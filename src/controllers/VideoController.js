const path = require('path');
const fs = require('fs');

class VideoController {
    constructor(telegramService, videoProcessor, googleDriveService) {
        this.telegramService = telegramService;
        this.videoProcessor = videoProcessor;
        this.googleDriveService = googleDriveService;
        
        // In-memory job tracking (in production, use Redis or database)
        this.jobs = new Map();
    }
    
    /**
     * Process video workflow: download -> process -> send to Telegram
     */
    async processVideo(req, res) {
        try {
            const { videoUrl, chatId, caption, buttons, options = {} } = req.body;
            
            if (!videoUrl || !chatId) {
                return res.status(400).json({
                    error: 'videoUrl and chatId are required'
                });
            }
            
            // Create job ID
            const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Initialize job status
            this.jobs.set(jobId, {
                status: 'started',
                progress: 0,
                message: 'Starting video processing...',
                startTime: new Date()
            });
            
            // Start processing asynchronously
            this.processVideoAsync(jobId, { videoUrl, chatId, caption, buttons, options })
                .catch(error => {
                    console.error(`Error in async processing for job ${jobId}:`, error);
                    this.updateJobStatus(jobId, 'error', 100, error.message);
                });
            
            res.json({
                success: true,
                jobId,
                message: 'Video processing started',
                statusUrl: `/api/status/${jobId}`
            });
            
        } catch (error) {
            console.error('Error in processVideo:', error);
            res.status(500).json({
                error: 'Failed to start video processing',
                details: error.message
            });
        }
    }
    
    /**
     * Async video processing workflow
     */
    async processVideoAsync(jobId, { videoUrl, chatId, caption, buttons, options }) {
        let downloadedPath = null;
        let processedPath = null;
        let thumbnailPath = null;
        
        try {
            // Step 1: Download video
            this.updateJobStatus(jobId, 'downloading', 10, 'Downloading video...');
            
            const fileId = this.googleDriveService.extractFileIdFromUrl(videoUrl);
            if (!fileId) {
                throw new Error('Invalid Google Drive URL');
            }
            
            const videoInfo = await this.googleDriveService.getVideoInfo(fileId);
            const fileName = this.videoProcessor.getUniqueFilename(videoInfo.name);
            
            downloadedPath = await this.googleDriveService.downloadVideo(fileId, fileName);
            
            // Step 2: Check if processing needed
            this.updateJobStatus(jobId, 'analyzing', 30, 'Analyzing video format...');
            
            const needsProcessing = await this.videoProcessor.needsProcessing(downloadedPath);
            let finalVideoPath = downloadedPath;
            
            if (needsProcessing) {
                // Step 3: Process video for streaming
                this.updateJobStatus(jobId, 'processing', 50, 'Processing video for streaming...');
                
                const processedFileName = `processed_${fileName}`;
                processedPath = path.join(this.videoProcessor.outputDir, processedFileName);
                
                finalVideoPath = await this.videoProcessor.processForStreaming(
                    downloadedPath,
                    processedPath
                );
            }
            
            // Step 4: Generate thumbnail
            this.updateJobStatus(jobId, 'thumbnail', 70, 'Generating thumbnail...');
            
            const thumbnailFileName = `thumb_${path.parse(fileName).name}.jpg`;
            thumbnailPath = path.join(this.videoProcessor.tempDir, thumbnailFileName);
            
            await this.videoProcessor.generateThumbnail(finalVideoPath, thumbnailPath);
            
            // Step 5: Get video metadata
            const metadata = await this.videoProcessor.getVideoMetadata(finalVideoPath);
            
            // Step 6: Send to Telegram
            this.updateJobStatus(jobId, 'uploading', 90, 'Sending to Telegram...');
            
            const telegramOptions = {
                caption: caption || videoInfo.name,
                duration: Math.round(metadata.duration),
                width: metadata.video?.width,
                height: metadata.video?.height,
                thumbnailPath: thumbnailPath,
                buttons: buttons
            };
            
            const result = await this.telegramService.sendVideoWithStreaming(
                chatId,
                finalVideoPath,
                telegramOptions
            );
            
            // Step 7: Complete
            this.updateJobStatus(jobId, 'completed', 100, 'Video sent successfully!', {
                telegramMessageId: result.message_id,
                videoInfo: {
                    name: videoInfo.name,
                    size: fs.statSync(finalVideoPath).size,
                    duration: metadata.duration,
                    resolution: `${metadata.video?.width}x${metadata.video?.height}`
                }
            });
            
        } catch (error) {
            console.error(`Processing error for job ${jobId}:`, error);
            this.updateJobStatus(jobId, 'error', 100, error.message);
            
            // Send error to Telegram if chat ID is valid
            try {
                await this.telegramService.sendError(chatId, error.message);
            } catch (telegramError) {
                console.error('Failed to send error to Telegram:', telegramError);
            }
        } finally {
            // Cleanup temporary files
            const filesToClean = [downloadedPath, processedPath, thumbnailPath].filter(Boolean);
            if (filesToClean.length > 0) {
                setTimeout(() => {
                    this.videoProcessor.cleanup(filesToClean);
                }, 300000); // Cleanup after 5 minutes
            }
        }
    }
    
    /**
     * Search videos in Google Drive
     */
    async searchVideos(req, res) {
        try {
            const { query, folderId, limit = 10 } = req.body;
            
            const videos = await this.googleDriveService.searchVideos(query, {
                folderId,
                limit: parseInt(limit)
            });
            
            res.json({
                success: true,
                videos: videos.map(video => ({
                    id: video.id,
                    name: video.name,
                    size: video.size,
                    sizeFormatted: this.formatFileSize(video.size),
                    mimeType: video.mimeType,
                    modifiedTime: video.modifiedTime,
                    downloadUrl: video.downloadUrl,
                    thumbnailLink: video.thumbnailLink
                }))
            });
            
        } catch (error) {
            console.error('Error in searchVideos:', error);
            res.status(500).json({
                error: 'Failed to search videos',
                details: error.message
            });
        }
    }
    
    /**
     * Get job status
     */
    async getJobStatus(req, res) {
        try {
            const { jobId } = req.params;
            
            const job = this.jobs.get(jobId);
            if (!job) {
                return res.status(404).json({
                    error: 'Job not found'
                });
            }
            
            res.json({
                success: true,
                jobId,
                ...job,
                duration: Date.now() - job.startTime.getTime()
            });
            
        } catch (error) {
            console.error('Error in getJobStatus:', error);
            res.status(500).json({
                error: 'Failed to get job status',
                details: error.message
            });
        }
    }
    
    /**
     * Webhook endpoint for N8N integration
     */
    async webhookProcessVideo(req, res) {
        try {
            const data = req.body;
            
            // Extract data from N8N webhook format
            const videoUrl = data.videoUrl || data.video_url || data.url;
            const chatId = data.chatId || data.chat_id || data.telegram_chat_id;
            const caption = data.caption || data.message || '';
            const buttons = data.buttons || data.inline_buttons || [];
            
            if (!videoUrl || !chatId) {
                return res.status(400).json({
                    error: 'videoUrl and chatId are required in webhook payload'
                });
            }
            
            // Process video
            const result = await this.processVideo({
                body: { videoUrl, chatId, caption, buttons }
            }, {
                json: (data) => data,
                status: (code) => ({ json: (data) => data })
            });
            
            res.json({
                success: true,
                message: 'Webhook processed successfully',
                data: result
            });
            
        } catch (error) {
            console.error('Error in webhookProcessVideo:', error);
            res.status(500).json({
                error: 'Webhook processing failed',
                details: error.message
            });
        }
    }
    
    /**
     * Update job status
     */
    updateJobStatus(jobId, status, progress, message, data = {}) {
        const job = this.jobs.get(jobId) || {};
        this.jobs.set(jobId, {
            ...job,
            status,
            progress,
            message,
            lastUpdate: new Date(),
            ...data
        });
        
        console.log(`Job ${jobId}: ${status} - ${progress}% - ${message}`);
    }
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = VideoController;