import { Annotation, AnalysisRequest, AnalysisResponse } from '../types';

interface RawAnnotation {
  text: string;
  category: string;
  subtype: string;
  explanation: string;
  severity: number;
  startIndex?: number;
  endIndex?: number;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

const createAnalysisPrompt = (text: string): string => {
  return `You are a critical thinking assistant trained to identify flaws in argumentation and rhetoric.

For the following text, perform the following steps:
1. Read the full paragraph to understand context.
2. Highlight sentences or phrases that contain:
   - Logical fallacies (e.g., Strawman, Slippery Slope)
   - Rhetorical bias or emotionally charged language
   - Subjective opinions presented as objective facts

For each match, return a JSON array of objects with these exact properties:
- text: The exact matched text
- category: One of "fallacy", "bias", "opinion", or "fact"
- subtype: A specific label (e.g., "Ad Hominem", "Loaded Language")
- explanation: A brief explanation (1-2 sentences)
- severity: A number between 0.0 and 1.0

IMPORTANT: Respond ONLY with a valid JSON array. Do not include any other text or formatting.

Text to analyze:
"""
${text}
"""`;
};

export class AIService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: {
    apiKey: string;
    baseUrl: string;
    model: 'claude' | 'gpt-4';
  }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    console.log('AIService initialized with baseUrl:', this.baseUrl);
  }

  async analyzeText(request: AnalysisRequest): Promise<AnalysisResponse> {
    const startTime = Date.now();
    
    try {
      console.log('Making API request to:', this.baseUrl);
      console.log('Analysis settings:', {
        minSeverity: request.options?.minSeverity ?? 0,
        enabledCategories: request.options?.categories,
        aiProvider: this.model
      });
      const prompt = createAnalysisPrompt(request.text);
      
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: prompt
          }]
        }),
      });

      if (!response.ok) {
        console.error('API request failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw AI response:', data);
      
      const annotations = this.parseAIResponse(data);
      console.log('Parsed annotations:', annotations);
      
      const minSeverity = request.options?.minSeverity ?? 0;
      const categories = request.options?.categories;
      
      const filteredAnnotations = annotations.filter(a => a.severity >= minSeverity);
      console.log('Annotations after severity filter:', filteredAnnotations);
      
      const categoryFilteredAnnotations = categories
        ? filteredAnnotations.filter(a => categories.includes(a.category))
        : filteredAnnotations;
      console.log('Annotations after category filter:', categoryFilteredAnnotations);

      return {
        annotations: categoryFilteredAnnotations,
        metadata: {
          processingTime: Date.now() - startTime,
          model: this.model,
          version: '1.0.0'
        }
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error('Failed to analyze text');
    }
  }

  private parseAIResponse(response: AnthropicResponse): Annotation[] {
    try {
      console.log('Parsing AI response:', response);
      
      if (!response?.content?.[0]?.text) {
        console.error('Invalid response structure:', response);
        return [];
      }

      const content = response.content[0].text;
      console.log('Response content:', content);

      try {
        // Clean up the content string
        const cleanContent = content
          .replace(/\n\s*/g, '') // Remove newlines and associated whitespace
          .replace(/,(\s*}|\s*])/g, '$1') // Remove trailing commas
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();

        console.log('Cleaned content:', cleanContent);
        
        const parsed = JSON.parse(cleanContent);
        console.log('Parsed JSON:', parsed);
        
        if (!Array.isArray(parsed)) {
          console.error('Parsed content is not an array:', parsed);
          return [];
        }

        // Map the parsed annotations to our Annotation type
        return parsed.map((annotation: RawAnnotation) => ({
          text: annotation.text,
          category: annotation.category as Annotation['category'],
          subtype: annotation.subtype,
          explanation: annotation.explanation,
          severity: annotation.severity,
          startIndex: annotation.startIndex || 0,
          endIndex: annotation.endIndex || 0
        }));
      } catch (e) {
        console.error('Failed to parse JSON content:', e);
        console.error('Content that failed to parse:', content);
        
        // Try parsing without cleaning if the cleaned version fails
        try {
          const parsed = JSON.parse(content);
          console.log('Parsed JSON without cleaning:', parsed);
          
          if (!Array.isArray(parsed)) {
            console.error('Parsed content is not an array:', parsed);
            return [];
          }

          return parsed.map((annotation: RawAnnotation) => ({
            text: annotation.text,
            category: annotation.category as Annotation['category'],
            subtype: annotation.subtype,
            explanation: annotation.explanation,
            severity: annotation.severity,
            startIndex: annotation.startIndex || 0,
            endIndex: annotation.endIndex || 0
          }));
        } catch (e2) {
          console.error('Failed to parse JSON content without cleaning:', e2);
          return [];
        }
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [];
    }
  }
} 