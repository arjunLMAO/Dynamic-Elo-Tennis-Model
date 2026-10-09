# Tennis Match Predictor

A React interface and FastAPI backend for the saved tennis prediction model.

## First-time setup

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
cd frontend
npm install
```

## Run locally

In one terminal, start the model API:

```bash
cd /Users/arjungirdhar_/Desktop/brah
.venv/bin/uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal, start the website:

```bash
cd /Users/arjungirdhar_/Desktop/brah/frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://localhost:5173` in a browser.

The web app offers player-name suggestions from the model data, lets the user select Hard, Clay, or Grass, and displays both win probabilities after a prediction.
