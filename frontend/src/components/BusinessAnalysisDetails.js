import React from 'react';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  DollarSign,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { getRiskColor, getOpportunityScoreColor } from '../services/enterpriseService';

const BusinessAnalysisDetails = ({ analysis, isDark }) => {
  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Business Opportunity Overview */}
      {analysis.businessOpportunity && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="h-6 w-6 text-blue-600" />
            <h4 className="text-lg font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              Business Opportunity
            </h4>
          </div>
          
          <h5 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
            {analysis.businessOpportunity.title}
          </h5>
          <p className="text-secondary-700 dark:text-secondary-300 mb-4">
            {analysis.businessOpportunity.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-secondary-600">Market Size</span>
              <div className="text-sm font-semibold">
                {analysis.marketSizeLabel || analysis.businessOpportunity.marketSize}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-secondary-600">Confidence</span>
              <div className="text-sm font-semibold">
                {analysis.confidenceLabel || analysis.businessOpportunity.confidence}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Problem Analysis */}
      {analysis.problemAnalysis && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h4 className="text-lg font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              Problem Analysis
            </h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <h5 className="font-medium mb-2 text-orange-800 dark:text-orange-200">Core Problem</h5>
              <p className="text-secondary-700 dark:text-secondary-300">
                {analysis.problemAnalysis.coreProblem}
              </p>
            </div>
            
            {analysis.problemAnalysis.painPoints && analysis.problemAnalysis.painPoints.length > 0 && (
              <div>
                <h5 className="font-medium mb-2 text-orange-800 dark:text-orange-200">Pain Points</h5>
                <ul className="space-y-1">
                  {analysis.problemAnalysis.painPoints.map((point, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="text-orange-500 mt-1">•</span>
                      <span className="text-secondary-700 dark:text-secondary-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-1 text-orange-800 dark:text-orange-200">Target Audience</h5>
                <p className="text-sm text-secondary-700 dark:text-secondary-300">
                  {analysis.problemAnalysis.targetAudience}
                </p>
              </div>
              <div>
                <h5 className="font-medium mb-1 text-orange-800 dark:text-orange-200">Frequency</h5>
                <p className="text-sm text-secondary-700 dark:text-secondary-300">
                  {analysis.problemAnalysis.frequency}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Solution Concepts */}
      {analysis.solutionConcepts && analysis.solutionConcepts.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Lightbulb className="h-6 w-6 text-green-600" />
            <h4 className="text-lg font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              Solution Concepts
            </h4>
          </div>
          
          <div className="space-y-4">
            {analysis.solutionConcepts.map((solution, index) => (
              <div key={index} className="border border-secondary-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-green-800 dark:text-green-200">
                    {solution.title}
                  </h5>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                    {solution.type}
                  </span>
                </div>
                <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-2">
                  {solution.description}
                </p>
                <div className="text-xs text-secondary-600">
                  Complexity: <span className="font-medium">{solution.complexity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Analysis */}
      {analysis.marketAnalysis && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            <h4 className="text-lg font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              Market Analysis
            </h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <h5 className="font-medium mb-2 text-purple-800 dark:text-purple-200">Competitor Landscape</h5>
              <p className="text-sm text-secondary-700 dark:text-secondary-300">
                {analysis.marketAnalysis.competitorLandscape}
              </p>
            </div>
            
            <div>
              <h5 className="font-medium mb-2 text-purple-800 dark:text-purple-200">Market Gap</h5>
              <p className="text-sm text-secondary-700 dark:text-secondary-300">
                {analysis.marketAnalysis.marketGap}
              </p>
            </div>
            
            {analysis.marketAnalysis.monetizationPotential && analysis.marketAnalysis.monetizationPotential.length > 0 && (
              <div>
                <h5 className="font-medium mb-2 text-purple-800 dark:text-purple-200">Monetization Potential</h5>
                <ul className="space-y-1">
                  {analysis.marketAnalysis.monetizationPotential.map((potential, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-secondary-700 dark:text-secondary-300">{potential}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <h5 className="font-medium mb-1 text-purple-800 dark:text-purple-200">Target Market Size</h5>
              <p className="text-sm text-secondary-700 dark:text-secondary-300">
                {analysis.marketAnalysis.targetMarketSize}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {analysis.riskAssessment && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h4 className="text-lg font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              Risk Assessment
            </h4>
          </div>
          
          <div className="space-y-4">
            {analysis.riskAssessment.technicalRisks && analysis.riskAssessment.technicalRisks.length > 0 && (
              <div>
                <h5 className="font-medium mb-2 text-red-800 dark:text-red-200">Technical Risks</h5>
                <ul className="space-y-1">
                  {analysis.riskAssessment.technicalRisks.map((risk, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="text-red-500 mt-1">⚠️</span>
                      <span className="text-secondary-700 dark:text-secondary-300">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.riskAssessment.marketRisks && analysis.riskAssessment.marketRisks.length > 0 && (
              <div>
                <h5 className="font-medium mb-2 text-red-800 dark:text-red-200">Market Risks</h5>
                <ul className="space-y-1">
                  {analysis.riskAssessment.marketRisks.map((risk, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="text-red-500 mt-1">📊</span>
                      <span className="text-secondary-700 dark:text-secondary-300">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.riskAssessment.competitiveRisks && analysis.riskAssessment.competitiveRisks.length > 0 && (
              <div>
                <h5 className="font-medium mb-2 text-red-800 dark:text-red-200">Competitive Risks</h5>
                <ul className="space-y-1">
                  {analysis.riskAssessment.competitiveRisks.map((risk, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="text-red-500 mt-1">🏢</span>
                      <span className="text-secondary-700 dark:text-secondary-300">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-red-800 dark:text-red-200">Overall Risk Level:</span>
                <span className={`font-semibold ${getRiskColor(analysis.riskAssessment.overallRisk)}`}>
                  {analysis.riskAssessment.overallRisk}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Growth Potential */}
      {analysis.growthPotential && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <h4 className="text-lg font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              Growth Potential
            </h4>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-1 text-green-800 dark:text-green-200">Scalability</h5>
                <p className="text-sm text-secondary-700 dark:text-secondary-300">
                  {analysis.growthPotential.scalability}
                </p>
              </div>
              <div>
                <h5 className="font-medium mb-1 text-green-800 dark:text-green-200">Time to Market</h5>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">
                    {analysis.growthPotential.timeToMarket}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium mb-1 text-green-800 dark:text-green-200">Investment Required</h5>
              <p className="text-sm text-secondary-700 dark:text-secondary-300">
                {analysis.investmentLabel || analysis.growthPotential.investmentRequired}
              </p>
            </div>
            
            <div>
              <h5 className="font-medium mb-2 text-green-800 dark:text-green-200">Growth Projection</h5>
              <p className="text-sm text-secondary-700 dark:text-secondary-300">
                {analysis.growthPotential.growthProjection}
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-green-800 dark:text-green-200">Opportunity Score:</span>
                <span className={`text-2xl font-bold ${getOpportunityScoreColor(analysis.growthPotential.score)}`}>
                  {analysis.growthPotential.score}/10
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actionable Insights */}
      {analysis.actionableInsights && analysis.actionableInsights.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-blue-600" />
            <h4 className="text-lg font-semibold" style={{color: isDark ? '#f0f6fc' : '#111827'}}>
              Next Steps & Recommendations
            </h4>
          </div>
          
          <ul className="space-y-3">
            {analysis.actionableInsights.map((insight, index) => (
              <li key={index} className="flex items-start space-x-3">
                <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-secondary-700 dark:text-secondary-300">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BusinessAnalysisDetails;
