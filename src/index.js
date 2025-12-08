import express from 'express';
import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Neynar client (v2 syntax)
if (!process.env.NEYNAR_API_KEY) {
  console.error('ERROR: NEYNAR_API_KEY is not set in .env file');
  process.exit(1);
}

const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY,
});

const neynarClient = new NeynarAPIClient(config);

// Cache for storing digest results (30 minute TTL)
const cache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 30 * 60 * 1000 // 30 minutes in milliseconds
};

// Hardcoded channels with associated active users (FIDs or usernames)
// Since channel feeds require payment, we fetch casts from specific users active in each channel
// Update these with actual FIDs (numbers) or usernames of users who post in these channels
// You can find FIDs using: https://warpcast.com/~/developers
const CHANNEL_USERS = {
  '/farcaster': [1325, 15983, 99],        // dwr muted temp, cassie, jacek, jesse (platform meta + culture)
  '/fc-devs': [3621, 8152],          // horsefacts, df (builders + humor)
  '/higher': [3],                // dwr, horsefacts muted temp (earnest FC vibe)
  '/ai': [221255],                  // ligne12 personal pref TEMPORARILY DISABLED - hitting rate limits
  // '/frames': [8152, 3621]         // TEMPORARILY DISABLED - hitting rate limits
};

/**
* USER SELECTION RATIONALE
* 
* The goal: Capture FC's essence in 3 channels with users who represent what makes this place special.
* 
* /farcaster - Platform Meta & Culture
* - dwr (3): Co-founder, sets direction, handles drama, makes platform decisions
* - cassie (1139): Culture guardian, calls out what matters, defends original FC values
* - jacek (1934): Community voice, engages in meta discussions about identity
* Why: This is where FC's soul gets debated. Direction, values, what we stand for.
* 
* /fc-devs - The Builders  
* - horsefacts (3621): Smart contract dev, mixes deep insights with humor and philosophy
* - df (8152): Ships constantly, pioneered frames, crosses multiple domains
* Why: This is where things actually get built. Not just talk - action.
* 
* /higher - The Vibe Check
* - dwr (3): Engages in earnest discussions here
* - horsefacts (3621): Active in the anti-degen movement
* Why: Represents FC's attempt to be different - thoughtful over degenerate, 
*      earnest over ironic, substance over casino. The cultural experiment.
* 
* /ai - DISABLED (Temporarily)
* Hitting free-tier rate limits. Will add back when rate limit strategy improves.
* Target users: vitalik (5), balajis (5650) for serious AI discourse
* 
* /frames - DISABLED (Temporarily) 
* Hitting free-tier rate limits. Will add back when rate limit strategy improves.
* Target users: df (8152), horsefacts (3621) for frame innovation
* 
* These 7 users (3 channels) capture:
* - Platform direction (dwr, cassie, jacek)
* - Builder mindset (horsefacts, df)  
* - Cultural identity (higher community)
* - The full spectrum: meta → building → values
* 
* Free tier limits force focus. These 3 channels are enough to go from 
* "lost in the chaos" to "understanding what FC is about."
*/

/**
 * Extract author name with multiple fallback options
 * Tries: username -> display_name -> fname -> FID -> 'Unknown'
 */
function getAuthorName(cast) {
    return cast.author?.username || 
           cast.author?.display_name || 
           cast.author?.fname || 
           `FID-${cast.author?.fid}` || 
           'Unknown';
}  

/**
 * Calculate engagement score: (likes + replies*2 + recasts*3)
 * This weights conversation over vanity metrics
 */
function calculateScore(cast) {
  const likes = cast.reactions?.likes?.length || 0;
  const replies = cast.replies?.count || 0;
  const recasts = cast.reactions?.recasts?.length || 0;
  
  return likes + (replies * 2) + (recasts * 3);
}

/**
 * Fetch casts from users associated with a channel (using free-tier endpoints)
 * Uses /user and /cast APIs which are available in the free tier
 */
