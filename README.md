# NetSage AI

A network topology troubleshooting app for diagnosing node issues, reviewing device configs, and exporting syslog / prompt log snapshots.

## Prerequisites

- Node.js 18+ recommended
- Python 3.10+
- A Gemini API key

## Setup

1. Open a terminal in the project folder.
2. Install the frontend/server dependencies:
   ```bash
   npm install
   ```
3. Create a local environment file:
   ```bash
   copy .env.example .env
   ```
   If `.env.example` is not present, create a `.env` file manually and add:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. Make sure Python is available:
   ```bash
   python --version
   ```

## Run the app

Start the development server:

```bash
npm run dev
```

Then open the app in your browser at:

```text
http://localhost:3000
```

## Useful commands

- Build the app:
  ```bash
  npm run build
  ```
- Run the app in production mode after building:
  ```bash
  npm run start
  ```
- Type-check the project:
  ```bash
  npm run lint
  ```

## Notes

- The app uses a Node/Express backend and a Python rule-checker in `checker/rule_checker.py`.
- The Python checker uses the standard library only, so no extra Python packages are required.
- If the Gemini key is missing, the app will prompt for one in the UI before diagnostics run.
