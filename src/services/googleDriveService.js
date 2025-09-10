const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class GoogleDriveService {
    constructor() {
        this.tempDir = process.env.TEMP_DIR || './temp';
        this.credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || './config/google-credentials.json';
        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        
        this.drive = null;
        this.auth = null;
        
        this.initializeAuth();
    }

    /**
     * Initialize Google Drive authentication
     */
    async initializeAuth() {
        try {
            // Check if credentials file exists
            if (await fs.pathExists(this.credentialsPath)) {
                const credentials = await fs.readJson(this.credentialsPath);
                
                // Create auth client
                this.auth = new google.auth.GoogleAuth({
                    keyFile: this.credentialsPath,
                    scopes: ['https://www.googleapis.com/auth/drive.readonly']
                });
                
                // Initialize Drive API
                this.drive = google.drive({ version: 'v3', auth: this.auth });
                
                console.log('✅ Google Drive authentication initialized');
            } else {
                console.warn('⚠️ Google Drive credentials file not found. Please add credentials to use Google Drive features.');
            }
        } catch (error) {
            console.error('❌ Error initializing Google Drive auth:', error.message);
        }
    }

    /**
     * Search for video files in specified folder
     * @param {string} folderId - Google Drive folder ID (optional, uses env var if not provided)
     * @returns {Promise<Array>} - Array of video files
     */
    async searchVideos(folderId = null) {
        if (!this.drive) {
            throw new Error('Google Drive not initialized. Check credentials.');
        }

        const targetFolderId = folderId || this.folderId;
        if (!targetFolderId) {
            throw new Error('No folder ID provided. Set GOOGLE_DRIVE_FOLDER_ID or pass folderId parameter.');
        }

        try {
            console.log(`🔍 Searching for videos in folder: ${targetFolderId}`);
            
            const response = await this.drive.files.list({
                q: `'${targetFolderId}' in parents and (mimeType contains 'video/' or name contains '.mp4' or name contains '.avi' or name contains '.mov' or name contains '.mkv') and trashed = false`,
                fields: 'files(id, name, size, mimeType, createdTime, modifiedTime)',
                orderBy: 'modifiedTime desc'
            });

            const videos = response.data.files.map(file => ({
                id: file.id,
                name: file.name,
                size: parseInt(file.size) || 0,
                mimeType: file.mimeType,
                createdTime: file.createdTime,
                modifiedTime: file.modifiedTime,
                sizeFormatted: this.formatFileSize(parseInt(file.size) || 0)
            }));

            console.log(`📹 Found ${videos.length} video files`);
            return videos;

        } catch (error) {
            console.error('❌ Error searching videos:', error);
            throw error;
        }
    }

    /**
     * Download file from Google Drive
     * @param {string} fileId - Google Drive file ID
     * @returns {Promise<string>} - Path to downloaded file
     */
    async downloadFile(fileId) {
        if (!this.drive) {
            throw new Error('Google Drive not initialized. Check credentials.');
        }

        try {
            console.log(`⬇️ Downloading file: ${fileId}`);
            
            // Get file metadata first
            const fileMetadata = await this.drive.files.get({
                fileId: fileId,
                fields: 'name, size, mimeType'
            });

            const fileName = fileMetadata.data.name;
            const fileSize = parseInt(fileMetadata.data.size) || 0;
            
            console.log(`📄 File: ${fileName} (${this.formatFileSize(fileSize)})`);
            
            // Check if file is too large
            const maxSize = 200 * 1024 * 1024; // 200MB limit for processing
            if (fileSize > maxSize) {
                console.warn(`⚠️ File size (${this.formatFileSize(fileSize)}) exceeds processing limit (200MB)`);
            }

            // Create unique filename to avoid conflicts
            const ext = path.extname(fileName);
            const baseName = path.basename(fileName, ext);
            const uniqueFileName = `${baseName}_${uuidv4()}${ext}`;
            const outputPath = path.join(this.tempDir, uniqueFileName);

            // Download file
            const response = await this.drive.files.get({
                fileId: fileId,
                alt: 'media'
            }, { responseType: 'stream' });

            // Save to file with progress tracking
            const writer = fs.createWriteStream(outputPath);
            let downloadedBytes = 0;

            response.data.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                const progress = ((downloadedBytes / fileSize) * 100).toFixed(1);
                if (downloadedBytes % (1024 * 1024) === 0 || downloadedBytes === fileSize) { // Log every MB
                    console.log(`📥 Download progress: ${progress}% (${this.formatFileSize(downloadedBytes)}/${this.formatFileSize(fileSize)})`);
                }
            });

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    console.log(`✅ Download completed: ${outputPath}`);
                    resolve(outputPath);
                });
                
                writer.on('error', (error) => {
                    console.error('❌ Download error:', error);
                    reject(error);
                });
            });

        } catch (error) {
            console.error('❌ Error downloading file:', error);
            throw error;
        }
    }

    /**
     * Get file information
     * @param {string} fileId - Google Drive file ID
     * @returns {Promise<Object>} - File information
     */
    async getFileInfo(fileId) {
        if (!this.drive) {
            throw new Error('Google Drive not initialized. Check credentials.');
        }

        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'id, name, size, mimeType, createdTime, modifiedTime, parents, webViewLink'
            });

            const file = response.data;
            return {
                id: file.id,
                name: file.name,
                size: parseInt(file.size) || 0,
                sizeFormatted: this.formatFileSize(parseInt(file.size) || 0),
                mimeType: file.mimeType,
                createdTime: file.createdTime,
                modifiedTime: file.modifiedTime,
                parents: file.parents,
                webViewLink: file.webViewLink
            };

        } catch (error) {
            console.error('❌ Error getting file info:', error);
            throw error;
        }
    }

    /**
     * List files in a folder with pagination
     * @param {string} folderId - Google Drive folder ID
     * @param {string} pageToken - Page token for pagination
     * @returns {Promise<Object>} - Files and pagination info
     */
    async listFiles(folderId, pageToken = null) {
        if (!this.drive) {
            throw new Error('Google Drive not initialized. Check credentials.');
        }

        try {
            const params = {
                q: `'${folderId}' in parents and trashed = false`,
                fields: 'nextPageToken, files(id, name, size, mimeType, createdTime, modifiedTime)',
                orderBy: 'modifiedTime desc',
                pageSize: 100
            };

            if (pageToken) {
                params.pageToken = pageToken;
            }

            const response = await this.drive.files.list(params);
            
            return {
                files: response.data.files.map(file => ({
                    id: file.id,
                    name: file.name,
                    size: parseInt(file.size) || 0,
                    sizeFormatted: this.formatFileSize(parseInt(file.size) || 0),
                    mimeType: file.mimeType,
                    createdTime: file.createdTime,
                    modifiedTime: file.modifiedTime
                })),
                nextPageToken: response.data.nextPageToken
            };

        } catch (error) {
            console.error('❌ Error listing files:', error);
            throw error;
        }
    }

    /**
     * Format file size in human readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} - Formatted size string
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Check if service is ready
     * @returns {boolean} - True if service is initialized
     */
    isReady() {
        return this.drive !== null;
    }
}

module.exports = new GoogleDriveService();