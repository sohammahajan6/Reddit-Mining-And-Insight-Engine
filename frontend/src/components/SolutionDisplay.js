import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Brain, Copy, Check, Clock } from 'lucide-react';
import { calculateReadingTime, extractKeyPoints } from '../services/geminiService';
import { useTheme } from '../contexts/ThemeContext';

const SolutionDisplay = ({ solution, onLike, onDislike, showActions = true, isLoading = false }) => {
  const [copied, setCopied] = useState(false);
  const { isDark } = useTheme();

  if (!solution) return null;

  const readingTime = calculateReadingTime(solution);
  const keyPoints = extractKeyPoints(solution);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(solution);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatSolutionText = (text) => {
    // Split by double newlines to create sections
    const sections = text.split('\n\n');

    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return null;

      // Check for headers (## Header)
      if (trimmedSection.startsWith('## ')) {
        const headerText = trimmedSection.replace('## ', '');
        return (
          <h3
            key={index}
            className="text-lg font-semibold mt-6 mb-3 pb-2 border-b"
            style={{
              color: isDark ? '#60a5fa' : '#1e40af',
              borderColor: isDark ? '#30363d' : '#e5e7eb'
            }}
          >
            {headerText}
          </h3>
        );
      }

      // Check for bullet points (• item)
      if (trimmedSection.includes('•')) {
        const items = trimmedSection.split('\n').filter(line => line.trim().startsWith('•'));
        if (items.length > 0) {
          return (
            <div key={index} className="mb-4">
              <ul className="space-y-2">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <span
                      className="inline-block w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                      style={{
                        backgroundColor: isDark ? '#60a5fa' : '#3b82f6'
                      }}
                    ></span>
                    <span className="leading-relaxed">
                      {formatInlineText(item.replace('•', '').trim())}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      }

      // Check for numbered lists (1. item)
      if (trimmedSection.match(/^\d+\./)) {
        const items = trimmedSection.split('\n').filter(line => line.trim().match(/^\d+\./));
        if (items.length > 0) {
          return (
            <div key={index} className="mb-4">
              <ol className="space-y-2">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mr-3 flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: isDark ? '#3b82f6' : '#dbeafe',
                        color: isDark ? '#ffffff' : '#1e40af'
                      }}
                    >
                      {itemIndex + 1}
                    </span>
                    <span className="leading-relaxed">
                      {formatInlineText(item.replace(/^\d+\./, '').trim())}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          );
        }
      }

      // Regular paragraph
      return (
        <p key={index} className="mb-4 leading-relaxed">
          {formatInlineText(trimmedSection)}
        </p>
      );
    }).filter(Boolean);
  };

  const formatInlineText = (text) => {
    // Handle **bold** text
    return text.split(/(\*\*[^*]+\*\*)/).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} style={{ color: isDark ? '#f1f5f9' : '#1f2937' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="solution-card animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-gemini-blue" />
          <h3 className="text-lg font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
            AI-Generated Solution
          </h3>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-sm" style={{color: isDark ? '#8b949e' : '#4b5563'}}>
            <Clock className="h-4 w-4 mr-1" />
            <span>{readingTime} min read</span>
          </div>
          
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg transition-colors"
            style={{
              color: isDark ? '#8b949e' : '#4b5563',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = isDark ? '#f0f6fc' : '#111827';
              e.target.style.backgroundColor = isDark ? '#262c36' : '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = isDark ? '#8b949e' : '#4b5563';
              e.target.style.backgroundColor = 'transparent';
            }}
            title="Copy solution"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Key Points Preview */}
      {keyPoints.length > 0 && (
        <div
          className="mb-4 p-3 rounded-lg border"
          style={{
            backgroundColor: isDark ? '#161b22' : 'white',
            borderColor: isDark ? '#30363d' : '#dbeafe'
          }}
        >
          <h4 className="text-sm font-medium mb-2" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
            📋 Key Points:
          </h4>
          <ul className="text-sm space-y-1" style={{color: isDark ? '#8b949e' : '#374151'}}>
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start">
                <span className="text-gemini-blue mr-2">•</span>
                <span>{point.replace(/^[•\-\*\d+\.]\s*/, '')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Solution Content */}
      <div className="prose prose-sm max-w-none mb-6">
        <div className="leading-relaxed" style={{color: isDark ? '#f0f6fc' : '#1f2937'}}>
          {formatSolutionText(solution)}
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center justify-center space-x-4 pt-4 border-t border-blue-200">
          <button
            onClick={onLike}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ThumbsUp className="h-5 w-5" />
            <span className="font-medium">Helpful</span>
          </button>
          
          <button
            onClick={onDislike}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ThumbsDown className="h-5 w-5" />
            <span className="font-medium">Not Helpful</span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="loading-spinner mr-2" />
          <span className="text-sm text-gray-600">Processing your feedback...</span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-blue-200 text-xs text-gray-500 text-center">
        Generated by Google Gemini AI • Always verify important advice
      </div>
    </div>
  );
};

export default SolutionDisplay;
