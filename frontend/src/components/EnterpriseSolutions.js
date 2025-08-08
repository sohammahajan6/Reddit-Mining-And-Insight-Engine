import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Building2, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  DollarSign,
  Clock,
  Users,
  Lightbulb,
  BarChart3,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { analyzeBusinessOpportunity, formatBusinessAnalysis, getRiskColor, getOpportunityScoreColor, generateSummaryInsights } from '../services/enterpriseService';
import LoadingSpinner from './LoadingSpinner';
import BusinessAnalysisDetails from './BusinessAnalysisDetails';

const EnterpriseSolutions = ({ selectedPosts, onBack }) => {
  const { isDark } = useTheme();
  const [analyses, setAnalyses] = useState([]);
  const [currentAnalyzing, setCurrentAnalyzing] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyzeOpportunities = async () => {
    if (!selectedPosts || selectedPosts.length === 0) {
      setError('No posts selected for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalyses([]);
    setCurrentAnalyzing(0);

    try {
      const results = [];
      
      for (let i = 0; i < selectedPosts.length; i++) {
        setCurrentAnalyzing(i);
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
    } catch (error) {
      console.error('Enterprise analysis error:', error);
      setError(error.message || 'Failed to analyze business opportunities');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="card-elevated max-w-4xl mx-auto text-center py-16">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <LoadingSpinner size="large" />
        </div>

        <h3 className="text-2xl font-bold text-gradient-primary mb-2">
          Analyzing Business Opportunities
        </h3>
        <p className="text-secondary-600 mb-8">
          Processing {currentAnalyzing + 1} of {selectedPosts.length} posts for enterprise insights
        </p>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-6">
          <div className="flex justify-between text-sm text-secondary-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(((currentAnalyzing + 1) / selectedPosts.length) * 100)}%</span>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentAnalyzing + 1) / selectedPosts.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gradient-primary mb-4">
            Enterprise Solutions
          </h1>
          <p className="text-lg text-secondary-600 max-w-2xl mx-auto mb-8">
            Transform Reddit discussions into business opportunities. Analyze problems, assess market potential, 
            and discover actionable insights for your next venture.
          </p>

          {selectedPosts && selectedPosts.length > 0 ? (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                Ready to Analyze {selectedPosts.length} Post{selectedPosts.length > 1 ? 's' : ''}
              </h3>
              <p className="text-secondary-600 mb-4">
                Click below to start analyzing these posts for business opportunities, market gaps, and growth potential.
              </p>
              <button
                onClick={handleAnalyzeOpportunities}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Analyze Business Opportunities</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="bg-secondary-50 dark:bg-gray-800 rounded-xl p-8">
              <Target className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                No Posts Selected
              </h3>
              <p className="text-secondary-600 mb-4">
                Please select some Reddit posts first to analyze for business opportunities.
              </p>
              <button
                onClick={onBack}
                className="btn-secondary"
              >
                Go Back to Post Selection
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6 text-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 w-fit mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              Market Analysis
            </h3>
            <p className="text-sm text-secondary-600">
              Assess market size, competition, and growth potential for identified opportunities.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-3 w-fit mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              Risk Assessment
            </h3>
            <p className="text-sm text-secondary-600">
              Identify technical, market, and competitive risks to make informed decisions.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3 w-fit mx-auto mb-4">
              <Lightbulb className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              Solution Concepts
            </h3>
            <p className="text-sm text-secondary-600">
              Generate actionable solution ideas with implementation complexity analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary mb-2">
            Business Opportunity Analysis
          </h1>
          <p className="text-secondary-600">
            {analyses.length} post{analyses.length > 1 ? 's' : ''} analyzed for enterprise opportunities
          </p>
        </div>
        <button
          onClick={onBack}
          className="btn-secondary"
        >
          Analyze More Posts
        </button>
      </div>

      {/* Analysis Results */}
      <div className="space-y-8">
        {analyses.map((result, index) => (
          <BusinessAnalysisCard 
            key={result.post.id} 
            result={result} 
            index={index}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  );
};

// Business Analysis Card Component
const BusinessAnalysisCard = ({ result, index, isDark }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!result.success) {
    return (
      <div className="card-elevated border-l-4 border-red-500">
        <div className="flex items-center space-x-3 mb-4">
          <XCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-200">
              Analysis Failed
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300">
              r/{result.post.subreddit} • {result.post.title}
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
  const insights = generateSummaryInsights(analysis);

  return (
    <div className="card-elevated">
      {/* Post Header */}
      <div className="border-b border-secondary-200 dark:border-gray-700 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                r/{post.subreddit}
              </span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              {post.title}
            </h3>
            {post.body && (
              <p className="text-sm text-secondary-600 line-clamp-2">
                {post.body}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {insights.slice(0, 4).map((insight, idx) => (
          <div key={idx} className="text-center">
            <div className="text-2xl mb-1">{insight.icon}</div>
            <div className="text-xs font-medium text-secondary-600 mb-1">
              {insight.title}
            </div>
            <div className="text-sm font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              {insight.content}
            </div>
          </div>
        ))}
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full btn-secondary mb-4"
      >
        {isExpanded ? 'Show Less' : 'View Detailed Analysis'}
      </button>

      {/* Detailed Analysis (Expandable) */}
      {isExpanded && (
        <BusinessAnalysisDetails analysis={analysis} isDark={isDark} />
      )}
    </div>
  );
};

export default EnterpriseSolutions;
