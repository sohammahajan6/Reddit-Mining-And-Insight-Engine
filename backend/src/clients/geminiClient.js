const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiClient {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Generate a solution for a Reddit post
   * @param {Object} post - Reddit post object
   * @param {string} feedback - Optional feedback for regeneration
   * @param {Object} options - Solution generation options
   * @returns {string} - Generated solution
   */
  async generateSolution(post, feedback = null, options = {}) {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🧠 Generating solution for: "${post.title}" (attempt ${attempt}/${maxRetries})`);
        console.log(`📋 Options:`, options);

        const prompt = this.buildPrompt(post, feedback, options);

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const solution = response.text();

        console.log(`✅ Generated solution (${solution.length} characters)`);

        return solution;

      } catch (error) {
        console.error(`❌ Error generating solution (attempt ${attempt}):`, error.message);

        // Check if it's a retryable error
        const isRetryable = this.isRetryableError(error);

        if (attempt === maxRetries || !isRetryable) {
          // Last attempt or non-retryable error
          throw new Error(`Failed to generate solution after ${attempt} attempts: ${error.message}`);
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);

        await this.sleep(delay);
      }
    }
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error) {
    const retryableErrors = [
      '503', // Service Unavailable
      '429', // Too Many Requests
      '500', // Internal Server Error
      '502', // Bad Gateway
      '504', // Gateway Timeout
      'overloaded',
      'rate limit',
      'quota exceeded'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(errorType => errorMessage.includes(errorType));
  }

  /**
   * Sleep utility function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build the prompt for Gemini based on the Reddit post and optional feedback
   * @param {Object} post - Reddit post object
   * @param {string} feedback - Optional feedback for improvement
   * @param {Object} options - Solution generation options
   * @returns {string} - Formatted prompt
   */
  buildPrompt(post, feedback = null, options = {}) {
    // Set default options
    const {
      template = 'general',
      tone = 'empathetic',
      length = 'medium',
      followupAnswers = null
    } = options;

    // Get template-specific instructions
    const templateInstructions = this.getTemplateInstructions(template);
    const toneInstructions = this.getToneInstructions(tone);
    const lengthInstructions = this.getLengthInstructions(length);

    const basePrompt = `
You are a professional AI assistant providing thoughtful, well-formatted advice for Reddit posts. Your responses should be clean, structured, and easy to read like ChatGPT.

**Reddit Post Details:**
- Subreddit: r/${post.subreddit}
- Title: ${post.title}
- Content: ${post.body || 'No additional content provided'}

${followupAnswers ? `
**Additional Context from Follow-up Questions:**
${Object.values(followupAnswers).map(qa => `
Q: ${qa.question}
A: ${qa.answer}`).join('\n')}
` : ''}

**SOLUTION TEMPLATE: ${template.toUpperCase()}**
${templateInstructions}

**TONE: ${tone.toUpperCase()}**
${toneInstructions}

**LENGTH: ${length.toUpperCase()}**
${lengthInstructions}

**CRITICAL FORMATTING REQUIREMENTS:**
1. Start with a brief empathetic acknowledgment (1-2 sentences)
2. Use clear section headers with ## for main topics
3. Use bullet points (•) or numbered lists for actionable advice
4. Use **bold text** for emphasis on key points
5. Include line breaks between sections for readability
6. End with an encouraging closing statement

**Response Structure Template:**
[Brief empathetic opening matching the specified tone]

## Understanding Your Situation
[Analysis of the problem using template-specific approach]

## ${this.getMainSectionTitle(template)}
• [Actionable advice point 1]
• [Actionable advice point 2]
• [Actionable advice point 3]

## Additional Considerations
[Any warnings, alternatives, or long-term thoughts]

## Final Thoughts
[Encouraging closing with support]

${feedback ? `
**Previous Response Feedback:**
The user provided this feedback: "${feedback}"
Please improve your response based on this feedback while maintaining the formatting structure and specified template/tone/length.
` : ''}

**Your Response (follow the formatting structure exactly with ${template} template, ${tone} tone, ${length} length):**`;

    return basePrompt.trim();
  }

  /**
   * Get template-specific instructions
   * @param {string} template - Template type
   * @returns {string} - Template instructions
   */
  getTemplateInstructions(template) {
    const templates = {
      general: 'Provide balanced, comprehensive advice suitable for any type of problem. Focus on practical solutions and emotional support.',
      relationship: 'Focus on communication, emotional intelligence, and healthy relationship dynamics. Emphasize empathy and understanding.',
      career: 'Provide professional, strategic advice for workplace situations. Focus on career development and professional growth.',
      technical: 'Give step-by-step technical solutions with clear explanations. Include troubleshooting steps and best practices.',
      social: 'Focus on social skills development, confidence building, and practical strategies for social interactions.'
    };
    return templates[template] || templates.general;
  }

  /**
   * Get tone-specific instructions
   * @param {string} tone - Tone type
   * @returns {string} - Tone instructions
   */
  getToneInstructions(tone) {
    const tones = {
      empathetic: 'Use warm, understanding language. Show genuine care and emotional support. Acknowledge feelings and validate experiences.',
      professional: 'Maintain a formal, business-like tone. Be direct but respectful. Focus on practical outcomes and professional standards.',
      casual: 'Use friendly, conversational language. Be approachable and relatable. Include casual expressions while remaining helpful.',
      direct: 'Be straightforward and to-the-point. Avoid unnecessary elaboration. Focus on clear, actionable advice without excessive emotional language.'
    };
    return tones[tone] || tones.empathetic;
  }

  /**
   * Get length-specific instructions
   * @param {string} length - Length type
   * @returns {string} - Length instructions
   */
  getLengthInstructions(length) {
    const lengths = {
      short: 'Keep response concise and focused. Aim for 150-250 words. Prioritize the most important advice.',
      medium: 'Provide a balanced response with good detail. Aim for 300-500 words. Include context and multiple perspectives.',
      detailed: 'Give comprehensive, thorough advice. Aim for 600-800 words. Include examples, alternatives, and detailed explanations.'
    };
    return lengths[length] || lengths.medium;
  }

  /**
   * Get main section title based on template
   * @param {string} template - Template type
   * @returns {string} - Section title
   */
  getMainSectionTitle(template) {
    const titles = {
      general: 'Practical Steps Forward',
      relationship: 'Relationship Guidance',
      career: 'Professional Action Plan',
      technical: 'Technical Solution Steps',
      social: 'Social Skills Strategy'
    };
    return titles[template] || titles.general;
  }

  /**
   * Generate follow-up questions for a post
   * @param {Object} post - Reddit post object
   * @param {Object} options - Solution options
   * @returns {Array} - Array of follow-up questions
   */
  async generateFollowUpQuestions(post, options = {}) {
    try {
      console.log(`❓ Generating follow-up questions for: "${post.title}"`);

      const { template = 'general' } = options;

      const prompt = `
You are an AI assistant that generates relevant follow-up questions to better understand a user's problem before providing advice.

**Reddit Post Details:**
- Subreddit: r/${post.subreddit}
- Title: ${post.title}
- Content: ${post.body || 'No additional content provided'}

**Template Context:** ${template}

**Instructions:**
Generate 3-4 specific, relevant follow-up questions that would help you provide better advice. Questions should:
1. Gather missing context or details
2. Understand what the user has already tried
3. Clarify the user's goals or desired outcomes
4. Be specific to the problem type and template

**Response Format:**
Return ONLY a JSON array of questions in this exact format:
[
  {
    "id": 1,
    "text": "Question text here?",
    "type": "context|attempts|goals|specifics"
  }
]

**Your Response (JSON only):**`;

      const result = await this.model.generateContent(prompt.trim());
      const response = await result.response;
      const questionsText = response.text();

      try {
        // Try to parse the JSON response
        const questions = JSON.parse(questionsText);
        console.log(`✅ Generated ${questions.length} follow-up questions`);
        return questions;
      } catch (parseError) {
        console.warn('Failed to parse questions JSON, using fallback');
        return this.getFallbackQuestions(template);
      }

    } catch (error) {
      console.error('❌ Error generating follow-up questions:', error.message);
      return this.getFallbackQuestions(template);
    }
  }

  /**
   * Get fallback questions when AI generation fails
   * @param {string} template - Template type
   * @returns {Array} - Array of fallback questions
   */
  getFallbackQuestions(template) {
    const fallbackQuestions = {
      general: [
        { id: 1, text: "Can you provide more context about your specific situation?", type: "context" },
        { id: 2, text: "What have you already tried to address this issue?", type: "attempts" },
        { id: 3, text: "What would an ideal outcome look like for you?", type: "goals" }
      ],
      relationship: [
        { id: 1, text: "How long have you been in this relationship/situation?", type: "context" },
        { id: 2, text: "Have you tried discussing this with the other person involved?", type: "attempts" },
        { id: 3, text: "What specific behaviors or actions are causing the most concern?", type: "specifics" }
      ],
      career: [
        { id: 1, text: "What is your current role and how long have you been in it?", type: "context" },
        { id: 2, text: "Have you discussed this with your manager or HR?", type: "attempts" },
        { id: 3, text: "What are your career goals in the next 1-2 years?", type: "goals" }
      ],
      technical: [
        { id: 1, text: "What specific error messages or symptoms are you experiencing?", type: "specifics" },
        { id: 2, text: "What steps have you already taken to troubleshoot this?", type: "attempts" },
        { id: 3, text: "What is your technical background and experience level?", type: "context" }
      ],
      social: [
        { id: 1, text: "In what specific social situations do you feel most uncomfortable?", type: "context" },
        { id: 2, text: "How do you typically handle social interactions now?", type: "attempts" },
        { id: 3, text: "What social skills would you most like to improve?", type: "goals" }
      ]
    };

    return fallbackQuestions[template] || fallbackQuestions.general;
  }

  /**
   * Generate multiple solution options
   * @param {Object} post - Reddit post object
   * @param {number} count - Number of solutions to generate
   * @returns {Array} - Array of generated solutions
   */
  async generateMultipleSolutions(post, count = 3) {
    try {
      console.log(`🧠 Generating ${count} solution options for: "${post.title}"`);
      
      const solutions = [];
      
      for (let i = 0; i < count; i++) {
        const prompt = this.buildVariedPrompt(post, i);
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        solutions.push(response.text());
        
        // Small delay to avoid rate limiting
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`✅ Generated ${solutions.length} solution options`);
      return solutions;
      
    } catch (error) {
      console.error('❌ Error generating multiple solutions:', error.message);
      throw new Error(`Failed to generate multiple solutions: ${error.message}`);
    }
  }

  /**
   * Build varied prompts for multiple solutions
   * @param {Object} post - Reddit post object
   * @param {number} variation - Variation number for different approaches
   * @returns {string} - Formatted prompt with variation
   */
  buildVariedPrompt(post, variation) {
    const approaches = [
      {
        focus: 'Focus on immediate actionable steps and practical solutions',
        style: 'Direct and solution-oriented with clear step-by-step guidance'
      },
      {
        focus: 'Provide a more analytical and strategic approach to the problem',
        style: 'Thoughtful analysis with strategic planning and long-term thinking'
      },
      {
        focus: 'Emphasize emotional support and long-term perspective',
        style: 'Empathetic and supportive with focus on emotional well-being'
      }
    ];

    const approach = approaches[variation % approaches.length];

    return `
You are a professional AI assistant providing well-formatted, thoughtful advice for Reddit posts. Your responses should be clean and structured like ChatGPT.

**Reddit Post Details:**
- Subreddit: r/${post.subreddit}
- Title: ${post.title}
- Content: ${post.body || 'No additional content provided'}

**Approach for this response:** ${approach.focus}
**Style:** ${approach.style}

**FORMATTING REQUIREMENTS:**
1. Start with empathetic acknowledgment
2. Use ## for section headers
3. Use bullet points (•) for lists
4. Use **bold** for key points
5. Include line breaks between sections
6. End with encouraging statement

**Response Structure:**
[Brief empathetic opening]

## Understanding Your Situation
[Analysis following the specified approach]

## ${variation === 0 ? 'Immediate Action Steps' : variation === 1 ? 'Strategic Approach' : 'Emotional Support & Perspective'}
• [Relevant advice point 1]
• [Relevant advice point 2]
• [Relevant advice point 3]

## Additional Thoughts
[Supporting information or considerations]

## Moving Forward
[Encouraging closing with next steps]

**Your Response (follow formatting exactly):**`;
  }

  /**
   * Validate the generated solution for quality
   * @param {string} solution - Generated solution text
   * @returns {Object} - Validation result with score and feedback
   */
  validateSolution(solution) {
    const validation = {
      isValid: true,
      score: 0,
      issues: []
    };

    // Check length
    if (solution.length < 50) {
      validation.issues.push('Response too short');
      validation.score -= 20;
    } else if (solution.length > 2000) {
      validation.issues.push('Response too long');
      validation.score -= 10;
    } else {
      validation.score += 20;
    }

    // Check for helpful content indicators
    const helpfulIndicators = [
      'suggest', 'recommend', 'try', 'consider', 'might', 'could',
      'step', 'approach', 'strategy', 'solution', 'advice'
    ];
    
    const hasHelpfulContent = helpfulIndicators.some(indicator => 
      solution.toLowerCase().includes(indicator)
    );
    
    if (hasHelpfulContent) {
      validation.score += 30;
    } else {
      validation.issues.push('Lacks actionable advice');
      validation.score -= 20;
    }

    // Check for structure
    const hasStructure = solution.includes('\n') || solution.includes('•') || 
                        solution.includes('1.') || solution.includes('-');
    
    if (hasStructure) {
      validation.score += 20;
    }

    // Check for empathy indicators
    const empathyIndicators = [
      'understand', 'feel', 'sorry', 'difficult', 'challenging',
      'support', 'help', 'care', 'important'
    ];
    
    const hasEmpathy = empathyIndicators.some(indicator => 
      solution.toLowerCase().includes(indicator)
    );
    
    if (hasEmpathy) {
      validation.score += 30;
    }

    // Final validation
    validation.isValid = validation.score >= 50 && validation.issues.length === 0;
    
    return validation;
  }
}

module.exports = GeminiClient;
