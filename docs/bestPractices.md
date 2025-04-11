# Best Practices

- Use content scripts for DOM interaction.
- Avoid injecting into `<a>`, `<input>`, `<textarea>`.
- Use Shadow DOM for tooltips to avoid style conflicts.
- Only wrap highlights with lightweight spans.
- Reset UI state with a 'clear highlights' control.
- Use BEM for class naming in SCSS.
- ESLint + Prettier required.
