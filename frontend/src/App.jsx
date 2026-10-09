import { useEffect, useState } from "react";
import { Activity, ArrowLeftRight, Loader2, Sparkles, Trophy } from "lucide-react";

const SURFACES = ["Hard", "Clay", "Grass"];
const API_URL = import.meta.env.VITE_API_URL || "/api";

export default function App() {
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [court, setCourt] = useState("Clay");
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const queries = [...new Set([player1, player2]
      .map((name) => name.trim())
      .filter((name) => name.length >= 2))];
    if (!queries.length) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const responses = await Promise.all(queries.map((query) =>
          fetch(`${API_URL}/players?query=${encodeURIComponent(query)}`)
        ));
        const payloads = await Promise.all(responses.map((response) =>
          response.ok ? response.json() : { players: [] }
        ));
        setSuggestions([...new Set(payloads.flatMap((payload) => payload.players || []))].slice(0, 12));
      } catch {
        // The form gives the helpful error if the backend is not running.
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [player1, player2]);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!player1 || !player2 || !court) return;

    setIsLoading(true);
    setError("");
    setPrediction(null);

    try {
      // Send the data to your Python FastAPI backend
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_a: player1,
          player_b: player2,
          surface: court,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || "Players not found or server error.");
      }

      // Receive the prediction back from Python
      const data = await response.json();

      // Update the React UI
      setPrediction({
        winner:
          data.player_a_prob > data.player_b_prob
            ? data.player_a
            : data.player_b,
        probability: Math.max(data.player_a_prob, data.player_b_prob).toFixed(1),
        accuracy: data.accuracy,
        player1Prob: data.player_a_prob.toFixed(1),
        player2Prob: data.player_b_prob.toFixed(1),
      });
    } catch (error) {
      setError(`${error.message} Try a suggested name, such as “Jannik Sinner”.`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const swapPlayers = () => {
    setPlayer1(player2);
    setPlayer2(player1);
    setPrediction(null);
    setError("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-[-8rem] h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-96 w-96 rounded-full bg-lime-400/10 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-12">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs tracking-widest text-emerald-200 uppercase backdrop-blur">
            <Sparkles size={14} />
            Elo + Logistic Model
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Tennis Match Predictor
          </h1>
          <p className="mt-3 text-sm text-emerald-100/70">
            Start typing to see players in the ATP data set.
          </p>
        </div>

        <form
          onSubmit={handlePredict}
          className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs tracking-wide text-emerald-100/80 uppercase">
                Player 1
              </span>
              <input
                list="player-suggestions"
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                placeholder="Jannik Sinner"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-emerald-400/40 placeholder:text-white/30 focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs tracking-wide text-emerald-100/80 uppercase">
                Player 2
              </span>
              <input
                list="player-suggestions"
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                placeholder="Carlos Alcaraz"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-emerald-400/40 placeholder:text-white/30 focus:ring-2"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={swapPlayers}
            aria-label="Swap players"
            className="mx-auto mt-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/20 text-emerald-100 transition hover:bg-white/10"
          >
            <ArrowLeftRight size={16} />
          </button>
          <datalist id="player-suggestions">
            {suggestions.map((name) => <option value={name} key={name} />)}
          </datalist>

          <div className="mt-5">
            <span className="mb-2 block text-xs tracking-wide text-emerald-100/80 uppercase">
              Surface
            </span>
            <div className="flex gap-2">
              {SURFACES.map((surface) => (
                <button
                  type="button"
                  key={surface}
                  onClick={() => setCourt(surface)}
                  className={`flex-1 rounded-2xl border px-3 py-2 text-sm transition ${
                    court === surface
                      ? "border-emerald-300/60 bg-emerald-400/20 text-white"
                      : "border-white/10 bg-black/20 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {surface}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-4 py-3 font-semibold text-emerald-950 shadow-lg disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Calculating...
              </>
            ) : (
              <>
                <Activity size={18} />
                Predict
              </>
            )}
          </button>
          {error && (
            <p className="mt-4 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </p>
          )}
        </form>

        {prediction && (
          <section className="mt-6 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2 text-emerald-200">
              <Trophy size={18} />
              <span className="text-sm tracking-wide uppercase">
                Model output
              </span>
            </div>
            <p className="text-2xl font-semibold">
              {prediction.winner}{" "}
              <span className="text-lime-300">{prediction.probability}%</span>
            </p>
            <div className="mt-5 space-y-3">
              <ProbBar
                label={player1}
                value={prediction.player1Prob}
                accent="from-emerald-400 to-lime-300"
              />
              <ProbBar
                label={player2}
                value={prediction.player2Prob}
                accent="from-teal-300 to-cyan-200"
              />
            </div>
            <p className="mt-4 text-xs text-white/50">
              Baseline test accuracy: {prediction.accuracy}%
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function ProbBar({ label, value, accent }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/40">
        <div
          className={`h-full bg-gradient-to-r ${accent}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
