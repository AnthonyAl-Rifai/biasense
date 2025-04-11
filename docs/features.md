# Core Features

## 1. Content Extraction
- Extracts visible text from paragraphs, headings, and list items.
- Uses `MutationObserver` for dynamic content.

## 2. AI Request Handling
- Sends chunks of text to backend which forwards to AI.
- AI returns annotations with category, subtype, explanation, and confidence.

## 3. DOM Highlight Injection
- Highlights key phrases with color-coded spans.
- Uses Shadow DOM or BEM-styled wrappers.
- Avoids injecting into links/inputs.

## 4. Sidebar UI
- Provides summary stats and filters.
- Built using React portals.

## 5. Backend API
- Endpoint: `POST /analyze`
- Payload: array of text chunks
- Returns: annotation objects

## 6. Prompting
- Paragraph-level reasoning
- Highlights fallacies, bias, and subjective claims
