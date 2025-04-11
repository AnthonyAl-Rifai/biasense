# BiaSense Chrome Extension

This project is a Chrome extension designed to detect logical fallacies, rhetorical bias, and opinion-based language in web articles using AI.

## 🔧 Tech Stack

- **Frontend**: React + TypeScript (Chrome Extension)
- **Backend**: Node.js (Express) + TypeScript
- **AI Provider**: Claude (Anthropic) or OpenAI
- **Styling**: SCSS with BEM (Block, Element, Modifier)
- **Tooling**: ESLint + Prettier

## 🚀 Features

- Extracts visible text from articles
- Sends text chunks to an AI model for analysis
- Highlights fallacies, bias, and opinions inline
- Color-coded tooltips with explanations
- Sidebar for filtering and overview
- Reset/clear highlight functionality

## 🧠 AI Prompting Strategy

- Reads full paragraph context
- Identifies:
  - Logical fallacies (e.g., Strawman)
  - Biased language (e.g., loaded terms)
  - Subjective opinions
- Returns structured annotations with confidence scores

## 📁 Suggested Project Structure

```
biasense/
├── manifest.json
├── public/
├── src/
│   ├── background/
│   ├── content/
│   ├── sidebar/
│   ├── highlighter/
│   ├── api/
│   ├── prompts/
│   ├── types/
├── server/
├── styles/
├── docs/
│   ├── overview.md
│   ├── features.md
│   ├── prompting.md
│   ├── structure.md
│   ├── development.md
│   ├── fallacyPromptExample.md
│   ├── bestPractices.md
│   ├── api.md
│   ├── nextSteps.md
│   └── README.md
├── .eslintrc.js
├── .prettierrc
├── package.json
└── tsconfig.json
```

## ⚙️ Development Process

- Work in feature chunks
- Have AI scaffold and review each piece
- Refactor and iterate based on validation
- Maintain ESLint/Prettier and SCSS-BEM standards

## 🛣️ Roadmap

- [ ] Finalize AI prompt
- [ ] Build `/analyze` endpoint
- [ ] Extract and send content
- [ ] Overlay highlights and build sidebar
- [ ] Enable user feedback on annotations

## 📂 Docs Location

Documentation is modularized in `/docs` for IDE/AI assistant access.

## 📜 License

MIT
