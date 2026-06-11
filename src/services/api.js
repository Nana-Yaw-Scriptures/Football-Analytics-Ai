// src/services/api.js
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

async function apiCall(endpoint, data) {
  const resp = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    let detail = `API request failed (${resp.status})`;
    try { const err = await resp.json(); if (err && err.detail) detail = err.detail; } catch (_) { /* error body was not JSON */ }
    throw new Error(detail);
  }
  return resp.json();
}

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
  return resp.json();
}

export async function getAllPlayersStats(league = null) {
  const url = league
    ? `${API_BASE}/players-stats/all?league=${encodeURIComponent(league)}`
    : `${API_BASE}/players-stats/all`;
  const resp = await fetchWithTimeout(url);
  return resp.json();
}

export async function checkBackend() {
  try {
    const resp = await fetchWithTimeout(`${API_BASE}/health`, {}, 8000);
    return resp.ok;
  } catch {
    return false;
  }
}