#!/usr/bin/env node

/**
 * Script to send booking reminder emails
 * This script should be run every 5 minutes via cron job
 * 
 * Usage: node scripts/send-reminders.js
 * 
 * Cron job example (every 5 minutes):
 * 0,5,10,15,20,25,30,35,40,45,50,55 * * * * /usr/bin/node /path/to/your/project/scripts/send-reminders.js
 */

const https = require('https');
const http = require('http');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ENDPOINT = '/api/send-reminders';

function sendRequest() {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT, API_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  try {
    console.log(`[${new Date().toISOString()}] Starting reminder email process...`);
    
    const result = await sendRequest();
    
    if (result.success) {
      console.log(`[${new Date().toISOString()}] Success: ${result.message}`);
      
      if (result.results && result.results.length > 0) {
        const sent = result.results.filter(r => r.status === 'sent').length;
        const failed = result.results.filter(r => r.status === 'failed').length;
        const errors = result.results.filter(r => r.status === 'error').length;
        
        console.log(`[${new Date().toISOString()}] Results: ${sent} sent, ${failed} failed, ${errors} errors`);
        
        // Log failed/error details
        result.results.forEach(r => {
          if (r.status !== 'sent') {
            console.error(`[${new Date().toISOString()}] Booking ${r.bookingId} (${r.customerEmail}): ${r.status} - ${r.error}`);
          }
        });
      }
    } else {
      console.error(`[${new Date().toISOString()}] Error: ${result.error}`);
      process.exit(1);
    }
    
    console.log(`[${new Date().toISOString()}] Reminder email process completed successfully`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, sendRequest };
