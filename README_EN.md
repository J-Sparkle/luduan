<h1 align="center">Luduan</h1>

<p align="center">
  <i>"Travels eighteen thousand li a day, and understands the languages of all four directions." — Book of Song</i>
</p>

<p align="center">
  Open-source, free, privacy-first AI inline translator browser extension
</p>

<p align="center">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-7C5CFF.svg"></a>
  <img alt="Manifest" src="https://img.shields.io/badge/manifest-V3-5B8DEF.svg">
  <a href="README.md"><img alt="中文" src="https://img.shields.io/badge/lang-中文-red.svg"></a>
</p>

---

**Luduan (甪端)** is a mythical Chinese beast said to travel eighteen thousand li a day and understand all the languages of the world. This extension carries the same spirit — letting you understand any webpage in any language with a single selection.

## ✨ Features

- 🌐 **Select-to-translate** — Select any text; a bubble pops up; click it for an AI translation card
- 🤖 **Bring any model** — Built-in templates for OpenAI / Claude / Gemini / DeepSeek / Kimi / GLM / Groq / OpenRouter / Ollama, plus full custom protocol support
- 🔑 **BYOK** — No cloud relay. Requests go directly from your browser to your chosen provider. API keys are encrypted locally
- 💡 **Translation styles** — Literal / Natural / Academic / Casual, switch on the fly
- 📚 **Related reading** — Auto-recommended sources from Wikipedia, arXiv, etc.
- 🎨 **Beautiful UI** — Monica-inspired glass cards with a violet/blue gradient
- 🔒 **Zero compromise on privacy** — No telemetry, no account, no backend, fully auditable
- 🌏 **MIT licensed** — Contributions welcome

## 🚀 Quick Start

See [README.md](README.md#-快速开始) (Chinese) for the full install guide, or:

```bash
git clone https://github.com/J-Sparkle/luduan.git
cd luduan && pnpm install && pnpm build
# Load `dist/` in chrome://extensions (Developer mode)
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The easiest entry points:
- Add a new AI provider preset (a single TS file)
- Translate UI strings to a new language
- Improve prompts or fix bugs

## 🔐 Privacy

There is no backend. Requests go from your browser to your AI provider directly. Keys are encrypted at rest with AES-GCM. See [SECURITY.md](SECURITY.md).

## 📜 License

[MIT](LICENSE) © Luduan Contributors
