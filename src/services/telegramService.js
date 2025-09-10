const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const FormData = require('form-data');
const axios = require('axios');

class TelegramService {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.defaultChatId = process.env.TELEGRAM_CHAT_ID;
        
        if (!this.botToken) {
            console.warn('⚠️ TELEGRAM_BOT_TOKEN not set. Telegram features will not work.');
            return;
        }
        
        this.bot = new TelegramBot(this.botToken, { polling: false });
        this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
        
        console.log('✅ Telegram bot initialized');
    }

    /**
     * Send video to Telegram with streaming support
     * @param {Object} options - Video sending options
     * @param {string} options.videoPath - Path to video file
     * @param {string} options.thumbnailPath - Path to thumbnail file (optional)
     * @param {string} options.caption - Video caption (optional)
     * @param {Array} options.buttons - Inline keyboard buttons (optional)
     * @param {string} options.chatId - Chat ID (optional, uses default if not provided)
     * @returns {Promise<Object>} - Telegram API response
     */
    async sendVideo(options) {
        if (!this.bot) {
            throw new Error('Telegram bot not initialized. Check TELEGRAM_BOT_TOKEN.');
        }

        const {
            videoPath,
            thumbnailPath,
            caption,
            buttons,
            chatId = this.defaultChatId
        } = options;

        if (!chatId) {
            throw new Error('No chat ID provided. Set TELEGRAM_CHAT_ID or pass chatId parameter.');
        }

        try {
            console.log(`📤 Sending video to Telegram: ${videoPath}`);
            
            // Check if video file exists
            if (!await fs.pathExists(videoPath)) {
                throw new Error(`Video file not found: ${videoPath}`);
            }

            // Get file size
            const videoStats = await fs.stat(videoPath);
            const videoSize = videoStats.size;
            const videoSizeMB = (videoSize / (1024 * 1024)).toFixed(2);
            
            console.log(`📹 Video size: ${videoSizeMB} MB`);

            // Check Telegram file size limits
            const maxSize = 50 * 1024 * 1024; // 50MB limit for Telegram
            if (videoSize > maxSize) {
                throw new Error(`Video size (${videoSizeMB} MB) exceeds Telegram limit (50 MB)`);
            }

            // Prepare form data for multipart upload
            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('video', fs.createReadStream(videoPath));
            formData.append('supports_streaming', 'true'); // Enable streaming support
            
            // Add thumbnail if provided
            if (thumbnailPath && await fs.pathExists(thumbnailPath)) {
                console.log(`🖼️ Adding thumbnail: ${thumbnailPath}`);
                formData.append('thumb', fs.createReadStream(thumbnailPath));
            }

            // Add caption if provided
            if (caption) {
                formData.append('caption', caption);
                formData.append('parse_mode', 'HTML');
            }

            // Add inline keyboard if buttons provided
            if (buttons && buttons.length > 0) {
                const replyMarkup = {
                    inline_keyboard: buttons
                };
                formData.append('reply_markup', JSON.stringify(replyMarkup));
            }

            // Additional video parameters
            formData.append('duration', '0'); // Let Telegram auto-detect
            formData.append('width', '0');    // Let Telegram auto-detect
            formData.append('height', '0');   // Let Telegram auto-detect

            console.log('🚀 Uploading video to Telegram...');
            
            // Send video using direct API call for better control
            const response = await axios.post(
                `${this.apiUrl}/sendVideo`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 300000, // 5 minutes timeout
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            console.log(`📤 Upload progress: ${percentCompleted}%`);
                        }
                    }
                }
            );

            if (response.data.ok) {
                console.log('✅ Video sent successfully to Telegram');
                return response.data.result;
            } else {
                throw new Error(`Telegram API error: ${response.data.description}`);
            }

        } catch (error) {
            console.error('❌ Error sending video to Telegram:', error.message);
            throw error;
        }
    }

    /**
     * Send message to Telegram
     * @param {string} text - Message text
     * @param {string} chatId - Chat ID (optional)
     * @param {Array} buttons - Inline keyboard buttons (optional)
     * @returns {Promise<Object>} - Telegram API response
     */
    async sendMessage(text, chatId = null, buttons = null) {
        if (!this.bot) {
            throw new Error('Telegram bot not initialized. Check TELEGRAM_BOT_TOKEN.');
        }

        const targetChatId = chatId || this.defaultChatId;
        if (!targetChatId) {
            throw new Error('No chat ID provided. Set TELEGRAM_CHAT_ID or pass chatId parameter.');
        }

        try {
            const options = {
                parse_mode: 'HTML'
            };

            if (buttons && buttons.length > 0) {
                options.reply_markup = {
                    inline_keyboard: buttons
                };
            }

            const result = await this.bot.sendMessage(targetChatId, text, options);
            console.log('✅ Message sent to Telegram');
            return result;

        } catch (error) {
            console.error('❌ Error sending message to Telegram:', error.message);
            throw error;
        }
    }

    /**
     * Send document to Telegram
     * @param {string} filePath - Path to document
     * @param {string} caption - Document caption (optional)
     * @param {string} chatId - Chat ID (optional)
     * @returns {Promise<Object>} - Telegram API response
     */
    async sendDocument(filePath, caption = null, chatId = null) {
        if (!this.bot) {
            throw new Error('Telegram bot not initialized. Check TELEGRAM_BOT_TOKEN.');
        }

        const targetChatId = chatId || this.defaultChatId;
        if (!targetChatId) {
            throw new Error('No chat ID provided. Set TELEGRAM_CHAT_ID or pass chatId parameter.');
        }

        try {
            const options = {};
            if (caption) {
                options.caption = caption;
                options.parse_mode = 'HTML';
            }

            const result = await this.bot.sendDocument(targetChatId, filePath, options);
            console.log('✅ Document sent to Telegram');
            return result;

        } catch (error) {
            console.error('❌ Error sending document to Telegram:', error.message);
            throw error;
        }
    }

    /**
     * Answer callback query
     * @param {string} callbackQueryId - Callback query ID
     * @param {string} text - Text to show (optional)
     * @param {boolean} showAlert - Show as alert (optional)
     * @returns {Promise<boolean>} - Success status
     */
    async answerCallbackQuery(callbackQueryId, text = null, showAlert = false) {
        if (!this.bot) {
            throw new Error('Telegram bot not initialized. Check TELEGRAM_BOT_TOKEN.');
        }

        try {
            const options = {};
            if (text) options.text = text;
            if (showAlert) options.show_alert = true;

            await this.bot.answerCallbackQuery(callbackQueryId, options);
            return true;

        } catch (error) {
            console.error('❌ Error answering callback query:', error.message);
            return false;
        }
    }

    /**
     * Get bot information
     * @returns {Promise<Object>} - Bot information
     */
    async getBotInfo() {
        if (!this.bot) {
            throw new Error('Telegram bot not initialized. Check TELEGRAM_BOT_TOKEN.');
        }

        try {
            const botInfo = await this.bot.getMe();
            return botInfo;
        } catch (error) {
            console.error('❌ Error getting bot info:', error.message);
            throw error;
        }
    }

    /**
     * Get chat information
     * @param {string} chatId - Chat ID
     * @returns {Promise<Object>} - Chat information
     */
    async getChatInfo(chatId = null) {
        if (!this.bot) {
            throw new Error('Telegram bot not initialized. Check TELEGRAM_BOT_TOKEN.');
        }

        const targetChatId = chatId || this.defaultChatId;
        if (!targetChatId) {
            throw new Error('No chat ID provided. Set TELEGRAM_CHAT_ID or pass chatId parameter.');
        }

        try {
            const chatInfo = await this.bot.getChat(targetChatId);
            return chatInfo;
        } catch (error) {
            console.error('❌ Error getting chat info:', error.message);
            throw error;
        }
    }

    /**
     * Check if service is ready
     * @returns {boolean} - True if service is initialized
     */
    isReady() {
        return this.bot !== null && this.botToken !== null;
    }

    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     * @returns {string} - Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = new TelegramService();