# BiaSense

BiaSense is a Chrome extension that helps users identify logical fallacies, rhetorical bias, and opinion-based language in web articles. It provides real-time analysis of web content to promote critical thinking and media literacy.

## Features

- Real-time analysis of web articles
- Detection of logical fallacies
- Identification of rhetorical bias
- Highlighting of opinion-based language
- User-friendly popup interface
- Background processing for efficient analysis

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your Anthropic API key:
     ```
     VITE_AI_API_KEY=your_api_key_here
     VITE_AI_BASE_URL=https://api.anthropic.com
     ```
   - Get your API key from [Anthropic Console](https://console.anthropic.com/)
4. Build the extension:
   ```bash
   npm run build
   ```
5. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` directory

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Project Structure

- `src/` - Source code
  - `background/` - Background script
  - `content/` - Content scripts
  - `popup/` - Popup UI
  - `api/` - API services
  - `styles/` - CSS/SCSS files
- `public/` - Static assets
- `dist/` - Built extension files

## Technologies Used

- React
- TypeScript
- Vite
- Chrome Extension Manifest V3

## License

Private - All rights reserved
