# Bitpulse 📰⚡

**Live at:** [https://bitpulse.online](https://bitpulse.online)

**Bitpulse** is an autonomous, AI-driven crypto news website that recreates and republishes articles from [crypto.news](https://crypto.news) using cutting-edge prompting techniques and large language models (LLMs). Built from scratch in under **one week**, Bitpulse is a showcase of rapid development using AI tooling, modular infrastructure, and modern web stacks.

---

## 🚀 Features

- 🔁 Fully automated news generation from crypto.news
- 🧠 Uses prompt-chaining and dynamic prompt selection powered by LLMs (Groq, LLaMA3)
- 📜 Structured Markdown blog posts generated on-the-fly
- ⚙️ Astro frontend + Playwright scraping + Typer CLI-based dev workflow
- 🧩 Modular architecture with Dockerized services and Traefik gateway
- 🖼️ Supports image-enriched blog posts using scraped captions and descriptions
- ⚡ Live hot reload in dev; optimized static site in production

---

## 🛠️ Tech Stack

| Layer         | Tech                                                             |
|--------------|------------------------------------------------------------------|
| Frontend     | [Astro](https://astro.build/) + TailwindCSS                     |
| Scraping     | [Playwright](https://playwright.dev/)                           |
| Prompting    | Custom templates & selectors + [Groq API](https://groq.com)     |
| Article Store| Markdown (.md) written directly to disk                         |
| CLI Workflow | [Typer](https://typer.tiangolo.com/)                            |
| Containers   | Docker (multi-stage)                                            |
| Routing      | Traefik + NGINX                                                 |

---

## ⚙️ Getting Started

### 1. Install Dependencies

You’ll need:

- Python 3.11+
- Docker + Docker Compose
- [Typer CLI](https://typer.tiangolo.com/tutorial/typer-command/)

---

### 2. Development Setup

```bash
cd integration
typer do.py run dev setup
typer do.py run dev build
```

Fill in the required `.env` files in:

* `astro/.env`
* `composer/.env`

Then start the system:

```bash
typer do.py run dev start
```

* Astro (Frontend): [http://127.0.0.1:3000](http://127.0.0.1:3000)
* NGINX (Static Proxy): [http://127.0.0.1](http://127.0.0.1)

---

### 3. Production Deployment

Set your domain (e.g. `bitpulse.online`) in:

* `integration/docker-compose.prod.yml`

Then run:

```bash
typer do.py run prod start
```

> Traefik will handle TLS, certificates, and routing. Ensure port 80/443 are open.

---

## 🧭 Project Structure

```
.
├── astro         # Astro frontend
├── composer      # Article scraping, LLM prompting, file generation
├── integration   # Dev/prod orchestrator, CLI
├── nginx         # Static content server
├── gateway       # Traefik reverse proxy
└── .env          # Secrets (not committed)
```

Each major component has its own `Dockerfile` and `.env`.

---

## 🧪 How It Works

* The **composer** service scrapes `crypto.news` and uses LLMs to generate:

  * SEO-optimized title
  * Rich Markdown body with embedded images
* Each generated post is written as `.md` in a shared volume.
* The **Astro** frontend picks up changes via file events and re-renders.
* **NGINX** serves a static version of the site (for prod).
* **Traefik** routes traffic and handles certificates.

---

## 📌 TODO

> Bitpulse is working well, but here's what we’d like to improve:

* ✅ **Queue System**: Articles are stored directly to disk — a job queue (Redis?) would improve scalability and retry logic.
* 🖼️ **Image Generator**: Auto-generate custom thumbnails or stylized banners for each blog post using AI image tools.
* 📈 **Advanced SEO**: Meta schema injection, sitemap generation, and social previews.
* 🕵️‍♂️ **Stealth Scraping**: Add stealth modes (rotating IPs, anti-bot JS) for long-term reliability.
* 🌐 **MCP Server Integration**: Connect to Multi-Channel Publishing servers to auto-post content to X/Twitter, Telegram, and newsletters.

---

## 🪪 License

MIT — open-source and free to use, modify, and build upon.

---

## ✨ Built By

Amir Hossein Baghernezhad and the help of a lot of automation ✨