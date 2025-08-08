import { apiRequest, handleApiError } from './api';
import toast from 'react-hot-toast';

/**
 * Analyze a Reddit post for business opportunities
 * @param {Object} post - Reddit post object
 * @returns {Promise<Object>} Business analysis result
 */
export const analyzeBusinessOpportunity = async (post) => {
  try {
    toast.loading('Analyzing business opportunity...', { id: 'business-analysis' });

    const response = await apiRequest.post('/enterprise/analyze-business-opportunity', {
      post
    });

    toast.success('Business analysis completed!', { id: 'business-analysis' });
    
    return response.data;
  } catch (error) {
    console.error('Business analysis error:', error);
    toast.error('Failed to analyze business opportunity', { id: 'business-analysis' });
    throw handleApiError(error);
  }
};

/**
 * Check enterprise service health
 * @returns {Promise<Object>} Health status
 */
export const checkEnterpriseHealth = async () => {
  try {
    const response = await apiRequest.get('/enterprise/health');
    return response.data;
  } catch (error) {
    console.error('Enterprise health check failed:', error);
    throw handleApiError(error);
  }
};

/**
 * Format business analysis data for display
 * @param {Object} analysis - Raw analysis data
 * @returns {Object} Formatted analysis
 */
export const formatBusinessAnalysis = (analysis) => {
  if (!analysis) return null;

  return {
    ...analysis,
    // Add computed fields for better display
    riskLevel: analysis.riskAssessment?.overallRisk || 'Medium',
    opportunityScore: analysis.growthPotential?.score || '5',
    marketSizeLabel: getMarketSizeLabel(analysis.businessOpportunity?.marketSize),
    confidenceLabel: getConfidenceLabel(analysis.businessOpportunity?.confidence),
    investmentLabel: getInvestmentLabel(analysis.growthPotential?.investmentRequired)
  };
};

/**
 * Get market size display label
 * @param {string} size - Market size value
 * @returns {string} Display label
 */
const getMarketSizeLabel = (size) => {
  const labels = {
    'Small': '🔸 Niche Market',
    'Medium': '🔶 Growing Market', 
    'Large': '🔷 Mass Market'
  };
  return labels[size] || '🔸 Unknown Market';
};

/**
 * Get confidence display label
 * @param {string} confidence - Confidence level
 * @returns {string} Display label
 */
const getConfidenceLabel = (confidence) => {
  const labels = {
    'Low': '⚠️ Low Confidence',
    'Medium': '⚡ Medium Confidence',
    'High': '✅ High Confidence'
  };
  return labels[confidence] || '⚡ Medium Confidence';
};

/**
 * Get investment display label
 * @param {string} investment - Investment level
 * @returns {string} Display label
 */
const getInvestmentLabel = (investment) => {
  const labels = {
    'Low': '💰 Low Investment',
    'Medium': '💰💰 Medium Investment',
    'High': '💰💰💰 High Investment'
  };
  return labels[investment] || '💰💰 Medium Investment';
};

/**
 * Get risk color based on risk level
 * @param {string} riskLevel - Risk level
 * @returns {string} CSS color class
 */
export const getRiskColor = (riskLevel) => {
  const colors = {
    'Low': 'text-green-600',
    'Medium': 'text-yellow-600',
    'High': 'text-red-600'
  };
  return colors[riskLevel] || 'text-yellow-600';
};

/**
 * Get opportunity score color
 * @param {string|number} score - Opportunity score (1-10)
 * @returns {string} CSS color class
 */
export const getOpportunityScoreColor = (score) => {
  const numScore = parseInt(score);
  if (numScore >= 8) return 'text-green-600';
  if (numScore >= 6) return 'text-yellow-600';
  if (numScore >= 4) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Generate summary insights from analysis
 * @param {Object} analysis - Business analysis data
 * @returns {Array} Array of insight objects
 */
export const generateSummaryInsights = (analysis) => {
  if (!analysis) return [];

  const insights = [];

  // Market opportunity insight
  if (analysis.businessOpportunity) {
    insights.push({
      type: 'opportunity',
      title: 'Market Opportunity',
      content: `${analysis.businessOpportunity.marketSize} market with ${analysis.businessOpportunity.confidence.toLowerCase()} confidence level`,
      icon: '🎯'
    });
  }

  // Risk insight
  if (analysis.riskAssessment) {
    insights.push({
      type: 'risk',
      title: 'Risk Level',
      content: `${analysis.riskAssessment.overallRisk} overall risk profile`,
      icon: analysis.riskAssessment.overallRisk === 'Low' ? '✅' : 
            analysis.riskAssessment.overallRisk === 'High' ? '⚠️' : '⚡'
    });
  }

  // Growth potential insight
  if (analysis.growthPotential) {
    insights.push({
      type: 'growth',
      title: 'Growth Potential',
      content: `Score: ${analysis.growthPotential.score}/10 with ${analysis.growthPotential.investmentRequired.toLowerCase()} investment required`,
      icon: '📈'
    });
  }

  // Time to market insight
  if (analysis.growthPotential?.timeToMarket) {
    insights.push({
      type: 'timeline',
      title: 'Time to Market',
      content: analysis.growthPotential.timeToMarket,
      icon: '⏰'
    });
  }

  return insights;
};

export default {
  analyzeBusinessOpportunity,
  checkEnterpriseHealth,
  formatBusinessAnalysis,
  getRiskColor,
  getOpportunityScoreColor,
  generateSummaryInsights
};
