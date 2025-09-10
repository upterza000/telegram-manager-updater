const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class GoogleDriveService {
    constructor() {
        this.drive = null;
        this.tempDir = process.env.TEMP_DIR || './temp';
        this.init();
    }
    
    /**
     * Initialize Google Drive API
     */
    async init() {
        try {
            let auth;
            
            if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
                // Use service account
                const serviceAccountKey = JSON.parse(
                    fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'utf8')
                );
                
                auth = new google.auth.GoogleAuth({
                    credentials: serviceAccountKey,
                    scopes: ['https://www.googleapis.com/auth/drive.readonly']
                });
            } else if (process.env.GOOGLE_DRIVE_API_KEY) {
                // Use API key (limited functionality)
                auth = process.env.GOOGLE_DRIVE_API_KEY;
            } else {
                console.warn('No Google Drive credentials provided. Search functionality will be limited.');
                return;
            }
            
            this.drive = google.drive({ version: 'v3', auth });
            console.log('Google Drive service initialized');
        } catch (error) {
            console.error('Error initializing Google Drive service:', error);
        }
    }
    
    /**
     * Search for videos in Google Drive
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} - Array of video files
     */
    async searchVideos(query, options = {}) {
        if (!this.drive) {
            throw new Error('Google Drive service not initialized');
        }
        
        try {
            const videoMimeTypes = [
                'video/mp4',
                'video/avi',
                'video/mov',
                'video/mkv',
                'video/webm',
                'video/flv'
            ];
            
            const mimeTypeQuery = videoMimeTypes
                .map(type => `mimeType='${type}'`)
                .join(' or ');
            
            let searchQuery = `(${mimeTypeQuery})`;
            
            if (query) {
                searchQuery += ` and name contains '${query}'`;
            }
            
            if (options.folderId) {
                searchQuery += ` and '${options.folderId}' in parents`;
            }
            
            const response = await this.drive.files.list({
                q: searchQuery,
                fields: 'files(id,name,size,mimeType,createdTime,modifiedTime,webViewLink,thumbnailLink)',
                pageSize: options.limit || 10,
                orderBy: options.orderBy || 'modifiedTime desc'
            });
            
            const files = response.data.files || [];
            console.log(`Found ${files.length} videos matching query: ${query}`);
            
            return files.map(file => ({
                id: file.id,
                name: file.name,
                size: parseInt(file.size) || 0,
                mimeType: file.mimeType,
                createdTime: file.createdTime,
                modifiedTime: file.modifiedTime,
                webViewLink: file.webViewLink,
                thumbnailLink: file.thumbnailLink,
                downloadUrl: `https://drive.google.com/uc?id=${file.id}&export=download`
            }));
            
        } catch (error) {
            console.error('Error searching videos:', error);
            throw error;
        }
    }
    
    /**
     * Download video from Google Drive
     * @param {string} fileId - Google Drive file ID
     * @param {string} fileName - Output filename
     * @returns {Promise<string>} - Path to downloaded file
     */
    async downloadVideo(fileId, fileName) {
        if (!this.drive) {
            throw new Error('Google Drive service not initialized');
        }
        
        try {
            const outputPath = path.join(this.tempDir, fileName);
            
            console.log(`Downloading video ${fileId} to ${outputPath}`);
            
            const response = await this.drive.files.get({
                fileId: fileId,
                alt: 'media'
            }, {
                responseType: 'stream'
            });
            
            return new Promise((resolve, reject) => {
                const writeStream = fs.createWriteStream(outputPath);
                let downloadedBytes = 0;
                
                response.data.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    // You could emit progress events here
                });
                
                response.data.on('end', () => {
                    console.log(`Download completed: ${downloadedBytes} bytes`);
                    resolve(outputPath);
                });
                
                response.data.on('error', (error) => {
                    console.error('Download error:', error);
                    reject(error);
                });
                
                response.data.pipe(writeStream);
                
                writeStream.on('error', (error) => {
                    console.error('Write error:', error);
                    reject(error);
                });
            });
            
        } catch (error) {
            console.error('Error downloading video:', error);
            throw error;
        }
    }
    
    /**
     * Download video using direct URL (alternative method)
     * @param {string} url - Direct download URL
     * @param {string} fileName - Output filename
     * @returns {Promise<string>} - Path to downloaded file
     */
    async downloadVideoFromUrl(url, fileName) {
        try {
            const outputPath = path.join(this.tempDir, fileName);
            
            console.log(`Downloading video from URL to ${outputPath}`);
            
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream'
            });
            
            return new Promise((resolve, reject) => {
                const writeStream = fs.createWriteStream(outputPath);
                let downloadedBytes = 0;
                
                response.data.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                });
                
                response.data.on('end', () => {
                    console.log(`Download completed: ${downloadedBytes} bytes`);
                    resolve(outputPath);
                });
                
                response.data.on('error', (error) => {
                    console.error('Download error:', error);
                    reject(error);
                });
                
                response.data.pipe(writeStream);
                
                writeStream.on('error', (error) => {
                    console.error('Write error:', error);
                    reject(error);
                });
            });
            
        } catch (error) {
            console.error('Error downloading video from URL:', error);
            throw error;
        }
    }
    
    /**
     * Get video file info
     * @param {string} fileId - Google Drive file ID
     * @returns {Promise<Object>} - File information
     */
    async getVideoInfo(fileId) {
        if (!this.drive) {
            throw new Error('Google Drive service not initialized');
        }
        
        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'id,name,size,mimeType,createdTime,modifiedTime,webViewLink,thumbnailLink'
            });
            
            return response.data;
        } catch (error) {
            console.error('Error getting video info:', error);
            throw error;
        }
    }
    
    /**
     * Extract file ID from Google Drive URL
     * @param {string} url - Google Drive URL
     * @returns {string|null} - File ID or null if not found
     */
    extractFileIdFromUrl(url) {
        const patterns = [
            /\/file\/d\/([a-zA-Z0-9-_]+)/,
            /id=([a-zA-Z0-9-_]+)/,
            /\/open\?id=([a-zA-Z0-9-_]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    }
}

module.exports = GoogleDriveService;