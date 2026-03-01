# DFA Designer — AI Powered

An interactive DFA (Deterministic Finite Automaton) designer.  
Describe a language in plain English → Claude designs the minimal DFA → animate and test it.

---

## Project Structure

```
dfa-designer/
├── server.js                  ← Express backend (proxies Anthropic API)
├── vite.config.js             ← Vite config (dev proxy to backend)
├── index.html                 ← HTML entry point
├── package.json
├── .env                       ← YOU CREATE THIS (see below)
├── .env.example
└── src/
    ├── main.jsx               ← React entry
    ├── App.jsx
    ├── index.css
    ├── constants.js           ← AI prompt + example queries
    ├── services/
    │   └── api.js             ← Calls /api/generate-dfa (local proxy)
    ├── utils/
    │   └── dfaEngine.js       ← Layout engine + DFA simulator
    └── components/
        ├── DFADesigner.jsx    ← Main page component
        ├── DFACanvas.jsx      ← SVG diagram with animated highlighting
        ├── Simulator.jsx      ← Step/run controls + path trace
        ├── TransitionTable.jsx
        └── TestCases.jsx
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Add your Anthropic API key
```bash
cp .env.example .env
```
Open `.env` and set:
```
ANTHROPIC_API_KEY=sk-ant-...your key here...
```
Get a key at https://console.anthropic.com

### 3. Run in development mode
```bash
npm run dev
```
This starts:
- **Vite** on http://localhost:5173 (frontend)
- **Express** on http://localhost:3001 (API proxy)

Open http://localhost:5173 in your browser.

### 4. (Optional) Build for production
```bash
npm start
```
Builds the frontend into `dist/` then serves everything from Express on port 3001.

---

## How it works

- The **frontend** sends your language description to `/api/generate-dfa`
- The **Express server** forwards it to Anthropic's API with your key (no CORS issues)
- Claude returns a JSON DFA spec
- The **DFA canvas** renders states and transitions as an SVG
- The **simulator** lets you type a string and watch it animate step by step through the DFA

---

## Example queries to try

- strings over {0,1} that begin or end with 01
- binary strings with even number of 1s
- strings over {a,b} not containing 'aa'
- binary strings whose value is divisible by 3
- strings over {0,1} containing '101' as a substring
- strings over {a,b} where every 'a' is immediately followed by 'b'
