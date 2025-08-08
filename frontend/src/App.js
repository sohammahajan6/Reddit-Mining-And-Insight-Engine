import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Brain, MessageCircle, FileSpreadsheet, ArrowLeft, User, LogIn, Shield, Building2 } from 'lucide-react';

import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ThemeToggle from './components/ThemeToggle';

import SubredditSelector from './components/SubredditSelector';
import PostCountSelector from './components/PostCountSelector';
import PostSelector from './components/PostSelector';


import MultipleSolutionsDisplay from './components/MultipleSolutionsDisplay';

import Statistics from './components/Statistics';
import LoadingSpinner from './components/LoadingSpinner';
import SolutionOptions from './components/SolutionOptions';
import FollowUpQuestions from './components/FollowUpQuestions';


import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import SessionWarning from './components/SessionWarning';
import EnterpriseSolutions from './components/EnterpriseSolutions';
import EnterprisePage from './pages/EnterprisePage';

import { fetchRedditPosts } from './services/redditService';
import { generateSolution } from './services/geminiService';
import { logResponse } from './services/sheetsService';
import { logSolutionGeneration, logUserFeedback, extractSolutionAnalytics, extractFeedbackAnalytics } from './services/analyticsService';

import sessionManager from './utils/sessionManager';

import './index.css';

