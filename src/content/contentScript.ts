import { Annotation, HighlightedText } from '../types';
import '../styles/content.scss';

class ContentScript {
  private highlightedTexts: HighlightedText[] = [];
  private isAnalyzing = false;

  constructor() {
    console.log('Content script initialized');
    this.initialize();
  }

  private initialize() {
    console.log('Setting up message listeners');
    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Received message:', message);
      
      if (message.type === 'ANALYZE_PAGE') {
        console.log('Starting page analysis');
        this.analyzePage();
        sendResponse({ status: 'started' });
      } else if (message.type === 'CLEAR_HIGHLIGHTS') {
        console.log('Clearing highlights');
        this.clearHighlights();
        sendResponse({ status: 'cleared' });
      }
    });
  }

  private async analyzePage() {
    if (this.isAnalyzing) {
      console.log('Already analyzing, skipping');
      return;
    }
    this.isAnalyzing = true;
    console.log('Starting analysis');

    try {
      console.log('Extracting text from page');
      const text = this.extractText();
      console.log('Extracted text length:', text.length);
      
      // Get current settings from storage
      const settings = await chrome.storage.sync.get(['minSeverity', 'enabledCategories', 'aiProvider']);
      console.log('Current settings:', settings);
      
      console.log('Sending text for analysis with settings');
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_TEXT',
        text,
        options: {
          minSeverity: settings.minSeverity ?? 0.5,
          categories: settings.enabledCategories ?? ['fallacy', 'bias', 'opinion'],
          aiProvider: settings.aiProvider ?? 'claude'
        }
      });
      console.log('Received analysis response:', response);

      if (response.annotations) {
        console.log('Highlighting text with annotations');
        this.highlightText(response.annotations);
      } else {
        console.error('No annotations in response');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      this.isAnalyzing = false;
      console.log('Analysis completed');
    }
  }

  private extractText(): string {
    // Get all text nodes in the document
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style elements
          if (node.parentElement?.tagName === 'SCRIPT' || 
              node.parentElement?.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const texts: string[] = [];
    let currentNode: Node | null = walker.nextNode();
    while (currentNode) {
      if (currentNode.textContent?.trim()) {
        texts.push(currentNode.textContent.trim());
      }
      currentNode = walker.nextNode();
    }

    return texts.join('\n\n');
  }

  private highlightText(annotations: Annotation[]) {
    this.clearHighlights();
    console.log('Starting to highlight annotations:', annotations);

    annotations.forEach((annotation, index) => {
      const { text } = annotation;
      console.log(`Processing annotation ${index + 1}/${annotations.length}:`, annotation);
      const range = document.createRange();

      // Normalize the search text
      const searchText = this.normalizeText(text);
      console.log('Normalized search text:', searchText);

      // Find the text node containing the annotation
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      let currentNode: Node | null = walker.nextNode();
      let found = false;

      while (currentNode && !found) {
        const nodeText = currentNode.textContent || '';
        const normalizedNodeText = this.normalizeText(nodeText);
        const index = normalizedNodeText.indexOf(searchText);

        if (index !== -1) {
          console.log('Found text match in node:', {
            searchText,
            nodeText: nodeText.substring(Math.max(0, index - 20), index + text.length + 20),
            normalizedNodeText: normalizedNodeText.substring(Math.max(0, index - 20), index + searchText.length + 20),
            parentTag: currentNode.parentElement?.tagName
          });

          // Find the actual index in the original text
          const originalTextBeforeMatch = nodeText.substring(0, index);
          const actualIndex = originalTextBeforeMatch.length;

          try {
            range.setStart(currentNode, actualIndex);
            range.setEnd(currentNode, actualIndex + text.length);
            found = true;
          } catch (error) {
            console.error('Failed to set range:', error);
          }
        }
        currentNode = walker.nextNode();
      }

      if (found) {
        try {
          const span = document.createElement('span');
          span.className = `fallacy-highlight fallacy-${annotation.category}`;
          span.dataset.fallacyType = annotation.subtype;
          span.dataset.explanation = annotation.explanation;
          span.dataset.severity = annotation.severity.toString();

          range.surroundContents(span);
          this.highlightedTexts.push({
            text,
            annotation,
            element: span
          });

          // Add tooltip
          this.addTooltip(span, annotation);
          console.log(`Successfully highlighted annotation ${index + 1}`);
        } catch (error) {
          console.error(`Failed to highlight annotation ${index + 1}:`, error);
        }
      } else {
        // Try fuzzy matching if exact match fails
        console.warn(`Could not find exact text match for annotation ${index + 1}, trying fuzzy match:`, text);
        this.tryFuzzyMatch(text, annotation, index);
      }
    });

    console.log('Highlighting completed. Total highlights:', this.highlightedTexts.length);
  }

  private normalizeText(text: string): string {
    return text
      .replace(/[\u2018\u2019]/g, "'") // Normalize single quotes
      .replace(/[\u201C\u201D]/g, '"') // Normalize double quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private tryFuzzyMatch(text: string, annotation: Annotation, annotationIndex: number) {
    const words = text.split(/\s+/);
    if (words.length < 4) return; // Don't try fuzzy matching for very short phrases

    // Try to find a sequence of words that closely matches
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentNode: Node | null = walker.nextNode();
    while (currentNode) {
      const nodeText = currentNode.textContent || '';
      const normalizedNodeText = this.normalizeText(nodeText);
      
      // Look for the first few words
      const firstWords = words.slice(0, 3).join(' ');
      const normalizedFirstWords = this.normalizeText(firstWords);
      
      if (normalizedNodeText.includes(normalizedFirstWords)) {
        console.log('Found fuzzy match:', {
          original: text,
          matched: nodeText,
          node: currentNode
        });
        
        try {
          const range = document.createRange();
          const startIndex = normalizedNodeText.indexOf(normalizedFirstWords);
          range.setStart(currentNode, startIndex);
          range.setEnd(currentNode, startIndex + nodeText.length);

          const span = document.createElement('span');
          span.className = `fallacy-highlight fallacy-${annotation.category}`;
          span.dataset.fallacyType = annotation.subtype;
          span.dataset.explanation = annotation.explanation;
          span.dataset.severity = annotation.severity.toString();

          range.surroundContents(span);
          this.highlightedTexts.push({
            text,
            annotation,
            element: span
          });

          this.addTooltip(span, annotation);
          console.log(`Successfully highlighted annotation ${annotationIndex + 1} using fuzzy match`);
          return;
        } catch (error) {
          console.error('Failed to apply fuzzy match highlight:', error);
        }
      }
      currentNode = walker.nextNode();
    }
  }

  private addTooltip(element: HTMLElement, annotation: Annotation) {
    const tooltip = document.createElement('div');
    tooltip.className = 'fallacy-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-type">${annotation.subtype}</span>
        <span class="tooltip-severity">${Math.round(annotation.severity * 100)}%</span>
      </div>
      <div class="tooltip-explanation">${annotation.explanation}</div>
    `;

    element.appendChild(tooltip);

    element.addEventListener('mouseenter', () => {
      tooltip.style.display = 'block';
    });

    element.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  }

  private clearHighlights() {
    this.highlightedTexts.forEach(({ element }) => {
      const parent = element.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(element.textContent || ''), element);
      }
    });
    this.highlightedTexts = [];
  }
}

// Initialize the content script
new ContentScript(); 