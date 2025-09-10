const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Complete workflow example for Telegram Video Manager
 * This demonstrates how to use the API to process and send videos
 */

const BASE_URL = 'http://localhost:3000/api';

class TelegramVideoWorkflow {
    constructor() {
        this.baseUrl = BASE_URL;
    }

    /**
     * Example 1: Process video from Google Drive URL
     */
    async processGoogleDriveVideo() {
        try {
            console.log('🎬 Starting Google Drive video processing...');

            const response = await axios.post(`${this.baseUrl}/process-video`, {
                videoUrl: 'https://drive.google.com/file/d/YOUR_FILE_ID/view',
                chatId: 'YOUR_TELEGRAM_CHAT_ID',
                caption: '🎥 Video processed with inline streaming support!\n\n✅ Optimized for Telegram playback',
                buttons: [
                    {
                        text: '🔗 Original File',
                        url: 'https://drive.google.com/file/d/YOUR_FILE_ID/view'
                    },
                    {
                        text: '📊 Processing Info',
                        callback_data: 'processing_info'
                    }
                ]
            });

            console.log('✅ Processing started:', response.data.jobId);

            // Poll for completion
            await this.waitForCompletion(response.data.jobId);

        } catch (error) {
            console.error('❌ Error processing video:', error.response?.data || error.message);
        }
    }

    /**
     * Example 2: Search for videos before processing
     */
    async searchAndProcessVideo() {
        try {
            console.log('🔍 Searching for videos in Google Drive...');

            // Search for videos
            const searchResponse = await axios.post(`${this.baseUrl}/search-videos`, {
                query: 'presentation',
                limit: 5
            });

            const videos = searchResponse.data.videos;
            console.log(`📹 Found ${videos.length} videos:`);

            videos.forEach((video, index) => {
                console.log(`${index + 1}. ${video.name} (${video.sizeFormatted})`);
            });

            if (videos.length > 0) {
                // Process the first video found
                const selectedVideo = videos[0];
                console.log(`\n🎬 Processing: ${selectedVideo.name}`);

                const processResponse = await axios.post(`${this.baseUrl}/process-video`, {
                    videoUrl: selectedVideo.downloadUrl,
                    chatId: 'YOUR_TELEGRAM_CHAT_ID',
                    caption: `📺 ${selectedVideo.name}\n\n🔍 Found via search\n📏 Size: ${selectedVideo.sizeFormatted}`,
                    buttons: [
                        {
                            text: '🎯 View in Drive',
                            url: `https://drive.google.com/file/d/${selectedVideo.id}/view`
                        }
                    ]
                });

                await this.waitForCompletion(processResponse.data.jobId);
            }

        } catch (error) {
            console.error('❌ Error in search and process:', error.response?.data || error.message);
        }
    }

    /**
     * Example 3: N8N Webhook simulation
     */
    async simulateN8NWebhook() {
        try {
            console.log('🔗 Simulating N8N webhook call...');

            const webhookResponse = await axios.post('http://localhost:3000/webhook/process-video', {
                videoUrl: 'https://drive.google.com/file/d/YOUR_FILE_ID/view',
                chatId: 'YOUR_TELEGRAM_CHAT_ID',
                caption: '🤖 Processed via N8N workflow automation',
                telegram_chat_id: 'YOUR_TELEGRAM_CHAT_ID', // Alternative field name
                video_url: 'https://drive.google.com/file/d/YOUR_FILE_ID/view' // Alternative field name
            });

            console.log('✅ Webhook processed:', webhookResponse.data);

        } catch (error) {
            console.error('❌ Webhook error:', error.response?.data || error.message);
        }
    }

    /**
     * Wait for job completion with status updates
     */
    async waitForCompletion(jobId, maxWaitTime = 300000) {
        console.log(`⏳ Waiting for job completion: ${jobId}`);

        const startTime = Date.now();
        let lastProgress = 0;

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const statusResponse = await axios.get(`${this.baseUrl}/status/${jobId}`);
                const job = statusResponse.data;

                if (job.progress > lastProgress) {
                    console.log(`📊 Progress: ${job.progress}% - ${job.message}`);
                    lastProgress = job.progress;
                }

                if (job.status === 'completed') {
                    console.log('🎉 Job completed successfully!');
                    console.log('📊 Final result:', {
                        telegramMessageId: job.telegramMessageId,
                        videoInfo: job.videoInfo,
                        duration: job.duration + 'ms'
                    });
                    return job;
                }

                if (job.status === 'error') {
                    throw new Error(`Job failed: ${job.message}`);
                }

                // Wait 2 seconds before next check
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                if (error.response?.status === 404) {
                    console.log('❌ Job not found - may have been cleaned up');
                    return null;
                }
                throw error;
            }
        }

        throw new Error('Job timeout - maximum wait time exceeded');
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await axios.get('http://localhost:3000/health');
            console.log('✅ Service is healthy:', response.data);
            return true;
        } catch (error) {
            console.error('❌ Service health check failed:', error.message);
            return false;
        }
    }

    /**
     * Run all examples
     */
    async runExamples() {
        console.log('🚀 Telegram Video Manager - Complete Workflow Examples\n');

        // Check service health first
        const isHealthy = await this.healthCheck();
        if (!isHealthy) {
            console.log('❌ Service is not running. Please start the service first with: npm start');
            return;
        }

        console.log('\n📝 Available examples:');
        console.log('1. Process Google Drive video');
        console.log('2. Search and process video');
        console.log('3. N8N webhook simulation\n');

        // For demo purposes, we'll just show the workflow structure
        // In real use, you'd need to provide actual credentials and URLs

        console.log('🔧 To use these examples:');
        console.log('1. Set up your .env file with proper credentials');
        console.log('2. Replace YOUR_FILE_ID and YOUR_TELEGRAM_CHAT_ID with actual values');
        console.log('3. Start the service: npm start');
        console.log('4. Run: node examples/complete-workflow.js');
    }
}

// CLI execution
if (require.main === module) {
    const workflow = new TelegramVideoWorkflow();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'health':
            workflow.healthCheck();
            break;
        case 'process':
            workflow.processGoogleDriveVideo();
            break;
        case 'search':
            workflow.searchAndProcessVideo();
            break;
        case 'webhook':
            workflow.simulateN8NWebhook();
            break;
        default:
            workflow.runExamples();
    }
}

module.exports = TelegramVideoWorkflow;