#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Reddit-Gemini Solution App...\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ Node.js 16 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version check passed:', nodeVersion);

// Create environment files if they don't exist
const envFiles = [
  { src: '.env.example', dest: '.env' },
  { src: '.env.example', dest: 'backend/.env' },
  { src: 'frontend/.env.example', dest: 'frontend/.env' }
];

envFiles.forEach(({ src, dest }) => {
  if (!fs.existsSync(dest)) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`✅ Created ${dest} from ${src}`);
    } else {
      console.log(`⚠️  ${src} not found, skipping ${dest}`);
    }
  } else {
    console.log(`ℹ️  ${dest} already exists`);
  }
});

// Install dependencies
console.log('\n📦 Installing dependencies...');

try {
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('Installing backend dependencies...');
  execSync('cd backend && npm install', { stdio: 'inherit' });
  
  console.log('Installing frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  
  console.log('✅ All dependencies installed successfully!');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create necessary directories
const directories = [
  'logs',
  'temp',
  'backend/logs'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Configure your API keys in the .env files');
console.log('2. Set up your Reddit app at https://www.reddit.com/prefs/apps');
console.log('3. Get your Gemini API key from https://makersuite.google.com/app/apikey');
console.log('4. Set up Google Sheets API credentials');
console.log('5. Run "npm run dev" to start the development servers');
console.log('\n📖 See README.md for detailed setup instructions');

// Check if environment variables are configured
console.log('\n🔍 Checking environment configuration...');

const requiredEnvVars = [
  'REDDIT_CLIENT_ID',
  'REDDIT_CLIENT_SECRET',
  'GEMINI_API_KEY',
  'GOOGLE_SHEETS_PRIVATE_KEY',
  'GOOGLE_SHEETS_CLIENT_EMAIL',
  'GOOGLE_SHEETS_SPREADSHEET_ID'
];

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const missingVars = requiredEnvVars.filter(varName => 
    !envContent.includes(`${varName}=`) || 
    envContent.includes(`${varName}=your_`) ||
    envContent.includes(`${varName}=`)
  );
  
  if (missingVars.length > 0) {
    console.log('⚠️  Missing or incomplete environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n   Please configure these in your .env file before running the app.');
  } else {
    console.log('✅ Environment variables appear to be configured');
  }
} else {
  console.log('⚠️  .env file not found. Please create it from .env.example');
}

console.log('\n🚀 Ready to start development!');
console.log('Run: npm run dev');
