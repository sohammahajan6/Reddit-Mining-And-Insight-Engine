#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

console.log('🏥 Running health checks for Reddit-Gemini Solution App...\n');

const healthChecks = [
  {
    name: 'Backend Server',
    url: `${API_BASE_URL.replace('/api', '')}/health`,
    required: true
  },
  {
    name: 'Reddit API',
    url: `${API_BASE_URL}/reddit/popular-subreddits`,
    required: true
  },
  {
    name: 'Gemini AI',
    url: `${API_BASE_URL}/gemini/health`,
    required: true
  },
  {
    name: 'Google Sheets',
    url: `${API_BASE_URL}/sheets/health`,
    required: true
  }
];

async function runHealthCheck(check) {
  try {
    console.log(`🔍 Checking ${check.name}...`);
    
    const response = await axios.get(check.url, {
      timeout: 10000,
      validateStatus: (status) => status < 500 // Accept 4xx as "reachable"
    });
    
    if (response.status === 200) {
      console.log(`✅ ${check.name}: Healthy`);
      if (response.data.message) {
        console.log(`   ${response.data.message}`);
      }
      return { name: check.name, status: 'healthy', required: check.required };
    } else {
      console.log(`⚠️  ${check.name}: Reachable but returned ${response.status}`);
      if (response.data.error) {
        console.log(`   Error: ${response.data.error}`);
      }
      return { name: check.name, status: 'warning', required: check.required };
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ ${check.name}: Server not running`);
    } else if (error.code === 'ENOTFOUND') {
      console.log(`❌ ${check.name}: Host not found`);
    } else if (error.response) {
      console.log(`❌ ${check.name}: HTTP ${error.response.status}`);
      if (error.response.data?.error) {
        console.log(`   Error: ${error.response.data.error}`);
      }
    } else {
      console.log(`❌ ${check.name}: ${error.message}`);
    }
    
    return { name: check.name, status: 'failed', required: check.required };
  }
}

async function runAllHealthChecks() {
  const results = [];
  
  for (const check of healthChecks) {
    const result = await runHealthCheck(check);
    results.push(result);
    console.log(''); // Add spacing
  }
  
  // Summary
  console.log('📊 Health Check Summary:');
  console.log('========================');
  
  const healthy = results.filter(r => r.status === 'healthy').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const requiredFailed = results.filter(r => r.status === 'failed' && r.required).length;
  
  console.log(`✅ Healthy: ${healthy}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (requiredFailed > 0) {
    console.log('\n❌ Critical services are down. The app may not function properly.');
    console.log('Please check your configuration and ensure all services are running.');
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure the backend server is running (npm run dev:backend)');
    console.log('2. Check your .env file for correct API keys');
    console.log('3. Verify your internet connection');
    console.log('4. Check API service status pages');
    
    process.exit(1);
  } else if (failed > 0 || warnings > 0) {
    console.log('\n⚠️  Some services have issues but the app should still work.');
    console.log('Check the details above and your configuration.');
  } else {
    console.log('\n🎉 All systems are healthy! The app is ready to use.');
  }
}

// Environment check
console.log('🔍 Checking environment configuration...');

const requiredEnvVars = [
  'REDDIT_CLIENT_ID',
  'REDDIT_CLIENT_SECRET', 
  'GEMINI_API_KEY',
  'GOOGLE_SHEETS_PRIVATE_KEY',
  'GOOGLE_SHEETS_CLIENT_EMAIL',
  'GOOGLE_SHEETS_SPREADSHEET_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\nPlease configure these in your .env file before running health checks.');
  process.exit(1);
}

console.log('✅ Environment variables are configured\n');

// Run the health checks
runAllHealthChecks().catch(error => {
  console.error('❌ Health check failed:', error.message);
  process.exit(1);
});
