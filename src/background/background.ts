import { AIService } from '../api/aiService';
import { AnalysisRequest, AnalysisResponse } from '../types';

// Initialize AI service
const aiService = new AIService({
  apiKey: import.meta.env.VITE_AI_API_KEY,
  baseUrl: import.meta.env.VITE_AI_BASE_URL,
  model: 'claude'
});

console.log('Background script initialized');

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.type === 'ANALYZE_TEXT') {
    console.log('Starting text analysis');
    console.log('Using settings:', message.options);
    
    const request: AnalysisRequest = {
      text: message.text,
      options: message.options || {
        minSeverity: 0.5,
        categories: ['fallacy', 'bias', 'opinion']
      }
    };

    aiService.analyzeText(request)
      .then((response: AnalysisResponse) => {
        console.log('Analysis completed:', response);
        sendResponse(response);
      })
      .catch((error: Error) => {
        console.error('Analysis failed:', error);
        sendResponse({ error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      minSeverity: 0.5,
      enabledCategories: ['fallacy', 'bias', 'opinion'],
      aiProvider: 'claude'
    });
  }
}); 