async function fetchChannelCasts(channel) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    let users = CHANNEL_USERS[channel] || [];
    if (users.length === 0) {
      console.warn(`No users defined for channel ${channel}`);
      return [];
    }

    // Limit to 4 users per channel (caching allows more users)
    users = users.slice(0, 4);

    // Fetch casts from each user sequentially (not in parallel) using free-tier endpoint
    const allCasts = [];
    
    for (const userIdentifier of users) {
      try {
        let fid;
        let response;
        
        // Determine if userIdentifier is a FID (number) or username (string)
        fid = typeof userIdentifier === 'number' ? userIdentifier : parseInt(userIdentifier);
        
        if (isNaN(fid)) {
          // It's a username - lookup the FID first (free tier /user endpoint)
          try {
            const userResponse = await neynarClient.lookupUserByUsername(userIdentifier);
            fid = userResponse.result?.user?.fid || userResponse.user?.fid;
            if (!fid) {
              console.warn(`Could not find FID for username: ${userIdentifier}`);
              continue;
            }
            // Add 2 second delay after user lookup to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (err) {
            console.warn(`Error looking up user ${userIdentifier}:`, err.message);
            continue;
          }
        }
        
        // Fetch casts for this user using free tier /cast endpoint
        // Note: Method name may vary - check v2 SDK docs for exact method name
        try {
          // Try common method names for fetching user casts
          if (typeof neynarClient.fetchCastsForUser === 'function') {
            response = await neynarClient.fetchCastsForUser({ fid, limit: 25 });
          } else if (typeof neynarClient.fetchUserCasts === 'function') {
            response = await neynarClient.fetchUserCasts({ fid, limit: 25 });
          } else {
            // Fallback: use searchCasts with parentFid filter if available
            console.warn(`fetchCastsForUser method not found, trying alternatives for user ${fid}`);
            continue;
          }
        } catch (err) {
          console.error(`Error fetching casts for FID ${fid}:`, err.message);
          continue;
        }

        // Handle different response structures
        const casts = response.result?.casts || response.casts || response.data?.casts || [];
        allCasts.push(...casts);
        
        // Add 2 second delay between each user fetch to respect rate limits
        // Sequential fetching ensures we stay well under free tier limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing user ${userIdentifier} in channel ${channel}:`, error.message);
        // Continue with other users
      }
    }
    
    // Filter casts from last 24 hours and score them
    const recentCasts = allCasts
      .filter(cast => {
        const castDate = new Date(cast.timestamp);
        return castDate >= oneDayAgo;
      })
      .map(cast => ({
        text: cast.text,
        author: getAuthorName(cast),
        authorFid: cast.author?.fid,
        likes: cast.reactions?.likes?.length || cast.likes?.length || 0,
        replies: cast.replies?.count || cast.replies?.length || 0,
        recasts: cast.reactions?.recasts?.length || cast.recasts?.length || 0,
        timestamp: cast.timestamp,
        hash: cast.hash,
        score: calculateScore(cast),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return recentCasts;
  } catch (error) {
    console.error(`Error fetching casts for channel ${channel}:`, error.message);
    return [];
  }
}

/**
 * Generate HTML page with digest (or loading indicator)
 */
function generateHTML(digest, isLoading = false, cacheTimestamp = null) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Farcaster Channel Digest</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .channel-section {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .channel-section h2 {
            color: #666;
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .cast {
            border-left: 3px solid #8a63d2;
            padding-left: 15px;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }
        .cast:last-child {
            border-bottom: none;
        }
        .cast-text {
            font-size: 16px;
            line-height: 1.6;
            color: #333;
            margin-bottom: 10px;
        }
        .cast-meta {
            font-size: 14px;
            color: #666;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        .cast-author {
            font-weight: 600;
            color: #8a63d2;
        }
        .engagement {
            display: inline-block;
            margin-right: 15px;
        }
        .score {
            background: #8a63d2;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 600;
        }
        .timestamp {
            color: #999;
        }
        .error {
            color: #d32f2f;
            padding: 10px;
            background: #ffebee;
            border-radius: 4px;
        }
        .empty {
            color: #999;
            font-style: italic;
        }
    </style>
</head>
<body>
    <h1>🔮 Farcaster Channel Digest</h1>
    <p style="text-align: center; color: #666;">Top 5 casts from active users in each channel (last 48 hours)</p>
    <p style="text-align: center; color: #999; font-size: 14px; max-width: 800px; margin: 10px auto;">Note: Due to free-tier API limitations, some channels may show overlapping content or be empty. This tool prioritizes reliability over completeness.</p>
`;

  // Show loading indicator if data is being fetched
  if (isLoading) {
    html += `
    <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; margin: 20px 0;">
        <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
        <p style="color: #666; font-size: 16px;">Fetching data slowly to respect rate limits...</p>
        <p style="color: #999; font-size: 14px; margin-top: 10px;">This may take a minute. Please wait...</p>
    </div>
`;
    html += `</body>
</html>`;
    return html;
  }

  // Add "Last updated" message if cache timestamp provided
  if (!isLoading && cacheTimestamp) {
    const minutesAgo = Math.floor((Date.now() - cacheTimestamp) / 1000 / 60);
    const timeText = minutesAgo === 0 ? 'just now' : 
                     minutesAgo === 1 ? '1 minute ago' : 
                     `${minutesAgo} minutes ago`;
    html += `<p style="text-align: center; color: #999; font-size: 12px; margin-bottom: 20px;">Last updated: ${timeText} • <a href="/?refresh=true" style="color: #8a63d2;">Refresh</a></p>`;
  }

  html += `
`;

  digest.forEach(({ channel, casts, error }) => {
    html += `    <div class="channel-section">
        <h2>${channel}</h2>
`;

    if (error) {
      html += `        <div class="error">Error: ${error}</div>\n`;
    } else if (casts.length === 0) {
      html += `        <div class="empty">No casts found in the last 24 hours</div>\n`;
    } else {
      casts.forEach(cast => {
        html += `        <div class="cast">
            <div class="cast-text">${escapeHtml(cast.text)}</div>
            <div class="cast-meta">
                <span class="cast-author">@${cast.author || 'unknown'}</span>
                <span class="engagement">❤️ ${cast.likes}</span>
                <span class="engagement">💬 ${cast.replies}</span>
                <span class="engagement">🔄 ${cast.recasts}</span>
                <span class="score">Score: ${cast.score}</span>
                <span class="timestamp">${formatTimestamp(cast.timestamp)}</span>
            </div>
        </div>
`;
      });
    }

    html += `    </div>
`;
  });

  html += `</body>
</html>`;

  return html;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Format timestamp to readable format
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Main route - generate and display digest
 */
app.get('/', async (req, res) => {
  // Check if refresh is requested (bypass cache)
  const forceRefresh = req.query.refresh === 'true';
  
  // Check cache first (unless refresh is forced)
  // Cache is valid if data exists, timestamp exists, and age is < 30 minutes
  const now = Date.now();
  const cacheAge = cache.timestamp ? (now - cache.timestamp) : null;
  const isCacheValid = !forceRefresh && cache.data && cache.timestamp && cacheAge < cache.CACHE_DURATION;
  
  if (isCacheValid) {
    console.log(`Serving from cache (age: ${Math.floor(cacheAge / 1000 / 60)} minutes)`);
    const html = generateHTML(cache.data, false, cache.timestamp);
    res.send(html);
    return;
  }

  // If cache miss or expired (> 30 minutes), fetch fresh data
  if (cacheAge !== null) {
    console.log(`Cache expired (age: ${Math.floor(cacheAge / 1000 / 60)} minutes), fetching fresh data...`);
  } else {
    console.log('No cache found, fetching fresh data...');
  }
  
  // Fetch data sequentially for each channel (not in parallel) to avoid rate limits
  const channels = Object.keys(CHANNEL_USERS);
  const digest = [];
  
  for (const channel of channels) {
    try {
      console.log(`Fetching casts for channel: ${channel}`);
      const casts = await fetchChannelCasts(channel);
      digest.push({ channel, casts, error: null });
    } catch (error) {
      console.error(`Error processing channel ${channel}:`, error);
      digest.push({ channel, casts: [], error: error.message });
    }
  }

  // Update cache
  cache.data = digest;
  cache.timestamp = Date.now();
  console.log('Cache updated');

  // Send the complete page (browser will show loading state during fetch)
  const html = generateHTML(digest, false, cache.timestamp);
  res.send(html);
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Channels: ${Object.keys(CHANNEL_USERS).join(', ')}`);
  console.log(`🔑 API Key: ${process.env.NEYNAR_API_KEY ? '✓ Set' : '✗ Missing'}`);
});