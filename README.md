# Farcaster Channel Digest

A simple digest that turns Farcaster chaos into context, helping me (and maybe you) find signal in the noise.

## 🌌 Why This Exists

When joining Farcaster, channels can feel opaque and following people often produces chaos instead of signal. Unlike Instagram, there is no instant map of “who’s who” or “where to go,” which makes onboarding confusing.

This project is a small tool to troubleshoot that confusion by surfacing what actually mattered in the last 48 hours instead of forcing you to memorize personalities or chase miniapps.

## ✨ Features

- Fetches casts from 5 hardcoded channels: `/farcaster`, `/fc-devs`, `/higher`, `/ai`, `/frames`.
- Uses free‑tier Neynar endpoints only, fetching casts from active users in each channel.
- Pulls the last 48 hours of casts from channel‑associated users.
- Scores casts by engagement:

\[
\text{score} = \text{likes} + (\text{replies} \times 2) + (\text{recasts} \times 3)
\]

→ prioritizing conversation over vanity metrics.

- Displays the top 5 casts per channel in a simple HTML page.
- Shows cast text, author, engagement numbers, and timestamp.

## 👥 User Selection Philosophy

This digest tracks 7 users across 3 channels, chosen to capture Farcaster's essence:

### /farcaster - Platform Meta & Culture
- **dwr (FID 3)**: Co-founder who sets platform direction and handles community dynamics
- **cassie (FID 1139)**: Culture guardian who defends FC's original values  
- **jacek (FID 1934)**: Community voice in meta discussions about identity

*Why this matters:* This is where FC's soul gets debated — what we stand for, where we're going, what makes us different.

### /fc-devs - The Builders
- **horsefacts (FID 3621)**: Smart contract developer mixing deep insights with humor
- **df (FID 8152)**: Prolific builder who pioneered frames and ships constantly

*Why this matters:* This is where things actually get built. Not just talk — action.

### /higher - The Vibe Check  
- **dwr (FID 3)**: Engages in earnest community discussions
- **horsefacts (FID 3621)**: Active in the anti-degen, pro-substance movement

*Why this matters:* Represents FC's cultural experiment — choosing thoughtful over degenerate, earnest over ironic, substance over casino.

### Temporarily Disabled
- **/ai** and **/frames** are disabled due to free-tier rate limits. Will add back in v0.2 when rate limit handling improves.

**The thesis:** These 7 users across 3 channels capture the full spectrum of what makes Farcaster special — platform direction, builder culture, and values. Free tier limitations force focus. Turns out 3 channels is enough to go from "lost in chaos" to "understanding what FC is about."

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

### ✅ What's Working
- Surfaces important conversations: platform direction, UX debates, memes with actual substance
- Emphasizes signal over noise by highlighting high-engagement casts that spark replies, not just likes
- Provides context to understand current debates around tokens, clients, and culture on Farcaster

### ⚠️ What's Not Working
- User overlap causes duplicates across `/farcaster` and `/higher`
- `/ai` and `/frames` often appear empty due to inactive contributors or API issues
- Narrow perspective — only tracks 2 users per channel due to free tier rate limits
- Clunky refresh experience because of API limitations
- Light mode (yes, I know)

## 🎯 Why This Matters

Farcaster's focused on sustainable growth, but there's a discovery problem: new users often feel lost. It's hard to see the values and culture that made FC special when you're drowning in unfamiliar channels and inside references.

I've watched this place grow since last year. The people here are genuinely magical — thoughtful builders, substantive debates, actual attempts to change things. But without onboarding rails, do most people experience that? Or do they bounce before their heart gets swayed the FC way?

I got lucky. People showed me grace while I figured it out. Now I'm trying to pay that forward.

This tool is a rough prototype of what could help more people find the magic:
- **Channel discovery**: Find spaces by interest, not luck
- **People recommender**: Surface thoughtful contributors worth following
- **Culture guide**: Understand each space's vibe before diving in
- **Information router**: Turn chaos into navigable signal

Right now it's just a digest that helped one confused person. But it hints at making FC's incredible culture more accessible to people who don't have someone showing them around.

FC deserves better onboarding tools. The conversations happening here are too good for people to miss — or for the culture to get diluted as it grows.

If this direction interests you, PRs and ideas welcome.

## 🛠️ Troubleshooting

- **429 Rate Limit Errors** → Increase delay between requests to 1000 ms in `src/index.js`.
- **Empty Channels** → Update `CHANNEL_USERS` with active FIDs for each channel.
- **Author shows `@undefined`** → Fix author data extraction logic in `src/index.js` to use the correct Neynar response fields.

## 🌍 Approaches Compared

| Tool/Approach        | What It Provides                        | Limitation                              | This Project’s Difference                                 |
|----------------------|------------------------------------------|-----------------------------------------|-----------------------------------------------------------|
| Neynar APIs/SDKs     | Raw access to Farcaster protocol data    | Infrastructure only, no opinionated context | Built on Neynar but adds a context and curation layer     |
| Scrapers/Explorers   | Raw feeds and analytics dashboards       | Often developer‑focused, not onboarding  | Digest tuned for users trying to understand conversations |
| Clients (Warpcast)   | Engagement‑optimized feed UI             | Optimizes for likes and engagement, not clarity | Filters for conversation quality instead of raw popularity |
| This Digest          | Daily snapshot of top casts by channel   | Early MVP with simple UI                 | Targets “lost in the black hole” onboarding problem       |
  

## 📸 Screenshot

_Screenshot of the digest UI here once available_ .png

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
