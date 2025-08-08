import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Search, TrendingUp, AlertCircle, MessageCircle, Brain, Building2 } from 'lucide-react';
import { getPopularSubreddits, validateSubreddit } from '../services/redditService';
import { useTheme } from '../contexts/ThemeContext';
import ServiceStatus from './ServiceStatus';

const SubredditSelector = ({ onSelect, selectedSubreddit, error }) => {
  const { isDark } = useTheme();
  const [popularSubreddits, setPopularSubreddits] = useState([]);
  const [customSubreddit, setCustomSubreddit] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [mode, setMode] = useState('popular'); // 'popular', 'custom', or 'enterprise'

  useEffect(() => {
    loadPopularSubreddits();
  }, []);

  const loadPopularSubreddits = async () => {
    try {
      const subreddits = await getPopularSubreddits();
      setPopularSubreddits(subreddits);
    } catch (err) {
      console.error('Failed to load popular subreddits:', err);
    }
  };

  const handlePopularSelect = (selectedOption) => {
    if (selectedOption) {
      onSelect(selectedOption.value);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    
    if (!customSubreddit.trim()) {
      setValidationError('Please enter a subreddit name');
      return;
    }

    const subredditName = customSubreddit.trim().toLowerCase();
    
    // Basic validation
    if (!/^[a-zA-Z0-9_]+$/.test(subredditName)) {
      setValidationError('Subreddit name can only contain letters, numbers, and underscores');
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      const isValid = await validateSubreddit(subredditName);
      
      if (isValid) {
        onSelect(subredditName);
      } else {
        setValidationError(`r/${subredditName} not found or inaccessible`);
      }
    } catch (err) {
      setValidationError('Failed to validate subreddit');
    } finally {
      setIsValidating(false);
    }
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#58a6ff' : (isDark ? '#30363d' : '#cbd5e1'),
      borderRadius: '12px',
      borderWidth: '1px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(88, 166, 255, 0.1)' : 'none',
      backgroundColor: isDark ? '#0d1117' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      minHeight: '48px',
      color: isDark ? '#f0f6fc' : '#1e293b',
      '&:hover': {
        borderColor: isDark ? '#484f58' : '#0ea5e9'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#58a6ff'
        : state.isFocused
          ? (isDark ? '#262c36' : 'rgba(14, 165, 233, 0.1)')
          : (isDark ? '#161b22' : 'white'),
      color: state.isSelected ? 'white' : (isDark ? '#f0f6fc' : '#1e293b'),
      padding: '12px 16px',
      '&:hover': {
        backgroundColor: state.isSelected ? '#4493f8' : (isDark ? '#262c36' : 'rgba(14, 165, 233, 0.1)')
      }
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '12px',
      border: `1px solid ${isDark ? '#30363d' : '#e2e8f0'}`,
      backgroundColor: isDark ? '#161b22' : 'white',
      boxShadow: isDark ? '0 16px 70px rgba(0, 0, 0, 0.8)' : '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
      overflow: 'hidden'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: isDark ? '#8b949e' : '#64748b',
      fontWeight: '500'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDark ? '#f0f6fc' : '#1e293b'
    }),
    input: (provided) => ({
      ...provided,
      color: isDark ? '#f0f6fc' : '#1e293b'
    })
  };

  return (
    <div className="card-elevated max-w-3xl mx-auto" style={isDark ? {
      backgroundColor: '#161b22',
      borderColor: '#30363d'
    } : {}}>
      <div className="text-center mb-8">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-reddit-orange to-accent-orange rounded-2xl blur opacity-20"></div>
          <div className="relative bg-gradient-to-r from-reddit-orange to-accent-orange p-3 rounded-2xl">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gradient-primary mb-3">
          Choose Your Community
        </h2>
        <p className="text-secondary-600 text-lg leading-relaxed max-w-lg mx-auto" style={{color: isDark ? '#8b949e' : '#64748b'}}>
          Select from trending subreddits or discover any public community to analyze
        </p>
      </div>

      {/* Enhanced Mode Toggle */}
      <div className="flex backdrop-blur-sm rounded-2xl p-1.5 mb-8" style={{backgroundColor: isDark ? '#21262d' : 'rgba(241, 245, 249, 0.8)'}}>
        <button
          onClick={() => setMode('popular')}
          className="flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300"
          style={{
            backgroundColor: mode === 'popular' ? (isDark ? '#161b22' : 'white') : 'transparent',
            color: mode === 'popular'
              ? (isDark ? '#58a6ff' : '#0ea5e9')
              : (isDark ? '#8b949e' : '#64748b'),
            transform: mode === 'popular' ? 'scale(1.02)' : 'scale(1)',
            boxShadow: mode === 'popular' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (mode !== 'popular') {
              e.target.style.backgroundColor = isDark ? 'rgba(22, 27, 34, 0.5)' : 'rgba(255, 255, 255, 0.5)';
              e.target.style.color = isDark ? '#f0f6fc' : '#1e293b';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'popular') {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = isDark ? '#8b949e' : '#64748b';
            }
          }}
        >
          <TrendingUp className="h-4 w-4 inline mr-2" />
          Popular Communities
        </button>
        <button
          onClick={() => setMode('custom')}
          className="flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300"
          style={{
            backgroundColor: mode === 'custom' ? (isDark ? '#161b22' : 'white') : 'transparent',
            color: mode === 'custom'
              ? (isDark ? '#58a6ff' : '#0ea5e9')
              : (isDark ? '#8b949e' : '#64748b'),
            transform: mode === 'custom' ? 'scale(1.02)' : 'scale(1)',
            boxShadow: mode === 'custom' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (mode !== 'custom') {
              e.target.style.backgroundColor = isDark ? 'rgba(22, 27, 34, 0.5)' : 'rgba(255, 255, 255, 0.5)';
              e.target.style.color = isDark ? '#f0f6fc' : '#1e293b';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'custom') {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = isDark ? '#8b949e' : '#64748b';
            }
          }}
        >
          <Search className="h-4 w-4 inline mr-2" />
          Custom Search
        </button>
        <button
          onClick={() => setMode('enterprise')}
          className="flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300"
          style={{
            backgroundColor: mode === 'enterprise' ? (isDark ? '#161b22' : 'white') : 'transparent',
            color: mode === 'enterprise'
              ? (isDark ? '#58a6ff' : '#0ea5e9')
              : (isDark ? '#8b949e' : '#64748b'),
            transform: mode === 'enterprise' ? 'scale(1.02)' : 'scale(1)',
            boxShadow: mode === 'enterprise' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (mode !== 'enterprise') {
              e.target.style.backgroundColor = isDark ? 'rgba(22, 27, 34, 0.5)' : 'rgba(255, 255, 255, 0.5)';
              e.target.style.color = isDark ? '#f0f6fc' : '#1e293b';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'enterprise') {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = isDark ? '#8b949e' : '#64748b';
            }
          }}
        >
          <Building2 className="h-4 w-4 inline mr-2" />
          Enterprise
        </button>
      </div>

      {/* Popular Subreddits Mode */}
      {mode === 'popular' && (
        <div className="animate-fade-in-up">
          <label className="block text-sm font-semibold mb-4" style={{color: isDark ? '#f0f6fc' : '#374151'}}>
            Select from trending communities:
          </label>
          <Select
            options={popularSubreddits}
            onChange={handlePopularSelect}
            placeholder="Choose a community to explore..."
            isSearchable
            styles={customSelectStyles}
            className="mb-6"
            formatOptionLabel={(option) => (
              <div className="flex items-center py-1">
                <div className="flex items-center bg-gradient-to-r from-reddit-orange to-accent-orange rounded-lg px-2 py-1 mr-3">
                  <span className="text-white font-bold text-xs">r/</span>
                </div>
                <span className="font-medium" style={{color: isDark ? '#f0f6fc' : '#111827'}}>{option.name}</span>
              </div>
            )}
          />

          {popularSubreddits.length > 0 && (
            <div
              className="backdrop-blur-sm rounded-xl p-4 border"
              style={{
                backgroundColor: isDark ? '#21262d' : 'rgba(239, 246, 255, 0.8)',
                borderColor: isDark ? '#30363d' : 'rgba(59, 130, 246, 0.5)'
              }}
            >
              <p className="text-sm font-medium mb-2" style={{color: isDark ? '#58a6ff' : '#1d4ed8'}}>
                🔥 Trending Communities:
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSubreddits.slice(0, 6).map((subreddit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border"
                    style={{
                      backgroundColor: isDark ? '#161b22' : 'rgba(255, 255, 255, 0.8)',
                      color: isDark ? '#58a6ff' : '#2563eb',
                      borderColor: isDark ? '#30363d' : '#dbeafe'
                    }}
                  >
                    r/{subreddit.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Subreddit Mode */}
      {mode === 'custom' && (
        <form onSubmit={handleCustomSubmit} className="animate-fade-in-up">
          <label className="block text-sm font-semibold mb-4" style={{color: isDark ? '#f0f6fc' : '#374151'}}>
            Enter any subreddit name:
          </label>
          <div className="flex items-stretch space-x-3">
            <div className="flex items-center bg-gradient-to-r from-reddit-orange to-accent-orange rounded-xl px-4 shadow-soft">
              <span className="text-white font-bold text-lg">r/</span>
            </div>
            <input
              type="text"
              value={customSubreddit}
              onChange={(e) => {
                setCustomSubreddit(e.target.value);
                setValidationError('');
              }}
              placeholder="askreddit, programming, science..."
              className="input-field flex-1 text-lg"
              disabled={isValidating}
            />
            <button
              type="submit"
              disabled={isValidating || !customSubreddit.trim()}
              className="btn-primary px-6 disabled:opacity-50"
            >
              {isValidating ? (
                <div className="loading-spinner" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </div>

          {validationError && (
            <div className="mt-4 alert-error animate-fade-in">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="font-medium">{validationError}</span>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Enterprise Mode */}
      {mode === 'enterprise' && (
        <div className="animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gradient-primary mb-4">
              Enterprise Solutions
            </h3>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto mb-8">
              Discover business opportunities from Reddit discussions. Analyze problems, assess market potential,
              and get actionable insights for your next venture.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-8">
              <h4 className="text-lg font-semibold mb-4" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                🚀 Ready to Launch Your Enterprise Journey?
              </h4>
              <p className="text-secondary-600 mb-6">
                Access our dedicated Enterprise platform with business-focused subreddits,
                advanced analytics, and comprehensive opportunity assessment tools.
              </p>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onSelect) {
                    onSelect('enterprise-redirect');
                  }
                }}
                type="button"
                className="btn-primary text-lg px-8 py-4 shadow-glow-primary hover:shadow-glow-primary"
              >
                <Building2 className="h-5 w-5 mr-2" />
                Launch Enterprise Platform
              </button>
            </div>

            {/* Enterprise Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6 text-center">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 w-fit mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h5 className="font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                  Market Analysis
                </h5>
                <p className="text-sm text-secondary-600">
                  Comprehensive market size, competition, and growth potential assessment.
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-3 w-fit mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                </div>
                <h5 className="font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                  Risk Assessment
                </h5>
                <p className="text-sm text-secondary-600">
                  Identify technical, market, and competitive risks for informed decisions.
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3 w-fit mx-auto mb-4">
                  <Brain className="h-6 w-6 text-green-600" />
                </div>
                <h5 className="font-semibold mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
                  AI-Powered Insights
                </h5>
                <p className="text-sm text-secondary-600">
                  Advanced AI analysis for solution concepts and business strategies.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Error Display */}
      {error && (
        <div className="mt-6 animate-fade-in">
          <ServiceStatus
            error={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      )}

      {/* Enhanced Tips */}
      <div
        className="mt-8 backdrop-blur-sm border rounded-2xl p-6"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.9) 100%)',
          borderColor: isDark ? '#334155' : 'rgba(59, 130, 246, 0.3)'
        }}
      >
        <div className="flex items-center mb-6">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-lg blur opacity-30"
              style={{
                background: isDark
                  ? 'linear-gradient(45deg, #3b82f6, #8b5cf6)'
                  : 'linear-gradient(45deg, #3b82f6, #8b5cf6)'
              }}
            ></div>
            <div
              className="relative p-2 rounded-lg"
              style={{
                background: isDark
                  ? 'linear-gradient(45deg, #3b82f6, #8b5cf6)'
                  : 'linear-gradient(45deg, #3b82f6, #8b5cf6)'
              }}
            >
              <Brain className="h-5 w-5 text-white" />
            </div>
          </div>
          <h4
            className="ml-3 text-xl font-semibold"
            style={{
              color: isDark ? '#f1f5f9' : '#1e293b'
            }}
          >
            Smart Recommendations
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="flex items-start space-x-4">
              <div
                className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                style={{
                  backgroundColor: isDark ? '#60a5fa' : '#3b82f6'
                }}
              ></div>
              <div>
                <p
                  className="font-semibold text-base mb-1"
                  style={{
                    color: isDark ? '#f1f5f9' : '#1e293b'
                  }}
                >
                  Popular Communities
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: isDark ? '#cbd5e1' : '#64748b'
                  }}
                >
                  Curated list of active subreddits with quality discussions
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div
                className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                style={{
                  backgroundColor: isDark ? '#a78bfa' : '#8b5cf6'
                }}
              ></div>
              <div>
                <p
                  className="font-semibold text-base mb-1"
                  style={{
                    color: isDark ? '#f1f5f9' : '#1e293b'
                  }}
                >
                  Custom Search
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: isDark ? '#cbd5e1' : '#64748b'
                  }}
                >
                  Explore any public subreddit for specialized topics
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <div className="flex items-start space-x-4">
              <div
                className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                style={{
                  backgroundColor: isDark ? '#34d399' : '#10b981'
                }}
              ></div>
              <div>
                <p
                  className="font-semibold text-base mb-1"
                  style={{
                    color: isDark ? '#f1f5f9' : '#1e293b'
                  }}
                >
                  AI-Powered Analysis
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: isDark ? '#cbd5e1' : '#64748b'
                  }}
                >
                  Automatically finds the most relevant question posts
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div
                className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                style={{
                  backgroundColor: isDark ? '#fb923c' : '#f97316'
                }}
              ></div>
              <div>
                <p
                  className="font-semibold text-base mb-1"
                  style={{
                    color: isDark ? '#f1f5f9' : '#1e293b'
                  }}
                >
                  Quality Solutions
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: isDark ? '#cbd5e1' : '#64748b'
                  }}
                >
                  Generated by Google Gemini for accurate insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubredditSelector;
