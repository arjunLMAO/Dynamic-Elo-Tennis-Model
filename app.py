# app.py
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

BASE_DIRECTORY = Path(__file__).resolve().parent

app = FastAPI(title="Tennis Match Predictor API")

# Allow React to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the saved model and data into memory
model = joblib.load(BASE_DIRECTORY / "tennis_model.pkl")
data = joblib.load(BASE_DIRECTORY / "tennis_data.pkl")

# Extract dictionaries
name_to_id = data['name_to_id']
overall_elo = data['overall_elo']
surface_elos = data['surface_elos']
last10_overall = data['last10_overall']
last10_hard = data['last10_hard']
last10_clay = data['last10_clay']
last10_grass = data['last10_grass']
h2h_wins = data['h2h_wins']
feature_columns = data['feature_columns']
latest_matches = data['latest_matches']
player_names = sorted(name_to_id.keys())

class MatchRequest(BaseModel):
    player_a: str
    player_b: str
    surface: str

def normalize_surface(s):
    s = str(s).strip().lower()
    if "hard" in s: return "Hard"
    if "clay" in s: return "Clay"
    if "grass" in s: return "Grass"
    return "Other"

def blended_surface_elo(surface_elo, overall_elo, alpha=0.75):
    return alpha * surface_elo + (1 - alpha) * overall_elo


@app.get("/health")
def health_check():
    return {"status": "ok", "players_loaded": len(player_names)}


@app.get("/players")
def search_players(query: str = Query(default="", min_length=0), limit: int = Query(default=8, ge=1, le=20)):
    """Return matching names for the frontend's autocomplete inputs."""
    normalized_query = query.strip().lower()
    matches = [name for name in player_names if normalized_query in name][:limit]
    return {"players": [name.title() for name in matches]}

@app.post("/predict")
def predict_api(request: MatchRequest):
    p_a_name = request.player_a.strip().lower()
    p_b_name = request.player_b.strip().lower()

    if p_a_name not in name_to_id or p_b_name not in name_to_id:
        raise HTTPException(status_code=404, detail="Player not found in database")
    if p_a_name == p_b_name:
        raise HTTPException(status_code=400, detail="Choose two different players")

    player_a_id = name_to_id[p_a_name]
    player_b_id = name_to_id[p_b_name]
    surface = normalize_surface(request.surface)

    # --- Fetch Ranks (using your exact logic) ---
    rank_a, rank_b = 999, 999
    
    a_rows = latest_matches[(latest_matches["winner_id"] == player_a_id) | (latest_matches["loser_id"] == player_a_id)]
    if len(a_rows) > 0:
        last = a_rows.iloc[-1]
        rank_a = last["winner_rank"] if last["winner_id"] == player_a_id else last["loser_rank"]

    b_rows = latest_matches[(latest_matches["winner_id"] == player_b_id) | (latest_matches["loser_id"] == player_b_id)]
    if len(b_rows) > 0:
        last = b_rows.iloc[-1]
        rank_b = last["winner_rank"] if last["winner_id"] == player_b_id else last["loser_rank"]

    # --- Feature Engineering (using your exact logic) ---
    a_overall = overall_elo.get(player_a_id, 1500.0)
    b_overall = overall_elo.get(player_b_id, 1500.0)
    a_surface_raw = surface_elos.get(surface, {}).get(player_a_id, 1500.0)
    b_surface_raw = surface_elos.get(surface, {}).get(player_b_id, 1500.0)

    a_blended = blended_surface_elo(a_surface_raw, a_overall)
    b_blended = blended_surface_elo(b_surface_raw, b_overall)

    a_vs_b = h2h_wins.get((player_a_id, player_b_id), 0)
    b_vs_a = h2h_wins.get((player_b_id, player_a_id), 0)

    row = {
        "elo_diff": a_overall - b_overall,
        "blended_surface_elo_diff": a_blended - b_blended,
        "rank_diff": float(rank_b) - float(rank_a),
        "last10_overall_diff": sum(last10_overall.get(player_a_id, [0])) - sum(last10_overall.get(player_b_id, [0])),
        "last10_hard_diff": sum(last10_hard.get(player_a_id, [0])) - sum(last10_hard.get(player_b_id, [0])),
        "last10_clay_diff": sum(last10_clay.get(player_a_id, [0])) - sum(last10_clay.get(player_b_id, [0])),
        "last10_grass_diff": sum(last10_grass.get(player_a_id, [0])) - sum(last10_grass.get(player_b_id, [0])),
        "h2h_diff": a_vs_b - b_vs_a,
        "surface_Hard": 0, "surface_Clay": 0, "surface_Grass": 0, "surface_Other": 0
    }

    col_name = f"surface_{surface}"
    if col_name in row:
        row[col_name] = 1

    match_df = pd.DataFrame([row]).reindex(columns=feature_columns, fill_value=0)

    # --- Predict ---
    p_a = model.predict_proba(match_df)[0][1]
    
    return {
        "player_a": request.player_a,
        "player_b": request.player_b,
        "player_a_prob": float(p_a * 100),
        "player_b_prob": float((1 - p_a) * 100),
        "accuracy": 69.4 # Your baseline test accuracy from the notebook
    }
