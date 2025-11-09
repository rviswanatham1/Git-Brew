# GitBrew Dashboard

A real-time monitoring dashboard for potion factory operations with AI-powered insights and analytics.

## Features

- **Real-time Monitoring**: Track cauldron levels, volumes, and fill rates in real-time
- **Network Map**: Visualize the potion transport network with animated courier movements
- **Historical Data**: View historical cauldron volume trends with interactive line charts
- **Discrepancy Detection**: Automatically identify suspicious activity in transport tickets
- **AI Assistant**: Conversational AI assistant powered by Google Gemini with speech-to-text and text-to-speech capabilities
- **Smart Alerts**: AI-powered recommendations and alerts for factory management
- **Route Optimization**: Analyze and optimize transport routes
- **Analytics**: Comprehensive analytics and insights

## Tech Stack

- **Framework**: Next.js 16.0.0
- **UI Library**: React 19.2.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Text-to-Speech**: ElevenLabs API
- **Charts**: Recharts
- **UI Components**: Radix UI

## Getting Started

### Prerequisites

- Node.js 20 LTS or newer
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MeddyT/gitBrew.git
cd gitBrew
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# ElevenLabs API Key (optional, for text-to-speech)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
gitBrew/
├── app/                           # Next.js app directory
│   ├── api/                       # API routes
│   │   ├── cauldron-levels/       # Cauldron level data endpoint
│   │   ├── config/                # Configuration endpoint
│   │   ├── elevenlabs/            # ElevenLabs TTS API
│   │   ├── gemini/                # Gemini AI endpoints
│   │   │   ├── data-query/        # Natural language data queries
│   │   │   ├── help/              # Contextual help
│   │   │   ├── insights/          # AI insights
│   │   │   ├── predict/           # Predictive analytics
│   │   │   ├── translate/         # Multi-language support
│   │   │   └── route.ts           # Main Gemini chat endpoint
│   │   └── transport-tickets/     # Transport ticket data
│   ├── globals.css                # Global styles with background image
│   ├── layout.tsx                 # Root layout component
│   └── page.tsx                   # Main dashboard page
├── components/                     # React components
│   ├── ai-assistant.tsx           # AI assistant floating widget
│   ├── cauldron-grid.tsx          # Cauldron grid display
│   ├── cauldron-map.tsx           # Network map visualization
│   ├── contextual-help.tsx        # Contextual help component
│   ├── data-query.tsx             # Natural language data query UI
│   ├── discrepancy-panel.tsx      # Discrepancy detection panel
│   ├── historical-playback.tsx    # Historical data charts
│   ├── language-selector.tsx     # Language selection component
│   ├── predictive-analytics.tsx  # Predictive analytics component
│   ├── route-optimizer.tsx        # Route optimization component
│   ├── smart-alerts.tsx           # Smart alerts component
│   ├── theme-provider.tsx         # Theme provider
│   └── ui/                        # Reusable UI components (50+ components)
│       ├── button.tsx
│       ├── card.tsx
│       ├── chart.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       └── ... (many more UI components)
├── data/                          # JSON data files
│   ├── config.json                # Factory configuration
│   ├── timestamps.json            # Historical cauldron levels
│   └── transport-tickets.json     # Transport ticket data
├── hooks/                         # Custom React hooks
│   ├── use-cauldron-data.ts      # Cauldron data fetching hook
│   ├── use-historical-data.ts     # Historical data hook
│   ├── use-mobile.ts              # Mobile detection hook
│   └── use-toast.ts               # Toast notification hook
├── lib/                           # Utility functions
│   └── utils.ts                   # Utility functions
├── public/                        # Static assets
│   ├── Git Brewed.png             # Logo image
│   ├── icon.png                   # Favicon
│   └── IMG_6252.jpeg              # Background image
├── scripts/                       # Build scripts
│   └── generate-cauldron-data.ts  # Data generation script
├── types/                         # TypeScript type definitions
│   └── cauldron.ts                # Cauldron-related types
├── components.json                 # Component configuration
├── next.config.mjs                # Next.js configuration
├── package.json                   # Dependencies
├── postcss.config.mjs             # PostCSS configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

## API Keys Setup

### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `GEMINI_API_KEY`

### ElevenLabs API Key (Optional)
1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Get your API key from the dashboard
3. Add it to your `.env` file as `ELEVENLABS_API_KEY`
4. Enable "Text to Speech: Access" and "Voices: Read" permissions

## Features in Detail

### AI Assistant
- Natural language queries about your data
- Speech-to-text input
- Text-to-speech responses
- Contextual help and troubleshooting
- Multi-language support

### Network Map
- Real-time visualization of cauldron network
- Animated courier movements
- Distance labels between nodes
- Topographical layout based on coordinates

### Historical Playback
- Individual line graphs for each cauldron
- Volume over time visualization
- Interactive tooltips with detailed information
- Static axes for consistent viewing
