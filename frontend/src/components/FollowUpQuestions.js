import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  MessageCircle, 
  Send, 
  Loader, 
  CheckCircle, 
  ArrowRight,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

const FollowUpQuestions = ({ 
  post, 
  solutionOptions, 
  onQuestionsComplete, 
  onSkip,
  isVisible 
}) => {
  const { isDark } = useTheme();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  useEffect(() => {
    if (isVisible && questions.length === 0) {
      generateFollowUpQuestions();
    }
  }, [isVisible, post, solutionOptions]);

  const generateFollowUpQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      // This would call the backend to generate follow-up questions
      // For now, we'll use template-based questions
      const templateQuestions = getTemplateQuestions(solutionOptions.template, post);
      setQuestions(templateQuestions);
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      // Fallback to basic questions
      setQuestions([
        {
          id: 1,
          text: "Can you provide more context about your specific situation?",
          type: "context"
        },
        {
          id: 2,
          text: "What have you already tried to address this issue?",
          type: "attempts"
        },
        {
          id: 3,
          text: "What would an ideal outcome look like for you?",
          type: "goals"
        }
      ]);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const getTemplateQuestions = (template, post) => {
    const questionTemplates = {
      relationship: [
        {
          id: 1,
          text: "How long have you been in this relationship/situation?",
          type: "duration"
        },
        {
          id: 2,
          text: "Have you tried discussing this with the other person involved?",
          type: "communication"
        },
        {
          id: 3,
          text: "What specific behaviors or actions are causing the most concern?",
          type: "specifics"
        }
      ],
      career: [
        {
          id: 1,
          text: "What is your current role and how long have you been in it?",
          type: "background"
        },
        {
          id: 2,
          text: "Have you discussed this with your manager or HR?",
          type: "escalation"
        },
        {
          id: 3,
          text: "What are your career goals in the next 1-2 years?",
          type: "goals"
        }
      ],
      technical: [
        {
          id: 1,
          text: "What specific error messages or symptoms are you experiencing?",
          type: "symptoms"
        },
        {
          id: 2,
          text: "What steps have you already taken to troubleshoot this?",
          type: "troubleshooting"
        },
        {
          id: 3,
          text: "What is your technical background and experience level?",
          type: "experience"
        }
      ],
      social: [
        {
          id: 1,
          text: "In what specific social situations do you feel most uncomfortable?",
          type: "context"
        },
        {
          id: 2,
          text: "How do you typically handle social interactions now?",
          type: "current_approach"
        },
        {
          id: 3,
          text: "What social skills would you most like to improve?",
          type: "goals"
        }
      ],
      general: [
        {
          id: 1,
          text: "Can you provide more details about the specific challenges you're facing?",
          type: "details"
        },
        {
          id: 2,
          text: "What resources or support do you currently have available?",
          type: "resources"
        },
        {
          id: 3,
          text: "What would success look like to you in this situation?",
          type: "success_criteria"
        }
      ]
    };

    return questionTemplates[template] || questionTemplates.general;
  };

  const handleAnswerSubmit = () => {
    if (!currentAnswer.trim()) return;

    const newAnswers = {
      ...answers,
      [questions[currentQuestionIndex].id]: {
        question: questions[currentQuestionIndex].text,
        answer: currentAnswer.trim(),
        type: questions[currentQuestionIndex].type
      }
    };

    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, proceed with solution generation
      onQuestionsComplete(newAnswers);
    }
  };

  const handleSkipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onQuestionsComplete(answers);
    }
  };

  const handleSkipAll = () => {
    onSkip();
  };

  if (!isVisible) return null;

  if (isGeneratingQuestions) {
    return (
      <div 
        className="mb-6 rounded-xl border p-6 text-center"
        style={{
          backgroundColor: isDark ? '#161b22' : '#ffffff',
          borderColor: isDark ? '#30363d' : '#e2e8f0'
        }}
      >
        <Loader className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ color: isDark ? '#f0f6fc' : '#111827' }}
        >
          Generating Follow-up Questions
        </h3>
        <p 
          className="text-sm"
          style={{ color: isDark ? '#8b949e' : '#6b7280' }}
        >
          AI is analyzing your post to ask relevant clarifying questions...
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

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
          <HelpCircle className="h-5 w-5" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
          <h3 
            className="text-lg font-semibold"
            style={{ color: isDark ? '#f0f6fc' : '#111827' }}
          >
            Follow-up Questions
          </h3>
        </div>
        <button
          onClick={handleSkipAll}
          className="text-sm px-3 py-1 rounded-md transition-colors"
          style={{
            color: isDark ? '#8b949e' : '#6b7280',
            backgroundColor: isDark ? '#21262d' : '#f8fafc'
          }}
        >
          Skip All
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            {Math.round(progress)}% complete
          </span>
        </div>
        <div 
          className="w-full h-2 rounded-full"
          style={{ backgroundColor: isDark ? '#21262d' : '#f1f5f9' }}
        >
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              backgroundColor: isDark ? '#60a5fa' : '#3b82f6'
            }}
          ></div>
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="mb-6">
          <div className="flex items-start space-x-3 mb-4">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: isDark ? '#1e293b' : '#eff6ff' }}
            >
              <MessageCircle className="h-5 w-5" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
            </div>
            <div className="flex-1">
              <h4 
                className="font-medium mb-2"
                style={{ color: isDark ? '#f0f6fc' : '#111827' }}
              >
                {currentQuestion.text}
              </h4>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={3}
                className="w-full p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: isDark ? '#0d1117' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#d1d5db',
                  color: isDark ? '#f0f6fc' : '#111827'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAnswerSubmit();
                  }
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkipQuestion}
              className="text-sm px-4 py-2 rounded-lg transition-colors"
              style={{
                color: isDark ? '#8b949e' : '#6b7280',
                backgroundColor: isDark ? '#21262d' : '#f8fafc'
              }}
            >
              Skip Question
            </button>
            
            <div className="flex items-center space-x-3">
              <span 
                className="text-xs"
                style={{ color: isDark ? '#8b949e' : '#6b7280' }}
              >
                Press Ctrl+Enter to submit
              </span>
              <button
                onClick={handleAnswerSubmit}
                disabled={!currentAnswer.trim()}
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: currentAnswer.trim() 
                    ? (isDark ? '#3b82f6' : '#3b82f6')
                    : (isDark ? '#374151' : '#e5e7eb'),
                  color: currentAnswer.trim() ? '#ffffff' : (isDark ? '#8b949e' : '#9ca3af')
                }}
              >
                {currentQuestionIndex < questions.length - 1 ? (
                  <>
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Generate Solution <CheckCircle className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Answered Questions Summary */}
      {Object.keys(answers).length > 0 && (
        <div 
          className="mt-6 p-4 rounded-lg border"
          style={{
            backgroundColor: isDark ? '#0d1117' : '#f8fafc',
            borderColor: isDark ? '#30363d' : '#e2e8f0'
          }}
        >
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="h-4 w-4" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
            <span 
              className="text-sm font-medium"
              style={{ color: isDark ? '#f0f6fc' : '#111827' }}
            >
              Your Answers ({Object.keys(answers).length})
            </span>
          </div>
          <div className="space-y-2">
            {Object.values(answers).map((answer, index) => (
              <div key={index} className="text-sm">
                <span 
                  className="font-medium"
                  style={{ color: isDark ? '#8b949e' : '#6b7280' }}
                >
                  Q: {answer.question}
                </span>
                <div 
                  className="mt-1 pl-3 border-l-2"
                  style={{ 
                    borderColor: isDark ? '#30363d' : '#e2e8f0',
                    color: isDark ? '#f0f6fc' : '#374151'
                  }}
                >
                  {answer.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpQuestions;
