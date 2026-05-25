# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Initial project scaffold: Vite + React 18 + TypeScript + Tailwind 3 + @crxjs/vite-plugin
- Provider adapter abstraction with three reference implementations: OpenAI, Anthropic, Gemini
- SSE / multi-line `data:` / typed-event parser with chunk-boundary tests
- Content script: selection bubble + translation card (Shadow DOM, Monica-style UI)
- Streaming over `chrome.runtime.Port`
- Popup + Options scaffolding
- 10+ built-in provider presets (OpenAI, Claude, Gemini, DeepSeek, Kimi, GLM, SiliconFlow, Groq, OpenRouter, Ollama, Custom)
- Open-source governance: LICENSE (MIT), README (zh/en), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, GitHub Actions CI, issue/PR templates
