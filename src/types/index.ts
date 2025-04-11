export type AnnotationCategory = 'fallacy' | 'bias' | 'opinion' | 'fact';

export interface Annotation {
  text: string;
  category: AnnotationCategory;
  subtype: string;
  explanation: string;
  severity: number;
  startIndex: number;
  endIndex: number;
}

export interface AnalysisRequest {
  text: string;
  options?: {
    minSeverity?: number;
    categories?: AnnotationCategory[];
  };
}

export interface AnalysisResponse {
  annotations: Annotation[];
  metadata?: {
    processingTime: number;
    model: string;
    version: string;
  };
}

export interface HighlightedText {
  text: string;
  annotation: Annotation;
  element: HTMLElement;
} 