function AppContent() {
  // Theme context
  const { isDark } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  // Helper function to get avatar URL
  const getAvatarUrl = (avatarData) => {
    if (!avatarData) return null;
    // If it's already a base64 data URL, return as is
    if (avatarData.startsWith('data:')) return avatarData;
    // If it's a URL, return as is
    if (avatarData.startsWith('http')) return avatarData;
    // If it's a relative path, prepend the backend URL (legacy support)
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${backendUrl}${avatarData}`;
  };

  // State management
  const [currentStep, setCurrentStep] = useState('select'); // select, configure, loading, posts, generating, display, feedback, enterprise
  const [selectedSubreddit, setSelectedSubreddit] = useState('');
  const [availablePosts, setAvailablePosts] = useState([]);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [postSolutions, setPostSolutions] = useState([]);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStatistics, setShowStatistics] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showAdminPage, setShowAdminPage] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showEnterprisePage, setShowEnterprisePage] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Session management state
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);

  // Solution options state
  const [solutionOptions, setSolutionOptions] = useState({
    template: 'general',
    tone: 'empathetic',
    length: 'medium',
    followupQuestions: false
  });
  const [showSolutionOptions, setShowSolutionOptions] = useState(false);
  const [followupAnswers, setFollowupAnswers] = useState(null);
  const [showFollowupQuestions, setShowFollowupQuestions] = useState(false);

  // Reset error when step changes
  useEffect(() => {
    setError('');
  }, [currentStep]);

  // Session management
  useEffect(() => {
    if (isAuthenticated) {
      sessionManager.init(
        // On session expired
        () => {
          setShowSessionWarning(false);
          logout();
        },
        // On session warning
        () => {
          setSessionTimeLeft(sessionManager.getRemainingTime());
          setShowSessionWarning(true);
        }
      );
    } else {
      sessionManager.cleanup();
    }

    return () => {
      sessionManager.cleanup();
    };
  }, [isAuthenticated, logout]);

  const handleSubredditSelect = (subreddit) => {
    console.log('🏢 Subreddit selected:', subreddit);
    if (subreddit === 'enterprise-redirect') {
      console.log('🚀 Opening Enterprise Page');
      console.log('🔍 Current showEnterprisePage state:', showEnterprisePage);
      setShowEnterprisePage(true);
      console.log('✅ setShowEnterprisePage(true) called');
      return;
    }
    setSelectedSubreddit(subreddit);
    setCurrentStep('configure');
    setError('');
  };

  const handleFetchPosts = async (subreddit, sortBy, count) => {
    setCurrentStep('loading');
    setIsLoading(true);
    setError('');

    try {
      console.log(`🔍 Fetching ${count} posts from r/${subreddit}`);
      const posts = await fetchRedditPosts(subreddit, sortBy, 50, count);
      setAvailablePosts(posts);
      setCurrentStep('posts');
    } catch (err) {
      console.error('Error in handleFetchPosts:', err);
      setError(err.message || 'Failed to fetch posts');
      setCurrentStep('configure');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostsSelect = (posts) => {
    setSelectedPosts(posts);
  };

  const handleGenerateSolutions = async () => {
    if (selectedPosts.length === 0) return;

    // Check if follow-up questions are enabled and we don't have answers yet
    if (solutionOptions.followupQuestions && !followupAnswers && selectedPosts.length === 1) {
      setShowFollowupQuestions(true);
      return;
    }

    setCurrentStep('generating');
    setIsLoading(true);
    setError('');
    setCurrentGeneratingIndex(0);

    // Initialize postSolutions array
    const initialSolutions = selectedPosts.map(post => ({
      post,
      solution: null,
      error: null
    }));
    setPostSolutions(initialSolutions);

    try {
      // Generate solutions one by one
      for (let i = 0; i < selectedPosts.length; i++) {
        setCurrentGeneratingIndex(i);
        const post = selectedPosts[i];

        try {
          console.log(`🧠 Generating solution ${i + 1}/${selectedPosts.length} for: "${post.title}"`);

          // Prepare options with follow-up answers if available
          const optionsWithAnswers = {
            ...solutionOptions,
            followupAnswers: followupAnswers
          };

          const generatedSolution = await generateSolution(post, null, optionsWithAnswers);

          // Log analytics for solution generation
          try {
            const analyticsData = extractSolutionAnalytics(post, generatedSolution, optionsWithAnswers, 0);
            await logSolutionGeneration(analyticsData);
          } catch (analyticsError) {
            console.error('Failed to log analytics:', analyticsError);
            // Don't fail the solution generation if analytics fails
          }

          // Update the specific solution
          setPostSolutions(prev => prev.map((item, index) =>
            index === i ? {
              ...item,
              solution: generatedSolution
            } : item
          ));
        } catch (solutionError) {
          console.error(`Error generating solution for post ${i + 1}:`, solutionError);

          // Update with error
          setPostSolutions(prev => prev.map((item, index) =>
            index === i ? { ...item, error: solutionError.message } : item
          ));
        }
      }

      setCurrentStep('display');
    } catch (err) {
      console.error('Error in handleGenerateSolutions:', err);

      // Handle specific error types with user-friendly messages
      let errorMessage = 'Failed to generate solutions';

      if (err.message.includes('overloaded') || err.message.includes('503')) {
        errorMessage = '🤖 AI service is temporarily busy. Please try again in a few minutes.';
      } else if (err.message.includes('rate limit') || err.message.includes('429')) {
        errorMessage = '⏱️ Too many requests. Please wait a moment before trying again.';
      } else if (err.message.includes('quota')) {
        errorMessage = '📊 Daily AI usage limit reached. Please try again tomorrow.';
      } else if (err.message.includes('API key')) {
        errorMessage = '🔑 AI service configuration error. Please contact support.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = '🌐 Network connection issue. Please check your internet and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setCurrentStep('posts');
    } finally {
      setIsLoading(false);
      setCurrentGeneratingIndex(0);
    }
  };

  // Solution options handlers
  const handleSolutionOptionsChange = (newOptions) => {
    setSolutionOptions(newOptions);
  };

  const handleToggleSolutionOptions = () => {
    setShowSolutionOptions(!showSolutionOptions);
  };

  // Follow-up questions handlers
  const handleFollowupQuestionsComplete = (answers) => {
    setFollowupAnswers(answers);
    setShowFollowupQuestions(false);
    // Now generate solutions with the answers
    handleGenerateSolutions();
  };

  const handleSkipFollowupQuestions = () => {
    setShowFollowupQuestions(false);
    // Generate solutions without follow-up answers
    handleGenerateSolutions();
  };

  // Session warning handlers
  const handleExtendSession = () => {
    sessionManager.extendSession();
    setShowSessionWarning(false);
  };

  const handleSessionLogout = () => {
    setShowSessionWarning(false);
    logout();
  };

  const handleDismissSessionWarning = () => {
    setShowSessionWarning(false);
  };

  const handleLike = async (post, solution) => {
    try {
      setIsLoading(true);

      // Log to sheets
      await logResponse({
        post,
        solution,
        rating: 'like'
      });

      // Log analytics for like feedback
      try {
        const feedbackData = extractFeedbackAnalytics(post, solution, 'like', '', solutionOptions);
        await logUserFeedback(feedbackData);
      } catch (analyticsError) {
        console.error('Failed to log like analytics:', analyticsError);
      }




      console.log(`✅ Liked solution for: "${post.title}"`);
    } catch (err) {
      console.error('Error logging like:', err);
      setError('Failed to save response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateSolution = async (post, previousSolution, feedback) => {
    try {
      // Log the dislike with feedback to sheets
      await logResponse({
        post,
        solution: previousSolution,
        rating: 'dislike',
        feedback
      });

      // Log user feedback analytics
      try {
        const feedbackData = extractFeedbackAnalytics(post, previousSolution, 'dislike', feedback, solutionOptions);
        await logUserFeedback(feedbackData);
      } catch (analyticsError) {
        console.error('Failed to log feedback analytics:', analyticsError);
      }

      // Generate new solution based on feedback with current options
      const optionsWithAnswers = {
        ...solutionOptions,
        followupAnswers: followupAnswers
      };

      const newSolution = await generateSolution(post, feedback, optionsWithAnswers);

      // Log analytics for regenerated solution
      try {
        const analyticsData = extractSolutionAnalytics(post, newSolution, optionsWithAnswers, 0);
        await logSolutionGeneration(analyticsData);
      } catch (analyticsError) {
        console.error('Failed to log regeneration analytics:', analyticsError);
      }

      // Update the specific solution in the array
      setPostSolutions(prev => prev.map(item =>
        item.post.id === post.id
          ? {
              ...item,
              solution: newSolution,
              error: null
            }
          : item
      ));

      console.log(`✅ Regenerated solution for: "${post.title}"`);
    } catch (error) {
      console.error('Error regenerating solution:', error);

      // Handle specific error types with user-friendly messages
      let errorMessage = 'Failed to regenerate solution';

      if (error.message.includes('overloaded') || error.message.includes('503')) {
        errorMessage = '🤖 AI service is temporarily busy. Please try again in a few minutes.';
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = '⏱️ Too many requests. Please wait a moment before trying again.';
      } else if (error.message.includes('quota')) {
        errorMessage = '📊 Daily AI usage limit reached. Please try again tomorrow.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Update with error
      setPostSolutions(prev => prev.map(item =>
        item.post.id === post.id
          ? { ...item, error: errorMessage }
          : item
      ));

      throw new Error(errorMessage); // Re-throw with friendly message
    }
  };

  const handleRetryGeneration = async (post) => {
    try {
      // Generate new solution with current options (no feedback, no dislike logging)
      const optionsWithAnswers = {
        ...solutionOptions,
        followupAnswers: followupAnswers
      };

      const newSolution = await generateSolution(post, null, optionsWithAnswers);

      // Log analytics for retry generation
      try {
        const analyticsData = extractSolutionAnalytics(post, newSolution, optionsWithAnswers, 0);
        await logSolutionGeneration(analyticsData);
      } catch (analyticsError) {
        console.error('Failed to log retry analytics:', analyticsError);
      }

      // Update the specific solution in the array
      setPostSolutions(prev => prev.map(item =>
        item.post.id === post.id
          ? {
              ...item,
              solution: newSolution,
              error: null
            }
          : item
      ));

      console.log(`✅ Retried solution generation for: "${post.title}"`);
    } catch (error) {
      console.error('Error retrying solution generation:', error);

      // Handle specific error types with user-friendly messages
      let errorMessage = 'Failed to retry solution generation';

      if (error.message.includes('overloaded') || error.message.includes('503')) {
        errorMessage = '🤖 AI service is temporarily busy. Please try again in a few minutes.';
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = '⏱️ Too many requests. Please wait a moment before trying again.';
      } else if (error.message.includes('quota')) {
        errorMessage = '📊 Daily AI usage limit reached. Please try again tomorrow.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Update with error
      setPostSolutions(prev => prev.map(item =>
        item.post.id === post.id
          ? { ...item, error: errorMessage }
          : item
      ));
    }
  };



  const handleReset = () => {
    setCurrentStep('select');
    setSelectedSubreddit('');
    setAvailablePosts([]);
    setSelectedPosts([]);
    setPostSolutions([]);
    setCurrentGeneratingIndex(0);
    setError('');
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'configure':
        setCurrentStep('select');
        setSelectedSubreddit('');
        break;
      case 'posts':
        setCurrentStep('configure');
        setAvailablePosts([]);
        setSelectedPosts([]);
        break;
      case 'generating':
        setCurrentStep('posts');
        setPostSolutions([]);
        setCurrentGeneratingIndex(0);
        break;
      case 'display':
        setCurrentStep('posts');
        setPostSolutions([]);
        break;
      case 'enterprise':
        setCurrentStep('posts');
        break;
      default:
        break;
    }
    setError('');
  };

  const handleGoHome = () => {
    setCurrentStep('select');
    setSelectedSubreddit('');
    setAvailablePosts([]);
    setSelectedPosts([]);
    setPostSolutions([]);
    setCurrentGeneratingIndex(0);
    setError('');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'select':
        return (
          <SubredditSelector
            onSelect={handleSubredditSelect}
            selectedSubreddit={selectedSubreddit}
            error={error}
          />
        );

      case 'configure':
        return (
          <PostCountSelector
            subreddit={selectedSubreddit}
            onFetchPosts={handleFetchPosts}
            isLoading={isLoading}
          />
        );

      case 'loading':
        return (
          <div className="card-elevated max-w-2xl mx-auto text-center py-16">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-purple rounded-full blur-xl opacity-20 animate-pulse"></div>
              <LoadingSpinner size="large" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-secondary-900">
              {availablePosts.length > 0 ? 'Processing Posts' : 'Fetching Reddit Posts'}
            </h3>
            <p className="mt-2 text-secondary-600">
              {availablePosts.length > 0
                ? 'Analyzing and filtering the most relevant questions...'
                : 'Connecting to Reddit and gathering fresh content...'}
            </p>
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        );

      case 'generating':
        return (
          <div className="card-elevated max-w-3xl mx-auto text-center py-16">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-gemini-blue to-accent-purple rounded-full blur-xl opacity-20 animate-pulse"></div>
              <LoadingSpinner size="large" />
            </div>

            <h3 className="text-2xl font-bold text-gradient-primary mb-2">
              Generating AI Solutions
            </h3>
            <p className="text-secondary-600 mb-8">
              Processing {currentGeneratingIndex + 1} of {selectedPosts.length} posts with Google Gemini AI
            </p>

            {/* Enhanced Progress Bar */}
            <div className="max-w-md mx-auto mb-6">
              <div className="flex justify-between text-sm text-secondary-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(((currentGeneratingIndex + 1) / selectedPosts.length) * 100)}%</span>
              </div>
              <div className="bg-secondary-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary-500 to-accent-purple h-3 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${((currentGeneratingIndex + 1) / selectedPosts.length) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-shimmer"></div>
                </div>
              </div>
            </div>

            {/* Current Post Info */}
            <div className="bg-secondary-50/80 backdrop-blur-sm rounded-xl p-4 max-w-lg mx-auto">
              <p className="text-sm font-medium text-secondary-700 mb-1">Currently analyzing:</p>
              <p className="text-secondary-900 font-medium line-clamp-2">
                {selectedPosts[currentGeneratingIndex]?.title}
              </p>
            </div>
          </div>
        );

      case 'posts':
        return (
          <div className="space-y-8">
            <PostSelector
              posts={availablePosts}
              onSelectPosts={handlePostsSelect}
              selectedPosts={selectedPosts}
              isLoading={isLoading}
              onGenerate={handleGenerateSolutions}
            />

            {selectedPosts.length > 0 && (
              <>
                {/* Solution Options */}
                <SolutionOptions
                  options={solutionOptions}
                  onOptionsChange={handleSolutionOptionsChange}
                  isVisible={showSolutionOptions}
                  onToggleVisibility={handleToggleSolutionOptions}
                />

                {/* Follow-up Questions */}
                {showFollowupQuestions && selectedPosts.length === 1 && (
                  <FollowUpQuestions
                    post={selectedPosts[0]}
                    solutionOptions={solutionOptions}
                    onQuestionsComplete={handleFollowupQuestionsComplete}
                    onSkip={handleSkipFollowupQuestions}
                    isVisible={showFollowupQuestions}
                  />
                )}

                {/* Generate Button */}
                {!showFollowupQuestions && (
                  <div className="flex justify-center animate-fade-in-up">
                    <div className="text-center space-y-4">
                      <div
                        className="backdrop-blur-sm rounded-xl p-4 border"
                        style={{
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                          borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
                        }}
                      >
                        <p
                          className="text-sm font-medium"
                          style={{ color: isDark ? '#60a5fa' : '#1e40af' }}
                        >
                          {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} selected for AI analysis
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: isDark ? '#8b949e' : '#6b7280' }}
                        >
                          Template: {solutionOptions.template} • Tone: {solutionOptions.tone} • Length: {solutionOptions.length}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={handleGenerateSolutions}
                          disabled={isLoading}
                          className="btn-primary text-lg px-8 py-4 shadow-glow-primary hover:shadow-glow-primary"
                        >
                          <Brain className="h-5 w-5 mr-2" />
                          Generate {selectedPosts.length} AI Solution{selectedPosts.length !== 1 ? 's' : ''}
                        </button>

                        <button
                          onClick={() => setCurrentStep('enterprise')}
                          disabled={isLoading}
                          className="btn-secondary text-lg px-8 py-4 border-2 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Building2 className="h-5 w-5 mr-2" />
                          Enterprise Analysis
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'display':
        return (
          <MultipleSolutionsDisplay
            postSolutions={postSolutions}
            onLike={handleLike}
            onRegenerateSolution={handleRegenerateSolution}
            onRetryGeneration={handleRetryGeneration}
            isLoading={isLoading}
          />
        );

      case 'enterprise':
        return (
          <EnterpriseSolutions
            selectedPosts={selectedPosts}
            onBack={() => setCurrentStep('posts')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-gradient-to-br from-secondary-50 via-white to-primary-50'}`} style={isDark ? {backgroundColor: '#0d1117'} : {}}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          },
        }}
      />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-secondary-200/50 sticky top-0 z-50 dark:bg-dark-surface/95 dark:border-dark-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {currentStep !== 'select' && (
                <button
                  onClick={handleBack}
                  className="p-2 sm:p-3 rounded-xl transition-all duration-200 hover:scale-105 focus-ring"
                  style={{
                    color: isDark ? '#8b949e' : '#64748b',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = isDark ? '#f0f6fc' : '#374151';
                    e.target.style.backgroundColor = isDark ? '#262c36' : '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = isDark ? '#8b949e' : '#64748b';
                    e.target.style.backgroundColor = 'transparent';
                  }}
                  title="Go back"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}

              {/* Brand Logo - Clickable */}
              <button
                onClick={isAuthenticated ? handleGoHome : undefined}
                className={`flex items-center space-x-2 sm:space-x-3 ${isAuthenticated ? 'cursor-pointer hover:opacity-80 transition-opacity duration-200' : 'cursor-default'}`}
                disabled={!isAuthenticated}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-reddit-orange to-accent-orange rounded-lg sm:rounded-xl blur opacity-20"></div>
                  <div className="relative bg-gradient-to-r from-reddit-orange to-accent-orange p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                    <MessageCircle className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-lg sm:text-2xl font-bold text-secondary-400">×</span>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gemini-blue to-primary-600 rounded-lg sm:rounded-xl blur opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-gemini-blue to-primary-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                      <Brain className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                </div>
              </button>

              {/* Brand Text - Clickable */}
              <button
                onClick={isAuthenticated ? handleGoHome : undefined}
                className={`hidden sm:block text-left ${isAuthenticated ? 'cursor-pointer hover:opacity-80 transition-opacity duration-200' : 'cursor-default'}`}
                disabled={!isAuthenticated}
              >
                <h1 className="text-xl lg:text-2xl font-bold text-gradient-primary">
                  Reddit AI Solutions
                </h1>
                <p className="text-xs lg:text-sm font-medium" style={{color: isDark ? '#8b949e' : '#64748b'}}>
                  Intelligent answers powered by Gemini AI
                </p>
              </button>

              {/* Mobile Brand Text - Clickable */}
              <button
                onClick={isAuthenticated ? handleGoHome : undefined}
                className={`block sm:hidden ${isAuthenticated ? 'cursor-pointer hover:opacity-80 transition-opacity duration-200' : 'cursor-default'}`}
                disabled={!isAuthenticated}
              >
                <h1 className="text-lg font-bold text-gradient-primary">
                  Reddit AI
                </h1>
              </button>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <ThemeToggle />

              {isAuthenticated && (
                <>
                  <button
                    onClick={() => setShowStatistics(!showStatistics)}
                    className="p-2 sm:p-3 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105 focus-ring"
                    title="View Statistics"
                  >
                    <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {selectedPosts.length > 0 && (
                    <button
                      onClick={() => setCurrentStep('enterprise')}
                      className="p-2 sm:p-3 text-secondary-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 hover:scale-105 focus-ring"
                      title="Enterprise Solutions"
                    >
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}

                </>
              )}

              {/* Authentication Buttons */}
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setShowProfilePage(true)}
                    className="p-1 sm:p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105 focus-ring"
                    title="User Profile"
                  >
                    {user?.avatar ? (
                      <img
                        src={getAvatarUrl(user.avatar)}
                        alt={user.username}
                        className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <User
                      className={`h-4 w-4 sm:h-5 sm:w-5 ${user?.avatar ? 'hidden' : 'block'}`}
                    />
                  </button>

                  {isAdmin() && (
                    <button
                      onClick={() => setShowAdminPage(true)}
                      className="p-2 sm:p-3 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105 focus-ring"
                      title="Admin Dashboard"
                    >
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => {
                    setAuthModalMode('login');
                    setShowAuthModal(true);
                  }}
                  className="p-2 sm:p-3 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105 focus-ring"
                  title="Sign In"
                >
                  <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}

              {currentStep !== 'select' && (
                <button
                  onClick={handleReset}
                  className="btn-secondary text-xs sm:text-sm px-3 sm:px-6 py-2 sm:py-3"
                >
                  <span className="hidden sm:inline">New Search</span>
                  <span className="sm:hidden">New</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {showStatistics && isAuthenticated && (
          <div className="mb-8 sm:mb-12 animate-fade-in-up">
            <Statistics onClose={() => setShowStatistics(false)} />
          </div>
        )}

        <div className="space-y-6 sm:space-y-8">
          {isAuthenticated ? (
            renderCurrentStep()
          ) : (
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              {/* Hero Section */}
              <div className="text-center py-12 sm:py-20">
                <div className="max-w-4xl mx-auto">
                  {/* Animated Logo */}
                  <div className="relative mb-8">
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-reddit-orange to-accent-orange rounded-2xl blur opacity-30 animate-pulse"></div>
                        <div className="relative bg-gradient-to-r from-reddit-orange to-accent-orange p-4 rounded-2xl">
                          <MessageCircle className="h-12 w-12 text-white" />
                        </div>
                      </div>
                      <span className="text-4xl font-bold text-secondary-400">×</span>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-gemini-blue to-primary-600 rounded-2xl blur opacity-30 animate-pulse"></div>
                        <div className="relative bg-gradient-to-r from-gemini-blue to-primary-600 p-4 rounded-2xl">
                          <Brain className="h-12 w-12 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h1 className="text-4xl sm:text-6xl font-bold mb-6 text-gradient-primary">
                    Reddit AI Solutions
                  </h1>

                  <p className="text-xl sm:text-2xl mb-8 font-medium" style={{color: isDark ? '#8b949e' : '#64748b'}}>
                    Transform Reddit discussions into intelligent, actionable advice
                  </p>

                  <p className="text-lg mb-12 max-w-2xl mx-auto" style={{color: isDark ? '#8b949e' : '#6b7280'}}>
                    Powered by Google's Gemini AI, our platform analyzes Reddit posts and generates thoughtful,
                    personalized solutions to help people navigate life's challenges.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                    <button
                      onClick={() => {
                        setAuthModalMode('register');
                        setShowAuthModal(true);
                      }}
                      className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-gemini-blue to-primary-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      <LogIn className="h-5 w-5" />
                      <span>Get Started Free</span>
                    </button>

                    <button
                      onClick={() => {
                        setAuthModalMode('login');
                        setShowAuthModal(true);
                      }}
                      className="inline-flex items-center space-x-3 px-8 py-4 border-2 font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                      style={{
                        borderColor: isDark ? '#30363d' : '#e5e7eb',
                        color: isDark ? '#f0f6fc' : '#111827',
                        backgroundColor: isDark ? 'transparent' : 'white'
                      }}
                    >
                      <User className="h-5 w-5" />
                      <span>Sign In</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="text-center p-6 rounded-2xl border" style={{
                  backgroundColor: isDark ? '#161b22' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#e5e7eb'
                }}>
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl mx-auto w-16 h-16 flex items-center justify-center">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                    AI-Powered Analysis
                  </h3>
                  <p className="text-sm" style={{color: isDark ? '#8b949e' : '#6b7280'}}>
                    Advanced AI analyzes Reddit posts and generates personalized, thoughtful solutions tailored to each situation.
                  </p>
                </div>

                <div className="text-center p-6 rounded-2xl border" style={{
                  backgroundColor: isDark ? '#161b22' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#e5e7eb'
                }}>
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl blur opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-green-500 to-teal-600 p-3 rounded-xl mx-auto w-16 h-16 flex items-center justify-center">
                      <MessageCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                    Reddit Integration
                  </h3>
                  <p className="text-sm" style={{color: isDark ? '#8b949e' : '#6b7280'}}>
                    Seamlessly browse and analyze posts from any subreddit to find the most relevant discussions.
                  </p>
                </div>

                <div className="text-center p-6 rounded-2xl border" style={{
                  backgroundColor: isDark ? '#161b22' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#e5e7eb'
                }}>
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl blur opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-xl mx-auto w-16 h-16 flex items-center justify-center">
                      <FileSpreadsheet className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                    Track & Improve
                  </h3>
                  <p className="text-sm" style={{color: isDark ? '#8b949e' : '#6b7280'}}>
                    Monitor your usage, bookmark solutions, and get insights to continuously improve your experience.
                  </p>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="bg-gradient-to-r from-gemini-blue/10 to-primary-600/10 rounded-3xl p-8 sm:p-12 mb-16 border" style={{
                borderColor: isDark ? '#30363d' : '#e5e7eb'
              }}>
                <div className="max-w-3xl mx-auto text-center">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                    Why Choose Reddit AI Solutions?
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-6 text-left">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                          Intelligent Solutions
                        </h4>
                        <p className="text-sm" style={{color: isDark ? '#8b949e' : '#6b7280'}}>
                          Get AI-powered advice that understands context and nuance
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                          Personal Analytics
                        </h4>
                        <p className="text-sm" style={{color: isDark ? '#8b949e' : '#6b7280'}}>
                          Track your usage and see how solutions help over time
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                          Bookmark & Save
                        </h4>
                        <p className="text-sm" style={{color: isDark ? '#8b949e' : '#6b7280'}}>
                          Save helpful solutions for future reference
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                          Continuous Learning
                        </h4>
                        <p className="text-sm" style={{color: isDark ? '#8b949e' : '#6b7280'}}>
                          AI improves based on your feedback and preferences
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center py-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                  Ready to Get Started?
                </h2>
                <p className="text-lg mb-8 max-w-2xl mx-auto" style={{color: isDark ? '#8b949e' : '#6b7280'}}>
                  Join thousands of users who are already getting smarter solutions to life's challenges.
                </p>
                <button
                  onClick={() => {
                    setAuthModalMode('register');
                    setShowAuthModal(true);
                  }}
                  className="inline-flex items-center space-x-3 px-10 py-5 bg-gradient-to-r from-gemini-blue to-primary-600 text-white font-bold text-lg rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  <LogIn className="h-6 w-6" />
                  <span>Start Your Journey</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-md border-t border-secondary-200/50 mt-12 sm:mt-20 dark:bg-dark-surface/60 dark:border-dark-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Brand Section */}
            <div className="space-y-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-reddit-orange to-accent-orange rounded-lg blur opacity-20"></div>
                  <div className="relative bg-gradient-to-r from-reddit-orange to-accent-orange p-2 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <span className="font-bold text-base sm:text-lg text-gradient-primary">Reddit AI Solutions</span>
              </div>
              <p className="text-secondary-600 text-sm leading-relaxed max-w-sm">
                Transforming Reddit discussions into actionable insights with the power of Google Gemini AI.
              </p>
            </div>

            {/* Features Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-secondary-900 text-sm sm:text-base">Features</h3>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0"></div>
                  <span>AI-Powered Solutions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0"></div>
                  <span>Multi-Post Analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0"></div>
                  <span>Real-time Feedback</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0"></div>
                  <span>Smart Regeneration</span>
                </li>
              </ul>
            </div>

            {/* Tech Stack Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-secondary-900 text-sm sm:text-base">Powered By</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-gemini-blue to-primary-600 rounded-lg blur opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-gemini-blue to-primary-600 p-1.5 rounded-lg">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-secondary-700">Google Gemini AI</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-reddit-orange to-accent-orange rounded-lg blur opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-reddit-orange to-accent-orange p-1.5 rounded-lg">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-secondary-700">Reddit API</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-secondary-200/50 dark:border-dark-border">
            <div className="text-center">
              <p className="text-xs sm:text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                © 2025 <span className="text-gradient-primary">Reddit AI Solutions</span>. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>



      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode={authModalMode}
        />
      )}

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile onClose={() => setShowUserProfile(false)} />
      )}

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}

      {/* Admin Page - Full Screen */}
      {showAdminPage && (
        <AdminPage onClose={() => setShowAdminPage(false)} />
      )}

      {/* Profile Page - Full Screen */}
      {showProfilePage && (
        <ProfilePage onClose={() => setShowProfilePage(false)} />
      )}

      {/* Enterprise Page - Full Screen */}
      {showEnterprisePage && (
        <div>
          {console.log('🏢 Rendering Enterprise Page, showEnterprisePage:', showEnterprisePage)}
          <EnterprisePage onClose={() => setShowEnterprisePage(false)} />
        </div>
      )}

      {/* Session Warning Modal */}
      <SessionWarning
        isVisible={showSessionWarning}
        remainingTime={sessionTimeLeft}
        onExtend={handleExtendSession}
        onLogout={handleSessionLogout}
        onDismiss={handleDismissSessionWarning}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen transition-colors duration-200">
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                border: '1px solid var(--toast-border)',
              },
            }}
          />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
