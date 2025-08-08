import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Brain,
  ArrowLeft,
  Zap,
  Shield,
  Globe
} from 'lucide-react';
import { fetchRedditPosts } from '../services/redditService';
import { analyzeBusinessOpportunity, formatBusinessAnalysis } from '../services/enterpriseService';
import LoadingSpinner from '../components/LoadingSpinner';
import BusinessAnalysisDetails from '../components/BusinessAnalysisDetails';

const EnterprisePage = ({ onClose }) => {
  console.log('🏢 EnterprisePage component rendering...');
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState('welcome'); // welcome, subreddit, posts, analyzing, results
  const [selectedSubreddit, setSelectedSubreddit] = useState('');
  const [postCount, setPostCount] = useState(10);
  const [availablePosts, setAvailablePosts] = useState([]);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedPost, setExpandedPost] = useState(null);

  // Business-focused subreddits
  const businessSubreddits = [
    { value: 'entrepreneur', label: 'r/entrepreneur', description: 'Startup ideas and business discussions' },
    { value: 'smallbusiness', label: 'r/smallbusiness', description: 'Small business challenges and solutions' },
    { value: 'startups', label: 'r/startups', description: 'Startup ecosystem and funding discussions' },
    { value: 'business', label: 'r/business', description: 'General business news and insights' },
    { value: 'marketing', label: 'r/marketing', description: 'Marketing strategies and challenges' },
    { value: 'SaaS', label: 'r/SaaS', description: 'Software as a Service discussions' },
    { value: 'ecommerce', label: 'r/ecommerce', description: 'E-commerce business opportunities' },
    { value: 'freelance', label: 'r/freelance', description: 'Freelancing challenges and solutions' }
  ];

  const handleSubredditSelect = async (subreddit) => {
    setSelectedSubreddit(subreddit);
    setCurrentStep('posts');
    setIsLoading(true);
    setError('');

    try {
      console.log(`🔍 Fetching ${postCount} posts from r/${subreddit} for enterprise analysis`);
      const posts = await fetchRedditPosts(subreddit, 'hot', 50, postCount);
      setAvailablePosts(posts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'Failed to fetch posts');
      setCurrentStep('subreddit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeOpportunities = async () => {
    if (!selectedPosts || selectedPosts.length === 0) {
      setError('No posts selected for analysis');
      return;
    }

    setCurrentStep('analyzing');
    setError('');
    setAnalyses([]);

    try {
      const results = [];
      
      for (let i = 0; i < selectedPosts.length; i++) {
        const post = selectedPosts[i];
        
        try {
          const result = await analyzeBusinessOpportunity(post);
          const formattedAnalysis = formatBusinessAnalysis(result.analysis);
          
          results.push({
            post,
            analysis: formattedAnalysis,
            metadata: result.metadata,
            success: true
          });
        } catch (postError) {
          console.error(`Failed to analyze post ${post.id}:`, postError);
          results.push({
            post,
            error: postError.message,
            success: false
          });
        }
      }
      
      setAnalyses(results);
      setCurrentStep('results');
    } catch (error) {
      console.error('Enterprise analysis error:', error);
      setError(error.message || 'Failed to analyze business opportunities');
      setCurrentStep('posts');
    }
  };

  const renderWelcomeStep = () => (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-20"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-3xl">
              <Building2 className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-gradient-primary mb-6">
          Enterprise Solutions Platform
        </h1>
        <p className="text-xl text-secondary-600 max-w-3xl mx-auto mb-8">
          Transform Reddit discussions into actionable business opportunities. 
          Discover market gaps, assess risks, and validate your next big idea with AI-powered insights.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <button
            onClick={() => setCurrentStep('subreddit')}
            className="btn-primary text-lg px-8 py-4 shadow-glow-primary hover:shadow-glow-primary"
          >
            <Zap className="h-5 w-5 mr-2" />
            Start Business Analysis
          </button>
          
          <div className="mt-4 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
            <span className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome back, {user?.username || 'Entrepreneur'}!
            </span>
            <span className="text-xl animate-bounce ml-2">👋</span>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <div className="card p-6 text-center hover:shadow-lg transition-shadow">
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-4 w-fit mx-auto mb-4">
            <Target className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
            Market Opportunity
          </h3>
          <p className="text-sm text-secondary-600">
            Identify and assess market size, demand, and growth potential from real user discussions.
          </p>
        </div>

        <div className="card p-6 text-center hover:shadow-lg transition-shadow">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 w-fit mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
            Risk Assessment
          </h3>
          <p className="text-sm text-secondary-600">
            Comprehensive analysis of technical, market, and competitive risks for informed decisions.
          </p>
        </div>

        <div className="card p-6 text-center hover:shadow-lg transition-shadow">
          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4 w-fit mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
            Growth Potential
          </h3>
          <p className="text-sm text-secondary-600">
            Scalability analysis with investment requirements and time-to-market projections.
          </p>
        </div>

        <div className="card p-6 text-center hover:shadow-lg transition-shadow">
          <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-4 w-fit mx-auto mb-4">
            <Brain className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
            AI-Powered Insights
          </h3>
          <p className="text-sm text-secondary-600">
            Advanced AI analysis for solution concepts, monetization strategies, and next steps.
          </p>
        </div>
      </div>

      {/* Business-Focused Communities Preview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
          🎯 Business-Focused Communities
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {businessSubreddits.slice(0, 8).map((sub) => (
            <div key={sub.value} className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="font-medium text-blue-600 dark:text-blue-400">{sub.label}</div>
              <div className="text-xs text-secondary-600 mt-1">{sub.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSubredditStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gradient-primary mb-4">
          Choose Your Business Community
        </h2>
        <p className="text-secondary-600">
          Select a business-focused subreddit to analyze for opportunities
        </p>
      </div>

      {/* Post Count Selector */}
      <div className="card p-6 mb-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">How many posts would you like to fetch?</h3>
          <div className="flex items-center justify-center space-x-4">
            <label className="text-sm font-medium">Posts to fetch:</label>
            <select
              value={postCount}
              onChange={(e) => setPostCount(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>5 posts</option>
              <option value={10}>10 posts</option>
              <option value={15}>15 posts</option>
              <option value={20}>20 posts</option>
              <option value={25}>25 posts</option>
            </select>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            More posts = better analysis but longer loading time
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {businessSubreddits.map((subreddit) => (
          <button
            key={subreddit.value}
            onClick={() => handleSubredditSelect(subreddit.value)}
            disabled={isLoading}
            className="card p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-600 dark:text-blue-400">
                {subreddit.label}
              </h3>
              <ArrowRight className="h-5 w-5 text-secondary-400" />
            </div>
            <p className="text-sm text-secondary-600">
              {subreddit.description}
            </p>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center mt-8">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-secondary-600">Fetching posts from r/{selectedSubreddit}...</p>
        </div>
      )}
    </div>
  );

  const renderPostsStep = () => (
    <div className="max-w-6xl mx-auto">
      {/* Sticky Analyze Button */}
      {selectedPosts.length > 0 && (
        <div className="sticky top-20 z-40 mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleAnalyzeOpportunities}
                className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2 inline" />
                Analyze Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gradient-primary mb-4">
          Select Posts for Business Analysis
        </h2>
        <p className="text-secondary-600">
          Choose posts from r/{selectedSubreddit} that discuss problems or opportunities
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        {availablePosts.map((post) => (
          <div
            key={post.id}
            className={`card p-6 transition-all duration-200 ${
              selectedPosts.some(p => p.id === post.id)
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:shadow-lg'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3
                className="font-semibold text-lg line-clamp-2 cursor-pointer hover:text-blue-600"
                style={{color: isDark ? '#f0f6fc' : '#111827'}}
                onClick={() => {
                  if (selectedPosts.some(p => p.id === post.id)) {
                    setSelectedPosts(selectedPosts.filter(p => p.id !== post.id));
                  } else {
                    setSelectedPosts([...selectedPosts, post]);
                  }
                }}
              >
                {post.title}
              </h3>
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {post.score} upvotes
                </span>
                {selectedPosts.some(p => p.id === post.id) && (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>
            </div>

            {post.body && (
              <div className="mb-3">
                <p className={`text-sm text-secondary-600 ${expandedPost === post.id ? '' : 'line-clamp-3'}`}>
                  {post.body}
                </p>
                {post.body.length > 200 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedPost(expandedPost === post.id ? null : post.id);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                  >
                    {expandedPost === post.id ? 'Show Less' : 'Read Full Post'}
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-secondary-500">
                <span>by u/{post.author}</span>
                <span>{post.numComments || 0} comments</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedPosts.some(p => p.id === post.id)) {
                    setSelectedPosts(selectedPosts.filter(p => p.id !== post.id));
                  } else {
                    setSelectedPosts([...selectedPosts, post]);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPosts.some(p => p.id === post.id)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {selectedPosts.some(p => p.id === post.id) ? 'Selected' : 'Select'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPosts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Click on posts above to select them for business analysis
          </p>
        </div>
      )}
    </div>
  );

  const renderAnalyzingStep = () => (
    <div className="max-w-4xl mx-auto text-center py-16">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
        <LoadingSpinner size="large" />
      </div>

      <h3 className="text-2xl font-bold text-gradient-primary mb-2">
        Analyzing Business Opportunities
      </h3>
      <p className="text-secondary-600 mb-8">
        Our AI is analyzing {selectedPosts.length} post{selectedPosts.length > 1 ? 's' : ''} for market opportunities, risks, and growth potential...
      </p>

      <div className="flex justify-center">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );

  const renderResultsStep = () => (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gradient-primary mb-2">
            Business Opportunity Analysis Results
          </h2>
          <p className="text-secondary-600">
            {analyses.length} analysis{analyses.length > 1 ? 'es' : ''} completed for r/{selectedSubreddit}
          </p>
        </div>
        <button
          onClick={() => setCurrentStep('subreddit')}
          className="btn-secondary"
        >
          Analyze More Communities
        </button>
      </div>

      <div className="space-y-8">
        {analyses.map((result, index) => (
          <EnterpriseAnalysisCard
            key={result.post.id}
            result={result}
            index={index}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  );
  
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: isDark ? '#0f172a' : '#f8fafc'
      }}
    >
      {/* Header */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Enterprise Solutions
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Globe className="h-4 w-4" />
              <span>Business Intelligence Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}

          {currentStep === 'welcome' && renderWelcomeStep()}
          {currentStep === 'subreddit' && renderSubredditStep()}
          {currentStep === 'posts' && renderPostsStep()}
          {currentStep === 'analyzing' && renderAnalyzingStep()}
          {currentStep === 'results' && renderResultsStep()}
        </div>
      </div>
    </div>
  );
};

// Enterprise Analysis Card Component
const EnterpriseAnalysisCard = ({ result, index, isDark }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!result.success) {
    return (
      <div className="card-elevated border-l-4 border-red-500">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-200">
              Analysis Failed
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300">
              {result.post.title}
            </p>
          </div>
        </div>
        <p className="text-red-700 dark:text-red-300">
          {result.error}
        </p>
      </div>
    );
  }

  const { analysis, post } = result;

  return (
    <div className="card-elevated">
      {/* Post Header */}
      <div className="border-b border-secondary-200 dark:border-gray-700 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              {post.title}
            </h3>
            {post.body && (
              <p className="text-sm text-secondary-600 line-clamp-2 mb-3">
                {post.body}
              </p>
            )}
            <div className="flex items-center space-x-4 text-xs text-secondary-500">
              <span>by u/{post.author}</span>
              <span>{post.score} upvotes</span>
              <span>{post.numComments || 0} comments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Business Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl mb-1">🎯</div>
          <div className="text-xs font-medium text-secondary-600 mb-1">Opportunity</div>
          <div className="text-sm font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
            {analysis?.businessOpportunity?.marketSize || 'Medium'}
          </div>
        </div>

        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-2xl mb-1">⚠️</div>
          <div className="text-xs font-medium text-secondary-600 mb-1">Risk Level</div>
          <div className="text-sm font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
            {analysis?.riskAssessment?.overallRisk || 'Medium'}
          </div>
        </div>

        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl mb-1">📈</div>
          <div className="text-xs font-medium text-secondary-600 mb-1">Growth Score</div>
          <div className="text-sm font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
            {analysis?.growthPotential?.score || '6'}/10
          </div>
        </div>

        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-xs font-medium text-secondary-600 mb-1">Investment</div>
          <div className="text-sm font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
            {analysis?.growthPotential?.investmentRequired || 'Medium'}
          </div>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full btn-secondary mb-4"
      >
        {isExpanded ? 'Show Less Details' : 'View Full Business Analysis'}
      </button>

      {/* Detailed Analysis (Expandable) */}
      {isExpanded && analysis && (
        <BusinessAnalysisDetails analysis={analysis} isDark={isDark} />
      )}
    </div>
  );
};

export default EnterprisePage;
