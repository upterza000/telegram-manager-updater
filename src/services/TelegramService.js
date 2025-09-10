const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

class TelegramService {
    constructor() {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            throw new Error('TELEGRAM_BOT_TOKEN is required');
        }
        
        this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50MB default
    }
    
    /**
     * Send video to Telegram with streaming support
     * @param {string} chatId - Telegram chat ID
     * @param {string} videoPath - Path to video file
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - Telegram message object
     */
    async sendVideoWithStreaming(chatId, videoPath, options = {}) {
        try {
            const stats = fs.statSync(videoPath);
            const fileSize = stats.size;
            
            console.log(`Sending video to chat ${chatId}, file size: ${fileSize} bytes`);
            
            if (fileSize > this.maxFileSize) {
                return await this.sendLargeVideo(chatId, videoPath, options);
            }
            
            const videoOptions = {
                caption: options.caption || '',
                supports_streaming: true,
                duration: options.duration,
                width: options.width,
                height: options.height,
                thumbnail: options.thumbnailPath ? fs.createReadStream(options.thumbnailPath) : undefined,
                reply_markup: options.buttons ? this.createInlineKeyboard(options.buttons) : undefined
            };
            
            // Remove undefined properties
            Object.keys(videoOptions).forEach(key => 
                videoOptions[key] === undefined && delete videoOptions[key]
            );
            
            const result = await this.bot.sendVideo(
                chatId,
                fs.createReadStream(videoPath),
                videoOptions
            );
            
            console.log('Video sent successfully');
            return result;
            
        } catch (error) {
            console.error('Error sending video:', error);
            throw error;
        }
    }
    
    /**
     * Handle large video files by splitting or using alternative method
     * @param {string} chatId - Telegram chat ID
     * @param {string} videoPath - Path to video file
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - Telegram message object
     */
    async sendLargeVideo(chatId, videoPath, options = {}) {
        try {
            // For files larger than 50MB, send as document with special message
            console.log('File is larger than 50MB, sending as document with streaming note');
            
            const documentOptions = {
                caption: `📹 ${options.caption || 'Large Video File'}\n\n⚠️ This video is over 50MB. Download to play with full streaming support.`,
                thumbnail: options.thumbnailPath ? fs.createReadStream(options.thumbnailPath) : undefined,
                reply_markup: options.buttons ? this.createInlineKeyboard(options.buttons) : undefined
            };
            
            // Remove undefined properties
            Object.keys(documentOptions).forEach(key => 
                documentOptions[key] === undefined && delete documentOptions[key]
            );
            
            const result = await this.bot.sendDocument(
                chatId,
                fs.createReadStream(videoPath),
                documentOptions
            );
            
            // Send follow-up message with instructions
            await this.bot.sendMessage(
                chatId,
                '💡 To play this video with inline streaming, download it and the video player will support streaming due to the optimized format (faststart enabled).',
                { reply_to_message_id: result.message_id }
            );
            
            return result;
            
        } catch (error) {
            console.error('Error sending large video:', error);
            throw error;
        }
    }
    
    /**
     * Create inline keyboard markup
     * @param {Array} buttons - Array of button objects
     * @returns {Object} - Inline keyboard markup
     */
    createInlineKeyboard(buttons) {
        if (!buttons || !Array.isArray(buttons)) {
            return undefined;
        }
        
        const keyboard = buttons.map(button => {
            const btn = { text: button.text };
            
            if (button.url) {
                btn.url = button.url;
            } else if (button.callback_data) {
                btn.callback_data = button.callback_data;
            }
            
            return [btn];
        });
        
        return {
            inline_keyboard: keyboard
        };
    }
    
    /**
     * Send status message
     * @param {string} chatId - Telegram chat ID
     * @param {string} message - Status message
     * @returns {Promise<Object>} - Telegram message object
     */
    async sendStatus(chatId, message) {
        try {
            return await this.bot.sendMessage(chatId, message);
        } catch (error) {
            console.error('Error sending status message:', error);
            throw error;
        }
    }
    
    /**
     * Send error message
     * @param {string} chatId - Telegram chat ID
     * @param {string} error - Error message
     * @returns {Promise<Object>} - Telegram message object
     */
    async sendError(chatId, error) {
        try {
            const errorMessage = `❌ Error: ${error}`;
            return await this.bot.sendMessage(chatId, errorMessage);
        } catch (error) {
            console.error('Error sending error message:', error);
            throw error;
        }
    }
    
    /**
     * Get bot information
     * @returns {Promise<Object>} - Bot information
     */
    async getBotInfo() {
        try {
            return await this.bot.getMe();
        } catch (error) {
            console.error('Error getting bot info:', error);
            throw error;
        }
    }
    
    /**
     * Validate chat ID exists
     * @param {string} chatId - Telegram chat ID
     * @returns {Promise<boolean>} - True if chat exists
     */
    async validateChatId(chatId) {
        try {
            await this.bot.getChat(chatId);
            return true;
        } catch (error) {
            console.error('Invalid chat ID:', error);
            return false;
        }
    }
}

module.exports = TelegramService;