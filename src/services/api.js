// src/services/api.js
<<<<<<< HEAD
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

async function apiCall(endpoint, data) {
  const resp = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
=======
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

async function apiCall(endpoint, data) {
  const resp = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const err = await resp.json();
<<<<<<< HEAD
    throw new Error(err.detail || "API request failed");
=======
    throw new Error(err.detail || 'API request failed');
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
  }
  return resp.json();
}

<<<<<<< HEAD
export async function predictMatch(homeTeam, awayTeam, league = "Premier League") {
  return apiCall("/predict/match", { home_team: homeTeam, away_team: awayTeam, league });
}

export async function analyzePlayer(playerName, league = "Premier League") {
  return apiCall("/analyze/player", { player_name: playerName, league });
}

export async function estimateValue(playerData) {
  return apiCall("/estimate/value", playerData);
}

export async function getTeams(league = "Premier League") {
  const resp = await fetch(`${API_BASE}/teams/${encodeURIComponent(league)}`);
=======
export async function predictMatch(homeTeam, awayTeam, league = 'Premier League') {
  return apiCall('/predict/match', { home_team: homeTeam, away_team: awayTeam, league });
}

export async function analyzePlayer(playerName, league = 'Premier League') {
  return apiCall('/analyze/player', { player_name: playerName, league });
}

export async function estimateValue(playerData) {
  return apiCall('/estimate/value', playerData);
}

export async function getTeams(league = 'Premier League') {
  const resp = await fetchWithTimeout(`${API_BASE}/teams/${encodeURIComponent(league)}`);
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
  return resp.json();
}

export async function getAllPlayersStats(league = null) {
  const url = league
    ? `${API_BASE}/players-stats/all?league=${encodeURIComponent(league)}`
    : `${API_BASE}/players-stats/all`;
<<<<<<< HEAD
  const resp = await fetch(url);
=======
  const resp = await fetchWithTimeout(url);
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
  return resp.json();
}

export async function checkBackend() {
  try {
<<<<<<< HEAD
    const resp = await fetch(`${API_BASE}/health`);
=======
    const resp = await fetchWithTimeout(`${API_BASE}/health`, {}, 8000);
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
    return resp.ok;
  } catch {
    return false;
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
