const express = require('express');
const Joi = require('joi');
const { authenticate } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * POST /api/enterprise/analyze-business-opportunity
 * Analyze a Reddit post for business opportunities
 */
router.post('/analyze-business-opportunity', async (req, res) => {
  try {
    // Validate request body
    const schema = Joi.object({
      post: Joi.object({
        id: Joi.string().required(),
        title: Joi.string().required(),
        body: Joi.string().allow(''),
        subreddit: Joi.string().required(),
        url: Joi.string().uri().required(),
        author: Joi.string().optional(),
        score: Joi.number().optional(),
        created: Joi.string().optional(),
        numComments: Joi.number().optional(),
        num_comments: Joi.number().optional() // Alternative field name
      }).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { post } = value;

    console.log(`🏢 Analyzing business opportunity for post: ${post.id}`);

    const startTime = Date.now();
    const analysis = await generateBusinessAnalysis(post);
    const generationTime = Date.now() - startTime;

    res.json({
      success: true,
      analysis,
      metadata: {
        postId: post.id,
        subreddit: post.subreddit,
        generationTime,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Enterprise analysis error:', error);
    
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        suggestion: 'Please wait before making another request',
        retryAfter: 30
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to analyze business opportunity',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Generate business opportunity analysis using Gemini AI
 */
async function generateBusinessAnalysis(post) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Add randomization to prevent repetitive responses
  const analysisStyles = [
    "conservative venture capitalist",
    "aggressive startup accelerator partner",
    "experienced business consultant",
    "market research analyst",
    "serial entrepreneur"
  ];

  const focusAreas = [
    "market validation and customer acquisition",
    "technical feasibility and scalability",
    "competitive landscape and differentiation",
    "monetization strategy and unit economics",
    "risk mitigation and execution challenges"
  ];

  const randomStyle = analysisStyles[Math.floor(Math.random() * analysisStyles.length)];
  const randomFocus = focusAreas[Math.floor(Math.random() * focusAreas.length)];

  const prompt = `
You are a ${randomStyle} with 15+ years of experience in business evaluation and market analysis. Analyze this Reddit post for business opportunities with REALISTIC and VARIED assessments, focusing particularly on ${randomFocus}.

CRITICAL INSTRUCTIONS:
- Avoid generic scores like 7/10 or "Medium" ratings
- Use specific, varied numerical scores (1-10) based on actual content analysis
- Provide diverse risk assessments (not always "Medium")
- Give realistic market size evaluations
- Vary your confidence levels based on data quality
- Be critical and honest about poor opportunities
- Consider real-world market dynamics and competition

Provide a comprehensive business analysis in the following JSON format:

{
  "businessOpportunity": {
    "title": "Brief title for the business opportunity",
    "description": "2-3 sentence description of the opportunity",
    "marketSize": "Small/Medium/Large",
    "confidence": "Low/Medium/High"
  },
  "problemAnalysis": {
    "coreProblem": "What is the main problem being discussed?",
    "painPoints": ["List of specific pain points mentioned"],
    "targetAudience": "Who is affected by this problem?",
    "frequency": "How often does this problem occur?"
  },
  "solutionConcepts": [
    {
      "type": "Product/Service/Platform/Tool",
      "title": "Solution name",
      "description": "How this solution addresses the problem",
      "complexity": "Low/Medium/High"
    }
  ],
  "marketAnalysis": {
    "competitorLandscape": "Brief analysis of existing solutions",
    "marketGap": "What gap exists in the current market?",
    "monetizationPotential": ["List of potential revenue streams"],
    "targetMarketSize": "Estimated size of target market"
  },
  "riskAssessment": {
    "technicalRisks": ["List of technical challenges"],
    "marketRisks": ["List of market-related risks"],
    "competitiveRisks": ["List of competitive threats"],
    "overallRisk": "Low/Medium/High"
  },
  "growthPotential": {
    "scalability": "How scalable is this opportunity?",
    "timeToMarket": "Estimated time to launch",
    "investmentRequired": "Low/Medium/High",
    "growthProjection": "Short-term and long-term growth potential",
    "score": "1-10 rating for overall growth potential"
  },
  "actionableInsights": [
    "List of specific next steps or recommendations"
  ]
}

SCORING GUIDELINES (BE REALISTIC AND VARIED):
- Growth Potential Score: 1-3 (Poor/Saturated market), 4-6 (Average/Competitive), 7-8 (Good potential), 9-10 (Exceptional/Blue ocean)
- Risk Assessment: Vary between Low/Medium/High based on actual analysis
- Market Size: Small (niche <$100M), Medium ($100M-$1B), Large (>$1B)
- Confidence: Low (vague problem), Medium (clear problem, unclear solution), High (validated problem + clear path)
- Investment: Low (<$50K), Medium ($50K-$500K), High (>$500K)

ANALYSIS APPROACH:
1. First determine if this is actually a business opportunity or just a complaint
2. Research if similar solutions already exist (be honest about competition)
3. Evaluate market demand based on engagement and problem severity
4. Consider technical feasibility and resource requirements
5. Assess monetization potential realistically
6. Don't inflate scores - be critical and honest

Reddit Post Details:
Title: ${post.title}
Content: ${post.body || 'No additional content'}
Subreddit: r/${post.subreddit}
Engagement: ${post.score} upvotes, ${post.num_comments || post.numComments || 0} comments

REMEMBER: Not every post represents a good business opportunity. Some may score 2-4/10, others 8-9/10. Vary your assessments based on real analysis, not generic "medium" responses.

EXAMPLE SCORING SCENARIOS:
- Personal complaint without market validation: 2-3/10, High risk, Low confidence
- Common problem with existing solutions: 4-5/10, Medium risk, Medium confidence
- Niche problem with clear pain points: 6-7/10, Medium risk, High confidence
- Underserved market with scalable solution: 8-9/10, Low-Medium risk, High confidence
- Revolutionary opportunity with proof: 9-10/10, Low risk, High confidence

Use these as guidelines but analyze each post individually. Be honest about limitations and challenges.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  // Clean up the response to extract JSON
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    const analysis = JSON.parse(text);
    return analysis;
  } catch (parseError) {
    console.error('Failed to parse business analysis JSON:', parseError);
    // Return a fallback structure if JSON parsing fails
    return {
      businessOpportunity: {
        title: "Business Opportunity Analysis",
        description: "Analysis generated but formatting needs review",
        marketSize: "Medium",
        confidence: "Medium"
      },
      problemAnalysis: {
        coreProblem: post.title,
        painPoints: ["Analysis available in raw format"],
        targetAudience: `Users in r/${post.subreddit}`,
        frequency: "Unknown"
      },
      solutionConcepts: [{
        type: "Solution",
        title: "Custom Solution Required",
        description: "Detailed analysis available",
        complexity: "Medium"
      }],
      marketAnalysis: {
        competitorLandscape: "Requires further research",
        marketGap: "Identified from post analysis",
        monetizationPotential: ["To be determined"],
        targetMarketSize: "Medium"
      },
      riskAssessment: {
        technicalRisks: ["Standard technical challenges"],
        marketRisks: ["Market validation needed"],
        competitiveRisks: ["Competition analysis required"],
        overallRisk: "Medium"
      },
      growthPotential: {
        scalability: "Moderate scalability potential",
        timeToMarket: "6-12 months",
        investmentRequired: "Medium",
        growthProjection: "Steady growth expected",
        score: "6"
      },
      actionableInsights: [
        "Conduct market research",
        "Validate problem with target audience",
        "Develop minimum viable product"
      ],
      rawAnalysis: text
    };
  }
}

/**
 * GET /api/enterprise/health
 * Check enterprise analysis service health
 */
router.get('/health', async (req, res) => {
  try {
    const testPost = {
      id: 'test',
      title: 'Test business opportunity analysis',
      body: 'This is a test post for business analysis',
      subreddit: 'entrepreneur',
      url: 'https://reddit.com/test',
      score: 10,
      num_comments: 5
    };

    const startTime = Date.now();
    await generateBusinessAnalysis(testPost);
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enterprise health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
