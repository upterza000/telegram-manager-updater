#!/usr/bin/env node

/**
 * Test setup script to validate the application configuration
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

async function testSetup() {
    console.log('🧪 Testing Telegram Manager Updater Setup...\n');

    // Test 1: Check required directories
    console.log('📁 Checking directories...');
    const dirs = ['src', 'src/services', 'src/utils', 'src/workflows', 'config', 'temp'];
    
    for (const dir of dirs) {
        if (await fs.pathExists(dir)) {
            console.log(`  ✅ ${dir} - exists`);
        } else {
            console.log(`  ❌ ${dir} - missing`);
        }
    }

    // Test 2: Check required files
    console.log('\n📄 Checking core files...');
    const files = [
        'src/index.js',
        'src/services/videoProcessor.js',
        'src/services/googleDriveService.js', 
        'src/services/telegramService.js',
        'src/utils/helpers.js',
        'src/workflows/video-processing-workflow.json',
        'package.json',
        'Dockerfile',
        'docker-compose.yml',
        '.env.example'
    ];

    for (const file of files) {
        if (await fs.pathExists(file)) {
            console.log(`  ✅ ${file} - exists`);
        } else {
            console.log(`  ❌ ${file} - missing`);
        }
    }

    // Test 3: Check package.json
    console.log('\n📦 Checking package.json...');
    try {
        const pkg = await fs.readJson('package.json');
        const requiredDeps = [
            'express', 'cors', 'dotenv', 'axios', 'form-data',
            'fluent-ffmpeg', 'googleapis', 'node-telegram-bot-api',
            'fs-extra', 'uuid'
        ];

        for (const dep of requiredDeps) {
            if (pkg.dependencies[dep]) {
                console.log(`  ✅ ${dep} - ${pkg.dependencies[dep]}`);
            } else {
                console.log(`  ❌ ${dep} - missing`);
            }
        }
    } catch (error) {
        console.log(`  ❌ Error reading package.json: ${error.message}`);
    }

    // Test 4: Check environment configuration
    console.log('\n🔧 Checking environment configuration...');
    const requiredEnvVars = [
        'PORT', 'NODE_ENV', 'TEMP_DIR', 'FFMPEG_PATH', 'FFPROBE_PATH'
    ];
    
    const optionalEnvVars = [
        'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID',
        'GOOGLE_DRIVE_FOLDER_ID', 'GOOGLE_DRIVE_CREDENTIALS_PATH'
    ];

    // Load .env file if it exists
    if (await fs.pathExists('.env')) {
        require('dotenv').config();
        console.log('  ✅ .env file loaded');
    } else {
        console.log('  ⚠️ .env file not found (using .env.example)');
    }

    for (const envVar of requiredEnvVars) {
        if (process.env[envVar]) {
            console.log(`  ✅ ${envVar} - set`);
        } else {
            console.log(`  ⚠️ ${envVar} - not set (using defaults)`);
        }
    }

    for (const envVar of optionalEnvVars) {
        if (process.env[envVar]) {
            console.log(`  ✅ ${envVar} - configured`);
        } else {
            console.log(`  ❌ ${envVar} - not configured (required for production)`);
        }
    }

    // Test 5: Test application startup
    console.log('\n🚀 Testing application startup...');
    
    try {
        // Start server in background
        const { spawn } = require('child_process');
        const server = spawn('node', ['src/index.js'], {
            stdio: 'pipe',
            env: { ...process.env, PORT: '3001' } // Use different port
        });

        let serverReady = false;
        let output = '';

        server.stdout.on('data', (data) => {
            output += data.toString();
            if (output.includes('running on port')) {
                serverReady = true;
            }
        });

        server.stderr.on('data', (data) => {
            output += data.toString();
        });

        // Wait for server to start
        for (let i = 0; i < 20; i++) {
            if (serverReady) break;
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (serverReady) {
            console.log('  ✅ Server started successfully');
            
            // Test health endpoint
            try {
                const response = await axios.get('http://localhost:3001/health', { timeout: 5000 });
                if (response.data.status === 'healthy') {
                    console.log('  ✅ Health endpoint working');
                } else {
                    console.log('  ❌ Health endpoint returned unexpected data');
                }
            } catch (error) {
                console.log(`  ❌ Health endpoint failed: ${error.message}`);
            }
        } else {
            console.log('  ❌ Server failed to start');
            console.log(`  Output: ${output}`);
        }

        server.kill();
    } catch (error) {
        console.log(`  ❌ Server test failed: ${error.message}`);
    }

    // Test 6: Check N8N workflow
    console.log('\n🔄 Checking N8N workflow...');
    try {
        const workflow = await fs.readJson('src/workflows/video-processing-workflow.json');
        if (workflow.nodes && workflow.connections) {
            console.log(`  ✅ Workflow has ${workflow.nodes.length} nodes`);
            console.log('  ✅ Workflow structure valid');
        } else {
            console.log('  ❌ Invalid workflow structure');
        }
    } catch (error) {
        console.log(`  ❌ Workflow validation failed: ${error.message}`);
    }

    console.log('\n🎉 Setup test completed!');
    console.log('\n📋 Next steps for production deployment:');
    console.log('1. Set up Telegram bot token (TELEGRAM_BOT_TOKEN)');
    console.log('2. Configure Google Drive credentials');
    console.log('3. Set target folder ID (GOOGLE_DRIVE_FOLDER_ID)');
    console.log('4. Import N8N workflow from src/workflows/');
    console.log('5. Deploy using Docker: docker-compose up -d');
}

if (require.main === module) {
    testSetup().catch(console.error);
}

module.exports = testSetup;