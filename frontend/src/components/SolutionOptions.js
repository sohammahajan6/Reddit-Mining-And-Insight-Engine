import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Settings, 
  MessageSquare, 
  Volume2, 
  FileText, 
  Heart,
  Briefcase,
  Code,
  Users,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SolutionOptions = ({ options, onOptionsChange, isVisible, onToggleVisibility }) => {
  const { isDark } = useTheme();
  const [expandedSections, setExpandedSections] = useState({
    template: true,
    tone: true,
    length: true,
    followup: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const templates = [
    {
      id: 'general',
      name: 'General Advice',
      icon: MessageSquare,
      description: 'Balanced approach for any type of problem',
      color: '#3b82f6'
    },
    {
      id: 'relationship',
      name: 'Relationship',
      icon: Heart,
      description: 'Empathetic advice for personal relationships',
      color: '#ef4444'
    },
    {
      id: 'career',
      name: 'Career & Work',
      icon: Briefcase,
      description: 'Professional guidance for workplace issues',
      color: '#059669'
    },
    {
      id: 'technical',
      name: 'Technical',
      icon: Code,
      description: 'Step-by-step solutions for technical problems',
      color: '#7c3aed'
    },
    {
      id: 'social',
      name: 'Social Skills',
      icon: Users,
      description: 'Advice for social situations and interactions',
      color: '#ea580c'
    }
  ];

  const tones = [
    { id: 'empathetic', name: 'Empathetic', description: 'Warm and understanding' },
    { id: 'professional', name: 'Professional', description: 'Formal and business-like' },
    { id: 'casual', name: 'Casual', description: 'Friendly and conversational' },
    { id: 'direct', name: 'Direct', description: 'Straight to the point' }
  ];

  const lengths = [
    { id: 'short', name: 'Short', description: '100-200 words', time: '1 min read' },
    { id: 'medium', name: 'Medium', description: '300-500 words', time: '2-3 min read' },
    { id: 'detailed', name: 'Detailed', description: '600-800 words', time: '4-5 min read' }
  ];

  const handleOptionChange = (category, value) => {
    onOptionsChange({
      ...options,
      [category]: value
    });
  };

  if (!isVisible) {
    return (
      <div className="mb-6">
        <button
          onClick={onToggleVisibility}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors"
          style={{
            backgroundColor: isDark ? '#21262d' : '#f8fafc',
            borderColor: isDark ? '#30363d' : '#e2e8f0',
            color: isDark ? '#f0f6fc' : '#374151'
          }}
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Customize Solution</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="mb-6 rounded-xl border p-6"
      style={{
        backgroundColor: isDark ? '#161b22' : '#ffffff',
        borderColor: isDark ? '#30363d' : '#e2e8f0'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
          <h3 
            className="text-lg font-semibold"
            style={{ color: isDark ? '#f0f6fc' : '#111827' }}
          >
            Solution Options
          </h3>
        </div>
        <button
          onClick={onToggleVisibility}
          className="p-1 rounded-md transition-colors"
          style={{
            color: isDark ? '#8b949e' : '#6b7280'
          }}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      {/* Solution Templates */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('template')}
          className="flex items-center justify-between w-full mb-3"
        >
          <h4 
            className="text-base font-medium"
            style={{ color: isDark ? '#f0f6fc' : '#374151' }}
          >
            Solution Template
          </h4>
          {expandedSections.template ? 
            <ChevronUp className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} /> :
            <ChevronDown className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
          }
        </button>
        
        {expandedSections.template && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((template) => {
              const Icon = template.icon;
              const isSelected = options.template === template.id;
              
              return (
                <button
                  key={template.id}
                  onClick={() => handleOptionChange('template', template.id)}
                  className="p-3 rounded-lg border text-left transition-all"
                  style={{
                    backgroundColor: isSelected 
                      ? (isDark ? '#1e293b' : '#eff6ff')
                      : (isDark ? '#21262d' : '#f8fafc'),
                    borderColor: isSelected 
                      ? template.color 
                      : (isDark ? '#30363d' : '#e2e8f0'),
                    borderWidth: isSelected ? '2px' : '1px'
                  }}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon 
                      className="h-4 w-4" 
                      style={{ color: template.color }}
                    />
                    <span 
                      className="font-medium text-sm"
                      style={{ color: isDark ? '#f0f6fc' : '#111827' }}
                    >
                      {template.name}
                    </span>
                  </div>
                  <p 
                    className="text-xs"
                    style={{ color: isDark ? '#8b949e' : '#6b7280' }}
                  >
                    {template.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tone Selection */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('tone')}
          className="flex items-center justify-between w-full mb-3"
        >
          <h4 
            className="text-base font-medium"
            style={{ color: isDark ? '#f0f6fc' : '#374151' }}
          >
            Response Tone
          </h4>
          {expandedSections.tone ? 
            <ChevronUp className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} /> :
            <ChevronDown className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
          }
        </button>
        
        {expandedSections.tone && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {tones.map((tone) => {
              const isSelected = options.tone === tone.id;
              
              return (
                <button
                  key={tone.id}
                  onClick={() => handleOptionChange('tone', tone.id)}
                  className="p-3 rounded-lg border text-center transition-all"
                  style={{
                    backgroundColor: isSelected 
                      ? (isDark ? '#1e293b' : '#eff6ff')
                      : (isDark ? '#21262d' : '#f8fafc'),
                    borderColor: isSelected 
                      ? '#3b82f6' 
                      : (isDark ? '#30363d' : '#e2e8f0'),
                    borderWidth: isSelected ? '2px' : '1px'
                  }}
                >
                  <div 
                    className="font-medium text-sm mb-1"
                    style={{ color: isDark ? '#f0f6fc' : '#111827' }}
                  >
                    {tone.name}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: isDark ? '#8b949e' : '#6b7280' }}
                  >
                    {tone.description}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Length Control */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('length')}
          className="flex items-center justify-between w-full mb-3"
        >
          <h4 
            className="text-base font-medium"
            style={{ color: isDark ? '#f0f6fc' : '#374151' }}
          >
            Response Length
          </h4>
          {expandedSections.length ? 
            <ChevronUp className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} /> :
            <ChevronDown className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
          }
        </button>
        
        {expandedSections.length && (
          <div className="grid grid-cols-3 gap-2">
            {lengths.map((length) => {
              const isSelected = options.length === length.id;
              
              return (
                <button
                  key={length.id}
                  onClick={() => handleOptionChange('length', length.id)}
                  className="p-3 rounded-lg border text-center transition-all"
                  style={{
                    backgroundColor: isSelected 
                      ? (isDark ? '#1e293b' : '#eff6ff')
                      : (isDark ? '#21262d' : '#f8fafc'),
                    borderColor: isSelected 
                      ? '#3b82f6' 
                      : (isDark ? '#30363d' : '#e2e8f0'),
                    borderWidth: isSelected ? '2px' : '1px'
                  }}
                >
                  <div 
                    className="font-medium text-sm mb-1"
                    style={{ color: isDark ? '#f0f6fc' : '#111827' }}
                  >
                    {length.name}
                  </div>
                  <div 
                    className="text-xs mb-1"
                    style={{ color: isDark ? '#8b949e' : '#6b7280' }}
                  >
                    {length.description}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}
                  >
                    {length.time}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Follow-up Questions Toggle */}
      <div>
        <button
          onClick={() => toggleSection('followup')}
          className="flex items-center justify-between w-full mb-3"
        >
          <h4 
            className="text-base font-medium"
            style={{ color: isDark ? '#f0f6fc' : '#374151' }}
          >
            Follow-up Questions
          </h4>
          {expandedSections.followup ? 
            <ChevronUp className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} /> :
            <ChevronDown className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
          }
        </button>
        
        {expandedSections.followup && (
          <div className="flex items-center justify-between p-3 rounded-lg border"
            style={{
              backgroundColor: isDark ? '#21262d' : '#f8fafc',
              borderColor: isDark ? '#30363d' : '#e2e8f0'
            }}
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="h-5 w-5" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
              <div>
                <div 
                  className="font-medium text-sm"
                  style={{ color: isDark ? '#f0f6fc' : '#111827' }}
                >
                  Ask clarifying questions first
                </div>
                <div 
                  className="text-xs"
                  style={{ color: isDark ? '#8b949e' : '#6b7280' }}
                >
                  AI will ask questions to better understand the problem
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={options.followupQuestions}
                onChange={(e) => handleOptionChange('followupQuestions', e.target.checked)}
                className="sr-only peer"
              />
              <div 
                className="w-11 h-6 rounded-full peer transition-colors peer-checked:bg-blue-600"
                style={{
                  backgroundColor: options.followupQuestions 
                    ? '#3b82f6' 
                    : (isDark ? '#374151' : '#d1d5db')
                }}
              >
                <div 
                  className="w-5 h-5 bg-white rounded-full shadow transform transition-transform peer-checked:translate-x-5"
                  style={{
                    transform: options.followupQuestions ? 'translateX(20px)' : 'translateX(0px)'
                  }}
                ></div>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default SolutionOptions;
