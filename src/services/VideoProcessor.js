const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

class VideoProcessor {
    constructor() {
        // Set ffmpeg paths if specified
        if (process.env.FFMPEG_PATH) {
            ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
        }
        if (process.env.FFPROBE_PATH) {
            ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
        }
        
        this.tempDir = process.env.TEMP_DIR || './temp';
        this.outputDir = process.env.OUTPUT_DIR || './output';
    }
    
    /**
     * Process video for Telegram streaming (add faststart)
     * @param {string} inputPath - Path to input video file
     * @param {string} outputPath - Path for output video file
     * @returns {Promise<string>} - Path to processed video
     */
    async processForStreaming(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            console.log(`Processing video for streaming: ${inputPath}`);
            
            ffmpeg(inputPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .format('mp4')
                // Critical: Add faststart for inline playback in Telegram
                .outputOptions([
                    '-movflags', '+faststart',
                    '-preset', 'medium',
                    '-crf', '23'
                ])
                .output(outputPath)
                .on('start', (commandLine) => {
                    console.log('FFmpeg command: ' + commandLine);
                })
                .on('progress', (progress) => {
                    console.log(`Processing: ${progress.percent}% done`);
                })
                .on('end', () => {
                    console.log('Video processing completed');
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error('Error processing video:', err);
                    reject(err);
                })
                .run();
        });
    }
    
    /**
     * Generate thumbnail from video
     * @param {string} videoPath - Path to video file
     * @param {string} thumbnailPath - Path for thumbnail output
     * @param {number} timeOffset - Time offset in seconds (default: 5)
     * @returns {Promise<string>} - Path to thumbnail
     */
    async generateThumbnail(videoPath, thumbnailPath, timeOffset = 5) {
        return new Promise((resolve, reject) => {
            console.log(`Generating thumbnail: ${videoPath}`);
            
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: [timeOffset],
                    filename: path.basename(thumbnailPath),
                    folder: path.dirname(thumbnailPath),
                    size: '320x240'
                })
                .on('end', () => {
                    console.log('Thumbnail generated');
                    resolve(thumbnailPath);
                })
                .on('error', (err) => {
                    console.error('Error generating thumbnail:', err);
                    reject(err);
                });
        });
    }
    
    /**
     * Get video metadata
     * @param {string} videoPath - Path to video file
     * @returns {Promise<Object>} - Video metadata
     */
    async getVideoMetadata(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) {
                    reject(err);
                } else {
                    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                    const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
                    
                    resolve({
                        duration: metadata.format.duration,
                        size: metadata.format.size,
                        bitrate: metadata.format.bit_rate,
                        video: videoStream ? {
                            codec: videoStream.codec_name,
                            width: videoStream.width,
                            height: videoStream.height,
                            fps: eval(videoStream.r_frame_rate)
                        } : null,
                        audio: audioStream ? {
                            codec: audioStream.codec_name,
                            bitrate: audioStream.bit_rate
                        } : null
                    });
                }
            });
        });
    }
    
    /**
     * Check if video needs processing for Telegram streaming
     * @param {string} videoPath - Path to video file
     * @returns {Promise<boolean>} - True if processing needed
     */
    async needsProcessing(videoPath) {
        try {
            const metadata = await this.getVideoMetadata(videoPath);
            
            // Check if it's already MP4 with proper encoding
            if (path.extname(videoPath).toLowerCase() === '.mp4') {
                // Additional checks could be added here to verify faststart flag
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking video metadata:', error);
            return true; // Process if we can't determine
        }
    }
    
    /**
     * Get unique output filename
     * @param {string} originalName - Original filename
     * @returns {string} - Unique filename
     */
    getUniqueFilename(originalName) {
        const timestamp = Date.now();
        const baseName = path.parse(originalName).name;
        return `${baseName}_${timestamp}.mp4`;
    }
    
    /**
     * Clean up temporary files
     * @param {string[]} filePaths - Array of file paths to clean up
     */
    async cleanup(filePaths) {
        for (const filePath of filePaths) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Cleaned up: ${filePath}`);
                }
            } catch (error) {
                console.error(`Error cleaning up ${filePath}:`, error);
            }
        }
    }
}

module.exports = VideoProcessor;