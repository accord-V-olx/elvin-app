# Elvin app

AI-конструктор для меблевих технологів: фото ТЗ → деталі → 3D → код BAZIS.

Структура:
- `index.html`, `ui/` — сайт і 3D;
- `engine/`, `rules/`, `ai/` — розрахунок, правила фабрики, схема відповіді AI;
- `netlify/functions/` — аналіз креслень:
  - `analyze-start` ставить завдання в Netlify Blobs;
  - `analyze-run-background` — Claude (`claude-opus-5-5`) читає фото (фонова функція, до 15 хв);
  - `analyze-status` віддає результат і розрахунок деталей.

У Netlify → Project configuration → Environment variables потрібна змінна:
`ANTHROPIC_API_KEY` — ключ Claude API (той самий, що на сервері accord-gf, або новий з console.anthropic.com).
`OPENAI_API_KEY` більше не потрібен.

Тести: `npm test`.
