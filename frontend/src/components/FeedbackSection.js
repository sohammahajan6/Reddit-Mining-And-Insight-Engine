import React, { useState } from 'react';
import { MessageSquare, Send, X, AlertCircle } from 'lucide-react';

const FeedbackSection = ({ onSubmit, onCancel, isLoading = false }) => {
  const [feedback, setFeedback] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  const feedbackReasons = [
    { id: 'too_generic', label: 'Too generic or vague' },
    { id: 'not_relevant', label: 'Not relevant to the question' },
    { id: 'missing_details', label: 'Missing important details' },
    { id: 'wrong_tone', label: 'Wrong tone or approach' },
    { id: 'factually_incorrect', label: 'Factually incorrect' },
    { id: 'other', label: 'Other (please specify)' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!feedback.trim() && !selectedReason) {
      return;
    }

    const feedbackText = selectedReason 
      ? `${feedbackReasons.find(r => r.id === selectedReason)?.label}${feedback.trim() ? `: ${feedback.trim()}` : ''}`
      : feedback.trim();

    onSubmit(feedbackText);
  };

  const isSubmitDisabled = !feedback.trim() && !selectedReason;

  return (
    <div className="feedback-section animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Help us improve this solution
          </h3>
        </div>
        
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          title="Cancel feedback"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-orange-800">
            <p className="font-medium mb-1">Your feedback helps us generate better solutions!</p>
            <p>Tell us what was wrong with this response, and we'll create an improved version.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Feedback Reasons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What was the main issue? (optional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {feedbackReasons.map((reason) => (
              <label
                key={reason.id}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedReason === reason.id
                    ? 'border-orange-500 bg-orange-50 text-orange-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="feedbackReason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm">{reason.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Detailed Feedback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional details {selectedReason ? '(optional)' : '(required)'}
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Please provide specific feedback on how we can improve this solution..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            disabled={isLoading}
          />
          <div className="mt-1 text-xs text-gray-500">
            {feedback.length}/1000 characters
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitDisabled || isLoading}
            className="flex items-center space-x-2 btn-primary disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner" />
                <span>Generating improved solution...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit & Regenerate</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-1">💡 Feedback Tips:</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Be specific about what was missing or incorrect</li>
          <li>• Mention if the tone or approach wasn't appropriate</li>
          <li>• Suggest what kind of advice would be more helpful</li>
        </ul>
      </div>
    </div>
  );
};

export default FeedbackSection;
