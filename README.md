# Farcaster Channel Digest

A simple digest that turns Farcaster chaos into context, helping me (and maybe you) find signal in the noise.

## 🌌 Why This Exists

When joining Farcaster, channels can feel opaque and following people often produces chaos instead of signal. Unlike Instagram, there is no instant map of “who’s who” or “where to go,” which makes onboarding confusing.

This project is a small tool to troubleshoot that confusion by surfacing what actually mattered in the last 24 hours instead of forcing you to memorize personalities or chase miniapps.

## ✨ Features

- Fetches casts from 5 hardcoded channels: `/farcaster`, `/fc-devs`, `/higher`, `/ai`, `/frames`.
- Uses free‑tier Neynar endpoints only, fetching casts from active users in each channel.
- Pulls the last 24 hours of casts from channel‑associated users.
- Scores casts by engagement:  

  \[
  \text{score} = \text{likes} + (\text{replies} \times 2) + (\text{recasts} \times 3)
  \]
  → prioritizing conversation over vanity metrics.

- Displays the top 5 casts per channel in a simple HTML page.
- Shows cast text, author, engagement numbers, and timestamp.

  

## 🛠️ Setup

1. Install dependencies:

```
npm install
```

2. Create `.env` file:

```
cp .env.example .env
```

3. Add your Neynar API key in `.env`:

```
NEYNAR_API_KEY=your_neynar_api_key_here

PORT=3000
```

4. Start the server:

```
npm start
```

5. Open your browser and navigate to `http://localhost:3000`. [web:5]

## 📂 Project Structure

farcaster-digest/
├── src/
│ └── index.js # Main server file
├── .env # Environment variables (not in git)
├── .env.example # Example env file
├── .gitignore
├── package.json
└── README.md

  
## 🔎 Honest Assessment

### ✅ What’s Working

- Surfaces important conversations such as platform direction, UX debates, and memes with actual substance.
- Emphasizes signal over noise by highlighting high‑engagement casts that spark replies, not just likes.
- Provides enough context to understand current debates around tokens, clients, and culture on Farcaster.

### ⚠️ What’s Not Working

- User overlap can cause duplicates across `/farcaster` and `/higher`.
- Some channels like `/ai` and `/frames` may appear empty due to inactive contributors or bugs.
- Narrow perspective because the current setup only tracks a small number of users per channel.
- Free tier API limits can make refreshing the digest feel clunky.

## 🛠️ Troubleshooting

- **429 Rate Limit Errors** → Increase delay between requests to 1000 ms in `src/index.js`.
- **Empty Channels** → Update `CHANNEL_USERS` with active FIDs for each channel.
- **Author shows `@undefined`** → Fix author data extraction logic in `src/index.js` to use the correct Neynar response fields.

## 🌍 Approaches Compared

| Tool/Approach        | What It Provides                          | Limitation                              | This Project’s Difference                                 |

|----------------------|--------------------------------------------|-----------------------------------------|-----------------------------------------------------------|

| Neynar APIs/SDKs     | Raw access to Farcaster protocol data  | Infrastructure only, no opinionated context  | Built on Neynar but adds a context and curation layer     |

| Scrapers/Explorers   | Raw feeds and analytics dashboards  | Often developer‑focused, not onboarding  | Digest tuned for users trying to understand conversations |

| Clients (Warpcast)   | Engagement‑optimized feed UI        | Optimizes for likes and engagement, not clarity  | Filters for conversation quality instead of raw popularity |

| This Digest          | Daily snapshot of top casts by channel     | Early MVP with simple UI                 | Targets “lost in the black hole” onboarding problem       |

  

## 📸 Screenshot

_Screenshot of the digest UI here once available (for example, `docs/screenshot.png`)._

## 🎯 Roadmap

- Smarter scoring model (tune weights for replies, recasts, and likes).
- Add more channels plus user configuration for custom digests.
- Prettier UI with profile pictures, better timestamps, and Warpcast links.
- Daily {output tbd} digest export.
- Long‑term: evolve into an information router for smart channel discovery, people recommendations, and culture mapping.

## 🤝 Contributing

Built in public; feedback, roasts, and pull requests are welcome. Open an issue or submit a PR if you have ideas for better scoring, channel selection, or onboarding flows.

## 🔥 Final Notes

This is an intentionally simple MVP that helped one person stop feeling lost on Farcaster. If it helps you too, that is a win; if not, feel free to fork it and push the experiment further.