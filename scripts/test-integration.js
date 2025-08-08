#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

console.log('🧪 Running integration tests for Reddit-Gemini Solution App...\n');

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`🔍 Testing: ${testName}`);
  
  try {
    await testFunction();
    console.log(`✅ PASSED: ${testName}\n`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}\n`);
    testResults.failed++;
  }
}

// Test 1: Backend Health Check
async function testBackendHealth() {
  const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
    timeout: 5000
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.status || response.data.status !== 'OK') {
    throw new Error('Backend health check failed');
  }
}

// Test 2: Popular Subreddits
async function testPopularSubreddits() {
  const response = await axios.get(`${API_BASE_URL}/reddit/popular-subreddits`, {
    timeout: 10000
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success || !Array.isArray(response.data.subreddits)) {
    throw new Error('Invalid subreddits response format');
  }
  
  if (response.data.subreddits.length === 0) {
    throw new Error('No popular subreddits returned');
  }
  
  console.log(`   Found ${response.data.subreddits.length} popular subreddits`);
}

// Test 3: Subreddit Validation
async function testSubredditValidation() {
  const response = await axios.post(`${API_BASE_URL}/reddit/validate-subreddit`, {
    subreddit: 'advice'
  }, {
    timeout: 10000
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success || !response.data.isValid) {
    throw new Error('Subreddit validation failed for known good subreddit');
  }
}

// Test 4: Fetch Reddit Post
async function testFetchRedditPost() {
  const response = await axios.post(`${API_BASE_URL}/reddit/fetch-post`, {
    subreddit: 'advice',
    sortBy: 'hot',
    limit: 10
  }, {
    timeout: 30000
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success || !response.data.post) {
    throw new Error('Failed to fetch Reddit post');
  }
  
  const post = response.data.post;
  if (!post.title || !post.subreddit || !post.url) {
    throw new Error('Invalid post format - missing required fields');
  }
  
  console.log(`   Fetched post: "${post.title.substring(0, 50)}..."`);
  return post;
}

// Test 5: Generate Solution
async function testGenerateSolution() {
  // First get a post
  const postResponse = await axios.post(`${API_BASE_URL}/reddit/fetch-post`, {
    subreddit: 'advice',
    sortBy: 'hot',
    limit: 5
  }, {
    timeout: 30000
  });
  
  const post = postResponse.data.post;
  
  // Then generate solution
  const response = await axios.post(`${API_BASE_URL}/gemini/generate-solution`, {
    post: post
  }, {
    timeout: 60000
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success || !response.data.solution) {
    throw new Error('Failed to generate solution');
  }
  
  const solution = response.data.solution;
  if (solution.length < 50) {
    throw new Error('Generated solution is too short');
  }
  
  console.log(`   Generated solution (${solution.length} characters)`);
  return { post, solution };
}

// Test 6: Google Sheets Health
async function testSheetsHealth() {
  const response = await axios.get(`${API_BASE_URL}/sheets/health`, {
    timeout: 10000
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success || response.data.status !== 'connected') {
    throw new Error('Google Sheets connection failed');
  }
}

// Test 7: Log Response to Sheets
async function testLogResponse() {
  // First generate a solution
  const postResponse = await axios.post(`${API_BASE_URL}/reddit/fetch-post`, {
    subreddit: 'advice',
    sortBy: 'hot',
    limit: 5
  }, {
    timeout: 30000
  });
  
  const post = postResponse.data.post;
  
  const solutionResponse = await axios.post(`${API_BASE_URL}/gemini/generate-solution`, {
    post: post
  }, {
    timeout: 60000
  });
  
  const solution = solutionResponse.data.solution;
  
  // Then log it
  const response = await axios.post(`${API_BASE_URL}/sheets/log-response`, {
    post: post,
    solution: solution,
    rating: 'like',
    feedback: 'Integration test - automated'
  }, {
    timeout: 15000
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Failed to log response to Google Sheets');
  }
  
  console.log(`   Logged response for post: ${post.id}`);
}

// Test 8: Get Statistics
async function testGetStatistics() {
  const response = await axios.get(`${API_BASE_URL}/sheets/statistics`, {
    timeout: 10000
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success || !response.data.statistics) {
    throw new Error('Failed to get statistics');
  }
  
  const stats = response.data.statistics;
  console.log(`   Statistics: ${stats.totalResponses} total responses, ${stats.likes} likes`);
}

// Test 9: Full Integration Flow
async function testFullFlow() {
  console.log('   Running complete user flow...');
  
  // 1. Get popular subreddits
  const subredditsResponse = await axios.get(`${API_BASE_URL}/reddit/popular-subreddits`);
  const subreddit = subredditsResponse.data.subreddits[0].name;
  
  // 2. Fetch a post
  const postResponse = await axios.post(`${API_BASE_URL}/reddit/fetch-post`, {
    subreddit: subreddit,
    sortBy: 'hot',
    limit: 10
  }, { timeout: 30000 });
  
  const post = postResponse.data.post;
  
  // 3. Generate solution
  const solutionResponse = await axios.post(`${API_BASE_URL}/gemini/generate-solution`, {
    post: post
  }, { timeout: 60000 });
  
  const solution = solutionResponse.data.solution;
  
  // 4. Log positive feedback
  const logResponse = await axios.post(`${API_BASE_URL}/sheets/log-response`, {
    post: post,
    solution: solution,
    rating: 'like',
    feedback: 'Full integration test'
  }, { timeout: 15000 });
  
  if (!logResponse.data.success) {
    throw new Error('Failed to complete full integration flow');
  }
  
  console.log(`   ✅ Complete flow successful for r/${subreddit}`);
}

// Run all tests
async function runAllTests() {
  console.log('Starting integration tests...\n');
  
  await runTest('Backend Health Check', testBackendHealth);
  await runTest('Popular Subreddits API', testPopularSubreddits);
  await runTest('Subreddit Validation', testSubredditValidation);
  await runTest('Fetch Reddit Post', testFetchRedditPost);
  await runTest('Generate AI Solution', testGenerateSolution);
  await runTest('Google Sheets Health', testSheetsHealth);
  await runTest('Log Response to Sheets', testLogResponse);
  await runTest('Get Statistics', testGetStatistics);
  await runTest('Full Integration Flow', testFullFlow);
  
  // Summary
  console.log('🏁 Integration Test Results:');
  console.log('============================');
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All integration tests passed! The app is ready for use.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above and fix the issues.');
    process.exit(1);
  }
}

// Check if backend is running
async function checkBackendRunning() {
  try {
    await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, { timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  const isBackendRunning = await checkBackendRunning();
  
  if (!isBackendRunning) {
    console.log('❌ Backend server is not running!');
    console.log('Please start the backend server first:');
    console.log('   npm run dev:backend');
    console.log('   # or');
    console.log('   npm run dev');
    process.exit(1);
  }
  
  await runAllTests();
}

main().catch(error => {
  console.error('❌ Integration test suite failed:', error.message);
  process.exit(1);
});
