<div align="center">

# Pulse

**Event-Driven Traffic Intelligence for Bengaluru Traffic Police**

![Pulse Logo](public/Pulse_logo.png)

An AI-powered Congestion Copilot that predicts localized traffic bottlenecks caused by planned and unplanned events, and recommends dynamic resource allocation - barricades, manpower, and diversions.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-9.x-47A248?logo=mongodb)](https://mongodb.com/)
[![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b-orange)](https://groq.com/)

</div>

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Data Pipeline](#data-pipeline)
- [API Reference](#api-reference)
- [RAG Pipeline](#rag-pipeline)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [License](#license)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PULSE Architecture                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Next.js 16 App Router                        │ │
│  │                                                                 │ │
│  │  ┌─────────────────────┐    ┌────────────────────────────────┐ │ │
│  │  │   MapView (70%)     │    │    Copilot Panel (30%)        │ │ │
│  │  │   ├─ MapLibre GL    │    │    ├─ Event Form              │ │ │
│  │  │   ├─ Event Markers  │    │    ├─ Prediction Cards        │ │ │
│  │  │   └─ Clustering     │    │    └─ Diversion Strategy      │ │ │
│  │  └─────────────────────┘    └────────────────────────────────┘ │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │                    API Routes                             │  │ │
│  │  │  GET /api/events          POST /api/predict-impact        │  │ │
│  │  └──────────┬───────────────────────────┬────────────────────┘  │ │
│  └─────────────┼───────────────────────────┼──────────────────────┘ │
│                │                           │                         │
│  ┌─────────────▼───────┐    ┌──────────────▼──────────────────────┐ │
│  │     MongoDB          │    │         RAG Pipeline                │ │
│  │  ├─ Events Collection│◄───│  ├─ Retriever ($geoNear + cosine)  │ │
│  │  ├─ 2dsphere Index   │    │  └─ Agent (Groq llama-3.3-70b)    │ │
│  │  └─ Embeddings       │    └────────────────────────────────────┘ │
│  └──────────────────────┘                                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                    Data Pipeline (Seed)                          ││
│  │  CSV → Preprocess → Vectorize → MongoDB                         ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

---

## Features

### 🗺️ Interactive Traffic Map
- Dark-themed MapLibre GL map centered on Bengaluru
- 8,000+ historical event markers with color-coded event types
- Click-to-select markers with detailed popups
- Zoom-adaptive marker density for performance
- Fly-to animations on event selection

### 🤖 AI Copilot Panel
- **Event Form**: Input new traffic events with map click integration
- **RAG-Powered Analysis**: Retrieves similar historical events within 2km radius
- **Groq LLM Analysis**: Generates predictions using llama-3.3-70b-versatile
- **Prediction Cards**: Forecasted delay, recommended manpower, risk level
- **Diversion Strategy**: Actionable barricading and route recommendations

### 📊 Dashboard Metrics
- Total events, active events, average resolution time
- Top event cause, high priority count, road closures
- Staggered entrance animations for visual engagement

### 🔄 Data Pipeline
- CSV preprocessing with cleansing and imputation
- Feature-engineered vectorization (15-dimensional embeddings)
- Batch seeding with progress tracking

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.x |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 3.x |
| **Map** | MapLibre GL + React Map GL | 5.x / 8.x |
| **Database** | MongoDB + Mongoose | 9.x |
| **AI/LLM** | Groq (llama-3.3-70b-versatile) | Latest |
| **Embeddings** | Feature-engineered (no API) | N/A |

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** >= 7.x (local or Atlas)
- **Groq API Key** ([Get one free](https://console.groq.com/keys))

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/pulse.git
cd pulse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
MONGODB_URI=mongodb://localhost:27017/pulse
GROQ_API_KEY=your_groq_api_key_here
USE_VECTOR_SEARCH=false
NEXT_PUBLIC_MAP_STYLE=https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json
```

### 4. Configure Atlas Vector Search (Optional but Recommended)

Before seeding the database, you can optionally enable hardware-accelerated similarity search by creating a Vector Search Index in your MongoDB Atlas Dashboard.

1. Go to your Atlas Dashboard → Database → Pulse cluster → **Atlas Search** tab.
2. Click **Create Search Index** → Choose **JSON Editor**.
3. Select the `pulse` database and `events` collection.
4. Name the index `vector_index` and paste the following JSON:

```json
{
  "fields": [
    {
      "numDimensions": 15,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}
```
5. Click **Next** and **Create Search Index**.
6. Set `USE_VECTOR_SEARCH=true` in your `.env` file.

### 5. Seed the Database

Ensure MongoDB is running (or your Atlas connection string is correct), then:

```bash
npm run seed
```

This will:
1. Parse `dataset/dataset.csv` (8,205 events)
2. Cleanse and impute missing data
3. Generate feature embeddings (15 dimensions)
4. Bulk insert into MongoDB

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/pulse` |
| `GROQ_API_KEY` | Yes | Groq API key for LLM inference | — |
| `USE_VECTOR_SEARCH` | No | Enable MongoDB Atlas Vector Search | `false` |
| `NEXT_PUBLIC_MAP_STYLE` | No | MapLibre tile style URL | CARTO Dark Matter |

---

## Data Pipeline

### Preprocessing Mandate

The raw data at `./dataset/dataset.csv` undergoes:

1. **Coordinate Validation**: Filters rows with missing/zero `latitude`/`longitude`
2. **Time to Resolve Calculation**: 
   - Delta between `start_datetime` and `closed_datetime`
   - Fallback: `resolved_datetime` → `modified_datetime`
3. **String Normalization**: `event_type`, `event_cause`, `priority` → lowercase, trimmed
4. **Road Closure Imputation**: `NaN`/`NULL` → `false`

### Vectorization

Feature-engineered 15-dimensional embeddings:
- `[0-1]`: Normalized latitude/longitude (Bengaluru bounding box)
- `[2-11]`: One-hot encoded event cause (10 categories)
- `[12]`: Binary priority encoding
- `[13]`: Binary road closure encoding
- `[14]`: Normalized time-to-resolve

---

## API Reference

### `GET /api/events`

Fetch historical event pins with filtering and pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max events to return (default: 500, max: 5000) |
| `offset` | number | Pagination offset |
| `eventType` | string | Filter: `planned` or `unplanned` |
| `eventCause` | string | Filter by cause (e.g., `accident`, `tree_fall`) |
| `priority` | string | Filter: `high` or `low` |
| `status` | string | Filter: `active`, `resolved`, or `closed` |

**Example:**
```bash
curl http://localhost:3000/api/events?limit=100&priority=high&eventType=unplanned
```

---

### `POST /api/predict-impact`

Core RAG engine endpoint. Analyzes a new event against historical data.

**Request Body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "eventType": "unplanned",
  "eventCause": "accident",
  "priority": "high",
  "requiresRoadClosure": true,
  "description": "Multi-vehicle collision on Ring Road"
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "forecastedDelayHours": 3.5,
    "recommendedManpower": 12,
    "diversionStrategy": "Deploy barricades at Silk Board Junction...",
    "confidenceScore": 0.78,
    "similarEventsCount": 8,
    "riskLevel": "high",
    "estimatedClearanceTime": "3-5 hours",
    "nearbyResources": ["Madiwala", "Koramangala", "BTM Layout"]
  }
}
```

---

## RAG Pipeline

### Retrieval Stage
1. Generate feature embedding for the incoming event
2. Query MongoDB with `$geoNear` aggregation (2km radius)
3. Rank results by cosine similarity of embeddings
4. Return top 15 similar historical events

### Agent Stage
1. Construct system prompt (traffic operations analyst persona)
2. Build user prompt with event details + historical context
3. Call Groq `llama-3.3-70b-versatile` (temperature: 0.3)
4. Parse structured JSON response
5. Fallback: statistical computation if API unavailable

---

## Project Structure

```
pulse/
├── dataset/
│   └── dataset.csv                       # Raw traffic event data (8,205 rows)
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (fonts, metadata)
│   │   ├── page.tsx                      # Dashboard page
│   │   ├── globals.css                   # Design system & tokens
│   │   └── api/
│   │       ├── events/route.ts           # GET /api/events
│   │       └── predict-impact/route.ts   # POST /api/predict-impact
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.tsx       # 70/30 split layout
│   │   │   ├── Header.tsx                # Animated header bar
│   │   │   └── StatsBar.tsx              # Metric cards row
│   │   ├── map/
│   │   │   ├── MapView.tsx               # MapLibre interactive map
│   │   │   └── EventMarker.tsx           # Custom marker component
│   │   └── copilot/
│   │       ├── CopilotPanel.tsx          # AI side panel
│   │       ├── EventForm.tsx             # Event input form
│   │       ├── PredictionCard.tsx        # Metric card
│   │       └── PredictionResult.tsx      # Full prediction display
│   ├── lib/
│   │   ├── db/
│   │   │   ├── connection.ts             # MongoDB singleton
│   │   │   └── models/event.ts           # Mongoose schema
│   │   ├── pipeline/
│   │   │   ├── preprocessor.ts           # CSV cleansing
│   │   │   └── vectorizer.ts             # Feature embeddings
│   │   ├── rag/
│   │   │   ├── retriever.ts              # Similarity search
│   │   │   └── agent.ts                  # Groq LLM agent
│   │   └── types/index.ts               # All TypeScript interfaces
│   └── scripts/
│       └── seed.ts                       # Database seed CLI
├── .env.example                          # Environment template
├── next.config.ts                        # Next.js configuration
├── tailwind.config.ts                    # Tailwind configuration
├── tsconfig.json                         # TypeScript config
├── package.json                          # Dependencies
└── README.md                             # This file
```

---

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Notes
- Set `MONGODB_URI` to your MongoDB Atlas cluster for production
- Ensure `GROQ_API_KEY` is set as a secret in your deployment platform
- The map tiles are loaded from CARTO CDN (no API key required)

---

## License

This project is licensed under the Apache-2.0 License. See [LICENSE](./LICENSE) for details.

---

_Built with ❤️ by Sambit Mondal_
