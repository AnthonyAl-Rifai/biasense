import React, { useState, useEffect } from 'react';
import { AnnotationCategory } from '../types';

type Settings = {
  minSeverity: number;
  enabledCategories: AnnotationCategory[];
  aiProvider: 'claude' | 'gpt-4';
};

const Popup: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    minSeverity: 0.5,
    enabledCategories: ['fallacy', 'bias', 'opinion'],
    aiProvider: 'claude'
  });

  useEffect(() => {
    console.log('Popup mounted');
    // Load settings from storage
    chrome.storage.sync.get(['minSeverity', 'enabledCategories', 'aiProvider'], (result) => {
      console.log('Loaded settings:', result);
      if (result.minSeverity) {
        setSettings(prev => ({
          ...prev,
          minSeverity: result.minSeverity,
          enabledCategories: result.enabledCategories || prev.enabledCategories,
          aiProvider: result.aiProvider || prev.aiProvider
        }));
      }
    });
  }, []);

  const handleAnalyze = async () => {
    console.log('Analyze button clicked');
    setIsAnalyzing(true);
    try {
      console.log('Querying active tab...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Active tab:', tab);
      
      if (tab.id) {
        console.log('Sending ANALYZE_PAGE message to tab:', tab.id);
        await chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_PAGE' });
        console.log('ANALYZE_PAGE message sent successfully');
      } else {
        console.error('No active tab ID found');
      }
    } catch (error) {
      console.error('Failed to analyze page:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = async () => {
    console.log('Clear button clicked');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Active tab for clear:', tab);
      
      if (tab.id) {
        console.log('Sending CLEAR_HIGHLIGHTS message to tab:', tab.id);
        await chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_HIGHLIGHTS' });
        console.log('CLEAR_HIGHLIGHTS message sent successfully');
      } else {
        console.error('No active tab ID found for clear');
      }
    } catch (error) {
      console.error('Failed to clear highlights:', error);
    }
  };

  const handleSettingsChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    chrome.storage.sync.set({ [key]: value });
  };

  return (
    <div className="popup">
      <h1>BiaSense</h1>
      
      <div className="controls">
        <button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing}
          className="analyze-button"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Page'}
        </button>
        
        <button 
          onClick={handleClear}
          className="clear-button"
        >
          Clear Highlights
        </button>
      </div>

      <div className="settings">
        <h2>Settings</h2>
        
        <div className="setting-group">
          <label>Minimum Severity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.minSeverity}
            onChange={(e) => handleSettingsChange('minSeverity', parseFloat(e.target.value))}
          />
          <span>{Math.round(settings.minSeverity * 100)}%</span>
        </div>

        <div className="setting-group">
          <label>Categories</label>
          <div className="category-checkboxes">
            {(['fallacy', 'bias', 'opinion', 'fact'] as AnnotationCategory[]).map(category => (
              <label key={category}>
                <input
                  type="checkbox"
                  checked={settings.enabledCategories.includes(category)}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...settings.enabledCategories, category]
                      : settings.enabledCategories.filter(c => c !== category);
                    handleSettingsChange('enabledCategories', newCategories);
                  }}
                />
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div className="setting-group">
          <label>AI Provider</label>
          <select
            value={settings.aiProvider}
            onChange={(e) => handleSettingsChange('aiProvider', e.target.value as Settings['aiProvider'])}
          >
            <option value="claude">Claude</option>
            <option value="gpt-4">GPT-4</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Popup; 