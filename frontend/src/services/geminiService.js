import { apiRequest, handleApiError } from './api';
import toast from 'react-hot-toast';

/**
 * Generate a solution for a Reddit post using Gemini AI
 * @param {Object} post - Reddit post object
 * @param {string} feedback - Optional feedback for regeneration
 * @param {Object} options - Solution generation options
 * @returns {Promise<string>} Generated solution
 */
export const generateSolution = async (post, feedback = null, options = {}) => {
  try {
    const loadingMessage = feedback ?
      'Regenerating solution with your feedback...' :
      'Generating AI solution...';

    toast.loading(loadingMessage, { id: 'generate-solution' });

    const response = await apiRequest.post('/gemini/generate-solution', {
      post,
      feedback,
      options
    });
    
    const solution = response.data.solution;
    const metadata = response.data.metadata;
    
    // Show success message with generation time
    const successMessage = `Solution generated in ${metadata.generationTime}ms!`;
    toast.success(successMessage, { id: 'generate-solution' });
    
    // Log validation results if available
    if (metadata.validation && !metadata.validation.isValid) {
      console.warn('Solution validation issues:', metadata.validation.issues);
    }
    
    return solution;
    
  } catch (error) {
    toast.dismiss('generate-solution');
    
    if (error.response?.status === 401) {
      toast.error('AI service authentication failed');
      throw new Error('AI service is not properly configured');
    }
    
    if (error.response?.status === 429) {
      toast.error('AI service rate limit exceeded');
      throw new Error('Too many requests to AI service. Please try again later.');
    }
    
    const message = handleApiError(error, 'Failed to generate solution');
    throw new Error(message);
  }
};

/**
 * Generate multiple solution options for a Reddit post
 * @param {Object} post - Reddit post object
 * @param {number} count - Number of solutions to generate (1-5)
 * @returns {Promise<Array>} Array of solution objects
 */
export const generateMultipleSolutions = async (post, count = 3) => {
  try {
    toast.loading(`Generating ${count} solution options...`, { id: 'generate-multiple' });
    
    const response = await apiRequest.post('/gemini/generate-multiple', {
      post,
      count
    });
    
    const solutions = response.data.solutions;
    const metadata = response.data.metadata;
    
    toast.success(`Generated ${solutions.length} solutions!`, { id: 'generate-multiple' });
    
    return solutions.map((solution, index) => ({
      id: solution.id || `solution_${index + 1}`,
      content: solution.content,
      validation: solution.validation,
      selected: index === 0 // First solution is selected by default
    }));
    
  } catch (error) {
    toast.dismiss('generate-multiple');
    const message = handleApiError(error, 'Failed to generate multiple solutions');
    throw new Error(message);
  }
};

/**
 * Regenerate a solution based on user feedback
 * @param {Object} post - Reddit post object
 * @param {string} previousSolution - Previous solution that was disliked
 * @param {string} feedback - User feedback for improvement
 * @returns {Promise<string>} Regenerated solution
 */
export const regenerateSolution = async (post, previousSolution, feedback) => {
  try {
    toast.loading('Improving solution based on your feedback...', { id: 'regenerate' });
    
    const response = await apiRequest.post('/gemini/regenerate-solution', {
      post,
      previousSolution,
      feedback
    });
    
    const newSolution = response.data.solution;
    const metadata = response.data.metadata;
    
    toast.success('Solution improved!', { id: 'regenerate' });
    
    // Log improvement metrics
    console.log('Solution regeneration metrics:', {
      previousLength: metadata.previousSolutionLength,
      newLength: metadata.newSolutionLength,
      feedback: metadata.feedback,
      generationTime: metadata.generationTime
    });
    
    return newSolution;
    
  } catch (error) {
    toast.dismiss('regenerate');
    const message = handleApiError(error, 'Failed to regenerate solution');
    throw new Error(message);
  }
};

/**
 * Validate a solution's quality
 * @param {string} solution - Solution text to validate
 * @returns {Promise<Object>} Validation result
 */
export const validateSolution = async (solution) => {
  try {
    const response = await apiRequest.post('/gemini/validate-solution', {
      solution
    });
    
    return response.data.validation;
    
  } catch (error) {
    console.error('Solution validation error:', error);
    return {
      isValid: false,
      score: 0,
      issues: ['Validation failed']
    };
  }
};

/**
 * Check Gemini AI service health
 * @returns {Promise<Object>} Health status
 */
export const checkGeminiHealth = async () => {
  try {
    const response = await apiRequest.get('/gemini/health');
    return response.data;
  } catch (error) {
    throw new Error('Gemini AI service is unavailable');
  }
};

/**
 * Format solution text for better display
 * @param {string} solution - Raw solution text
 * @returns {string} Formatted solution
 */
export const formatSolution = (solution) => {
  if (!solution) return '';
  
  // Basic formatting improvements
  return solution
    .trim()
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
    .replace(/^\s+/gm, '') // Remove leading whitespace from lines
    .replace(/\s+$/gm, ''); // Remove trailing whitespace from lines
};

/**
 * Extract key points from a solution
 * @param {string} solution - Solution text
 * @returns {Array} Array of key points
 */
export const extractKeyPoints = (solution) => {
  if (!solution) return [];
  
  const lines = solution.split('\n');
  const keyPoints = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Look for numbered lists, bullet points, or lines starting with action words
    if (
      /^\d+\./.test(trimmed) || // Numbered list
      /^[•\-\*]/.test(trimmed) || // Bullet points
      /^(try|consider|start|focus|avoid|remember)/i.test(trimmed) // Action words
    ) {
      keyPoints.push(trimmed);
    }
  });
  
  return keyPoints.slice(0, 5); // Return max 5 key points
};

/**
 * Calculate solution reading time estimate
 * @param {string} solution - Solution text
 * @returns {number} Estimated reading time in minutes
 */
export const calculateReadingTime = (solution) => {
  if (!solution) return 0;
  
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = solution.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  return Math.max(1, minutes); // Minimum 1 minute
};

/**
 * Generate follow-up questions for a Reddit post
 * @param {Object} post - Reddit post object
 * @param {Object} options - Solution generation options
 * @returns {Promise<Array>} Array of follow-up questions
 */
export const generateFollowUpQuestions = async (post, options = {}) => {
  try {
    toast.loading('Generating follow-up questions...', { id: 'generate-questions' });

    const response = await apiRequest.post('/gemini/generate-followup-questions', {
      post,
      options
    });

    toast.success('Follow-up questions generated!', { id: 'generate-questions' });
    return response.data.questions;

  } catch (error) {
    const message = handleApiError(error, 'Failed to generate follow-up questions');
    toast.error(message, { id: 'generate-questions' });
    throw new Error(message);
  }
};

export default {
  generateSolution,
  generateMultipleSolutions,
  regenerateSolution,
  validateSolution,
  checkGeminiHealth,
  formatSolution,
  extractKeyPoints,
  calculateReadingTime,
  generateFollowUpQuestions
};
