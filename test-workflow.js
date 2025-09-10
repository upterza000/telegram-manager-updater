#!/usr/bin/env node

/**
 * Test script for N8N Telegram Video Processing Workflows
 * This script validates the workflow JSON files for correctness
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\033[0m',
  red: '\033[31m',
  green: '\033[32m',
  yellow: '\033[33m',
  blue: '\033[34m',
  cyan: '\033[36m'
};

function log(color, prefix, message) {
  console.log(`${colors[color]}[${prefix}]${colors.reset} ${message}`);
}

function validateWorkflowJSON(filePath) {
  try {
    log('blue', 'TEST', `Validating ${path.basename(filePath)}...`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      log('red', 'ERROR', `File not found: ${filePath}`);
      return false;
    }
    
    // Read and parse JSON
    const content = fs.readFileSync(filePath, 'utf8');
    const workflow = JSON.parse(content);
    
    // Validate basic structure
    const requiredFields = ['nodes', 'connections'];
    const missingFields = requiredFields.filter(field => !workflow[field]);
    
    if (missingFields.length > 0) {
      log('red', 'ERROR', `Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Check nodes
    if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
      log('red', 'ERROR', 'No nodes found in workflow');
      return false;
    }
    
    log('green', 'INFO', `Found ${workflow.nodes.length} nodes`);
    
    // Validate each node has required properties
    const nodeErrors = [];
    workflow.nodes.forEach((node, index) => {
      const nodeId = node.id || `node-${index}`;
      
      if (!node.type) {
        nodeErrors.push(`Node ${nodeId}: Missing type`);
      }
      
      if (!node.name) {
        nodeErrors.push(`Node ${nodeId}: Missing name`);
      }
      
      if (!Array.isArray(node.position) || node.position.length !== 2) {
        nodeErrors.push(`Node ${nodeId}: Invalid position`);
      }
    });
    
    if (nodeErrors.length > 0) {
      log('red', 'ERROR', 'Node validation errors:');
      nodeErrors.forEach(error => log('red', '  ✗', error));
      return false;
    }
    
    // Check for critical nodes
    const nodeTypes = workflow.nodes.map(node => node.type);
    const criticalNodes = [
      'n8n-nodes-base.webhook',
      'n8n-nodes-base.googleDrive',
      'n8n-nodes-base.telegram',
      'n8n-nodes-base.executeCommand'
    ];
    
    const missingCritical = criticalNodes.filter(type => 
      !nodeTypes.includes(type)
    );
    
    if (missingCritical.length > 0) {
      log('yellow', 'WARN', `Missing recommended nodes: ${missingCritical.join(', ')}`);
    }
    
    // Check connections
    if (typeof workflow.connections !== 'object') {
      log('red', 'ERROR', 'Invalid connections structure');
      return false;
    }
    
    log('green', 'INFO', `Found connections for ${Object.keys(workflow.connections).length} nodes`);
    
    // Validate specific workflow requirements
    const hasWebhookTrigger = workflow.nodes.some(node => 
      node.type === 'n8n-nodes-base.webhook'
    );
    
    const hasGoogleDrive = workflow.nodes.some(node => 
      node.type === 'n8n-nodes-base.googleDrive'
    );
    
    const hasTelegram = workflow.nodes.some(node => 
      node.type === 'n8n-nodes-base.telegram'
    );
    
    const hasFFmpeg = workflow.nodes.some(node => 
      node.type === 'n8n-nodes-base.executeCommand' &&
      node.parameters?.command?.includes('ffmpeg')
    );
    
    // Check for faststart flag
    const hasFaststart = workflow.nodes.some(node =>
      node.parameters?.command?.includes('-movflags +faststart')
    );
    
    const requirements = [
      { check: hasWebhookTrigger, name: 'Webhook trigger' },
      { check: hasGoogleDrive, name: 'Google Drive integration' },
      { check: hasTelegram, name: 'Telegram integration' },
      { check: hasFFmpeg, name: 'FFmpeg processing' },
      { check: hasFaststart, name: 'FFmpeg faststart flag' }
    ];
    
    let allPassed = true;
    requirements.forEach(req => {
      if (req.check) {
        log('green', '  ✓', req.name);
      } else {
        log('red', '  ✗', req.name);
        allPassed = false;
      }
    });
    
    return allPassed;
    
  } catch (error) {
    log('red', 'ERROR', `Failed to validate ${filePath}: ${error.message}`);
    return false;
  }
}

function testWebhookPayload() {
  log('blue', 'TEST', 'Testing webhook payload structure...');
  
  const testPayload = {
    folderId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs67",
    telegramChatId: "123456789",
    limit: 1
  };
  
  const requiredFields = ['folderId', 'telegramChatId'];
  const missing = requiredFields.filter(field => !testPayload[field]);
  
  if (missing.length > 0) {
    log('red', 'ERROR', `Missing required payload fields: ${missing.join(', ')}`);
    return false;
  }
  
  log('green', '  ✓', 'Webhook payload structure is valid');
  return true;
}

function generateUsageExamples() {
  log('cyan', 'EXAMPLES', 'Usage examples:');
  
  const examples = [
    {
      title: 'Basic webhook call',
      command: `curl -X POST http://localhost:5678/webhook/video-process \\
  -H "Content-Type: application/json" \\
  -d '{
    "folderId": "YOUR_GOOGLE_DRIVE_FOLDER_ID",
    "telegramChatId": "YOUR_TELEGRAM_CHAT_ID"
  }'`
    },
    {
      title: 'Advanced workflow with limits',
      command: `curl -X POST http://localhost:5678/webhook/video-process-advanced \\
  -H "Content-Type: application/json" \\
  -d '{
    "folderId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs67",
    "telegramChatId": "123456789", 
    "limit": 5
  }'`
    }
  ];
  
  examples.forEach((example, index) => {
    console.log(`\n${colors.cyan}${index + 1}. ${example.title}:${colors.reset}`);
    console.log(example.command);
  });
}

// Main execution
function main() {
  console.log(`${colors.blue}🧪 N8N Telegram Video Workflow Tester${colors.reset}\n`);
  
  const workflowFiles = [
    'telegram-video-workflow.json',
    'advanced-telegram-video-workflow.json'
  ];
  
  let allValid = true;
  
  // Test each workflow file
  workflowFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    const isValid = validateWorkflowJSON(filePath);
    allValid = allValid && isValid;
    console.log('');
  });
  
  // Test webhook payload
  const payloadValid = testWebhookPayload();
  allValid = allValid && payloadValid;
  
  console.log('');
  
  if (allValid) {
    log('green', 'RESULT', '✅ All tests passed! Workflows are ready to use.');
  } else {
    log('red', 'RESULT', '❌ Some tests failed. Please check the errors above.');
  }
  
  console.log('');
  generateUsageExamples();
  
  process.exit(allValid ? 0 : 1);
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { validateWorkflowJSON, testWebhookPayload };