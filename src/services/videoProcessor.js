const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

class VideoProcessor {
    constructor() {
        // Set ffmpeg and ffprobe paths
        if (process.env.FFMPEG_PATH) {
            ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
        }
        if (process.env.FFPROBE_PATH) {
            ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
        }
        
        this.tempDir = process.env.TEMP_DIR || './temp';
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 209715200; // 200MB default
    }

    /**
     * Process video for streaming with faststart
     * @param {string} inputPath - Path to input video
     * @returns {Promise<string>} - Path to processed video
     */
    async processForStreaming(inputPath) {
        return new Promise((resolve, reject) => {
            const outputFileName = `processed_${uuidv4()}.mp4`;
            const outputPath = path.join(this.tempDir, outputFileName);
            
            console.log(`Processing video for streaming: ${inputPath} -> ${outputPath}`);
            
            const command = ffmpeg(inputPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .format('mp4')
                .outputOptions([
                    '-movflags', 'faststart', // Enable fast start for streaming
                    '-preset', 'medium',      // Balance between speed and quality
                    '-crf', '23',            // Good quality compression
                    '-maxrate', '2M',        // Maximum bitrate
                    '-bufsize', '4M'         // Buffer size
                ]);
            
            // Add video quality settings based on environment
            const videoQuality = process.env.VIDEO_QUALITY || '720p';
            if (videoQuality === '720p') {
                command.size('1280x720');
            } else if (videoQuality === '480p') {
                command.size('854x480');
            } else if (videoQuality === '1080p') {
                command.size('1920x1080');
            }
            
            command
                .output(outputPath)
                .on('start', (commandLine) => {
                    console.log('FFmpeg command:', commandLine);
                })
                .on('progress', (progress) => {
                    console.log(`Processing: ${Math.round(progress.percent || 0)}% done`);
                })
                .on('end', () => {
                    console.log('Video processing completed successfully');
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error('Error processing video:', err);
                    reject(err);
                });
            
            command.run();
        });
    }

    /**
     * Generate thumbnail from video
     * @param {string} videoPath - Path to video file
     * @returns {Promise<string>} - Path to generated thumbnail
     */
    async generateThumbnail(videoPath) {
        return new Promise((resolve, reject) => {
            const thumbnailFileName = `thumb_${uuidv4()}.jpg`;
            const thumbnailPath = path.join(this.tempDir, thumbnailFileName);
            
            console.log(`Generating thumbnail: ${videoPath} -> ${thumbnailPath}`);
            
            const thumbnailSize = process.env.THUMBNAIL_SIZE || '320x240';
            
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: ['10%'], // Take screenshot at 10% of video duration
                    filename: thumbnailFileName,
                    folder: this.tempDir,
                    size: thumbnailSize
                })
                .on('end', () => {
                    console.log('Thumbnail generated successfully');
                    resolve(thumbnailPath);
                })
                .on('error', (err) => {
                    console.error('Error generating thumbnail:', err);
                    reject(err);
                });
        });
    }

    /**
     * Get video information
     * @param {string} videoPath - Path to video file
     * @returns {Promise<Object>} - Video metadata
     */
    async getVideoInfo(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) {
                    reject(err);
                } else {
                    const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                    const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
                    
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
                            sampleRate: audioStream.sample_rate,
                            channels: audioStream.channels
                        } : null
                    });
                }
            });
        });
    }

    /**
     * Check if file size is within Telegram limits
     * @param {string} filePath - Path to file
     * @returns {Promise<boolean>} - True if file is within limits
     */
    async checkFileSize(filePath) {
        const stats = await fs.stat(filePath);
        const fileSizeInBytes = stats.size;
        const maxSizeInBytes = 50 * 1024 * 1024; // 50MB Telegram limit
        
        console.log(`File size: ${fileSizeInBytes} bytes (${(fileSizeInBytes / 1024 / 1024).toFixed(2)} MB)`);
        
        return fileSizeInBytes <= maxSizeInBytes;
    }

    /**
     * Compress video to fit within size limits
     * @param {string} inputPath - Path to input video
     * @param {number} targetSizeMB - Target size in MB
     * @returns {Promise<string>} - Path to compressed video
     */
    async compressVideo(inputPath, targetSizeMB = 45) {
        return new Promise(async (resolve, reject) => {
            const outputFileName = `compressed_${uuidv4()}.mp4`;
            const outputPath = path.join(this.tempDir, outputFileName);
            
            try {
                const videoInfo = await this.getVideoInfo(inputPath);
                const duration = videoInfo.duration;
                const targetBitrate = Math.floor((targetSizeMB * 8 * 1024) / duration); // Kbps
                
                console.log(`Compressing video to ${targetSizeMB}MB (target bitrate: ${targetBitrate}k)`);
                
                ffmpeg(inputPath)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .videoBitrate(`${targetBitrate}k`)
                    .audioBitrate('128k')
                    .format('mp4')
                    .outputOptions([
                        '-movflags', 'faststart',
                        '-preset', 'fast',
                        '-crf', '28'
                    ])
                    .output(outputPath)
                    .on('progress', (progress) => {
                        console.log(`Compressing: ${Math.round(progress.percent || 0)}% done`);
                    })
                    .on('end', () => {
                        console.log('Video compression completed');
                        resolve(outputPath);
                    })
                    .on('error', reject)
                    .run();
                    
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = new VideoProcessor();