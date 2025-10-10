#!/usr/bin/env node

/**
 * Script to manually trigger GitHub Actions workflow for sending reminders
 * This can be used to test the reminder system or trigger it manually
 * 
 * Usage: node scripts/trigger-reminders.js
 */

const https = require('https');
const http = require('http');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'terminiyt2025';
const REPO_NAME = 'terminiyt';
const WORKFLOW_ID = 'send-reminders.yml';

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  console.log('Please set your GitHub personal access token:');
  console.log('export GITHUB_TOKEN=your_token_here');
  process.exit(1);
}

function triggerWorkflow() {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`;
    
    const data = JSON.stringify({
      ref: 'main'
    });
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 204) {
          resolve({ success: true, message: 'Workflow triggered successfully' });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log(`[${new Date().toISOString()}] Triggering GitHub Actions workflow...`);
    console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}`);
    console.log(`Workflow: ${WORKFLOW_ID}`);
    
    const result = await triggerWorkflow();
    
    console.log(`[${new Date().toISOString()}] ✅ ${result.message}`);
    console.log('Check the Actions tab in your GitHub repository to see the workflow run.');
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { triggerWorkflow };
