const fs = require('fs-extra');
const path = require('path');

/**
 * Helper utility functions
 */
class Helpers {
    /**
     * Ensure directory exists, create if it doesn't
     * @param {string} dirPath - Directory path
     */
    static async ensureDir(dirPath) {
        try {
            await fs.ensureDir(dirPath);
        } catch (error) {
            console.error(`Error ensuring directory ${dirPath}:`, error);
            throw error;
        }
    }

    /**
     * Clean up old files in directory based on age
     * @param {string} dirPath - Directory path
     * @param {number} maxAgeHours - Maximum age in hours (default 24)
     */
    static async cleanupOldFiles(dirPath, maxAgeHours = 24) {
        try {
            if (!await fs.pathExists(dirPath)) {
                return;
            }

            const files = await fs.readdir(dirPath);
            const now = new Date();
            const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtime > maxAgeMs) {
                    await fs.remove(filePath);
                    console.log(`🗑️ Cleaned up old file: ${filePath}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning up old files:', error);
        }
    }

    /**
     * Format file size in human readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} - Formatted size string
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format duration in human readable format
     * @param {number} seconds - Duration in seconds
     * @returns {string} - Formatted duration string
     */
    static formatDuration(seconds) {
        if (!seconds || seconds < 0) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Generate safe filename from string
     * @param {string} name - Original name
     * @returns {string} - Safe filename
     */
    static generateSafeFilename(name) {
        return name
            .replace(/[^a-z0-9\-_\.]/gi, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '');
    }

    /**
     * Check if file is a video based on extension and mime type
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     * @returns {boolean} - True if it's a video file
     */
    static isVideoFile(filename, mimeType) {
        const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v'];
        const videoMimeTypes = [
            'video/mp4',
            'video/avi',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-ms-wmv',
            'video/x-flv',
            'video/webm',
            'video/x-matroska'
        ];

        const ext = path.extname(filename).toLowerCase();
        const isVideoExt = videoExtensions.includes(ext);
        const isVideoMime = mimeType && videoMimeTypes.includes(mimeType.toLowerCase());

        return isVideoExt || isVideoMime;
    }

    /**
     * Validate environment variables
     * @returns {Object} - Validation result
     */
    static validateEnvironment() {
        const required = ['TELEGRAM_BOT_TOKEN'];
        const optional = [
            'TELEGRAM_CHAT_ID',
            'GOOGLE_DRIVE_FOLDER_ID',
            'GOOGLE_DRIVE_CREDENTIALS_PATH',
            'PORT',
            'TEMP_DIR',
            'FFMPEG_PATH',
            'FFPROBE_PATH'
        ];

        const missing = [];
        const warnings = [];

        // Check required variables
        required.forEach(varName => {
            if (!process.env[varName]) {
                missing.push(varName);
            }
        });

        // Check optional variables
        optional.forEach(varName => {
            if (!process.env[varName]) {
                warnings.push(varName);
            }
        });

        return {
            isValid: missing.length === 0,
            missing,
            warnings
        };
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} - Promise that resolves after sleep
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retry function with exponential backoff
     * @param {Function} fn - Function to retry
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} baseDelay - Base delay in milliseconds
     * @returns {Promise} - Promise with result or throws error
     */
    static async retry(fn, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (i === maxRetries) {
                    throw error;
                }
                
                const delay = baseDelay * Math.pow(2, i);
                console.log(`Retry attempt ${i + 1}/${maxRetries + 1} after ${delay}ms delay`);
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }

    /**
     * Get current timestamp in ISO format
     * @returns {string} - ISO timestamp
     */
    static getCurrentTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Parse video quality string to dimensions
     * @param {string} quality - Quality string (e.g., '720p', '1080p')
     * @returns {Object} - Width and height object
     */
    static parseVideoQuality(quality) {
        const qualityMap = {
            '240p': { width: 426, height: 240 },
            '360p': { width: 640, height: 360 },
            '480p': { width: 854, height: 480 },
            '720p': { width: 1280, height: 720 },
            '1080p': { width: 1920, height: 1080 },
            '1440p': { width: 2560, height: 1440 },
            '2160p': { width: 3840, height: 2160 }
        };

        return qualityMap[quality] || qualityMap['720p'];
    }
}

module.exports = Helpers;