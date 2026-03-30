import { supabase } from '../supabaseClient';

/* ── Save a prediction for the current user ── */
export async function savePrediction(prediction, userId) {
  if (!userId) return null;

  const hw = prediction.home_win || prediction.homeWinProb || 0;
  const dr = prediction.draw    || prediction.drawProb    || 0;
  const aw = prediction.away_win|| prediction.awayWinProb || 0;

  let predictedResult = 'H';
  if (dr >= hw && dr >= aw) predictedResult = 'D';
  else if (aw >= hw && aw >= dr) predictedResult = 'A';

  const { data, error } = await supabase.from('predictions').insert({
    user_id:          userId,
    home_team:        prediction.homeTeam || prediction.home_team || '',
    away_team:        prediction.awayTeam || prediction.away_team || '',
    league:           prediction.league  || '',
    home_win_prob:    Math.round(hw * 1000) / 1000,
    draw_prob:        Math.round(dr * 1000) / 1000,
    away_win_prob:    Math.round(aw * 1000) / 1000,
    predicted_result: predictedResult,
    predicted_outcome:prediction.predicted_outcome || prediction.predictedOutcome || '',
    predicted_score:  prediction.predicted_score  || prediction.predictedScore  || '',
    confidence:       Math.round(Math.max(hw, dr, aw) * 1000) / 1000,
    fixture_id:       prediction.fixtureId  || null,
    match_date:       prediction.matchDate  || null,
    resolved:         false,
    source:           'analysis',
  }).select().single();

  if (error) { console.error('[Supabase] Save prediction error:', error); return null; }
  return data;
}

/* ── Get prediction history for current user ── */
export async function getPredictions(userId, league = null) {
  if (!userId) return [];

  let query = supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (league) query = query.eq('league', league);

  const { data, error } = await query;
  if (error) { console.error('[Supabase] Get predictions error:', error); return []; }
  return (data || []).map(normalizeRow);
}

/* ── Delete a prediction ── */
export async function deletePrediction(id, userId) {
  if (!userId) return false;
  const { error } = await supabase.from('predictions').delete()
    .eq('id', id).eq('user_id', userId);
  if (error) { console.error('[Supabase] Delete error:', error); return false; }
  return true;
}

/* ── Clear all predictions for user ── */
export async function clearPredictions(userId) {
  if (!userId) return false;
  const { error } = await supabase.from('predictions').delete().eq('user_id', userId);
  if (error) { console.error('[Supabase] Clear error:', error); return false; }
  return true;
}

/* ── Resolve predictions against actual results ── */
export async function resolveUserPredictions(userId, resolveViaBackend) {
  if (!userId) return { resolved: 0 };
  // Delegate to backend which has API-Football access
  try {
    const result = await resolveViaBackend();
    return result;
  } catch (e) {
    console.error('[Supabase] Resolve error:', e);
    return { resolved: 0 };
  }
}

/* ── Player Favourites ── */
export async function getFavourites(userId) {
  if (!userId) return [];
  const { data, error } = await supabase.from('player_favourites')
    .select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error('[Supabase] Get favourites error:', error); return []; }
  return data || [];
}

export async function addFavourite(userId, player) {
  if (!userId) return false;
  const { error } = await supabase.from('player_favourites').upsert({
    user_id:     userId,
    player_id:   String(player.id || player.player_id || player.name),
    player_name: player.name || player.player_name || '',
    team:        player.team || '',
    league:      player.league || '',
    position:    player.position || '',
    photo:       player.photo || '',
  }, { onConflict: 'user_id,player_id' });
  if (error) { console.error('[Supabase] Add favourite error:', error); return false; }
  return true;
}

export async function removeFavourite(userId, playerId) {
  if (!userId) return false;
  const { error } = await supabase.from('player_favourites')
    .delete().eq('user_id', userId).eq('player_id', String(playerId));
  if (error) { console.error('[Supabase] Remove favourite error:', error); return false; }
  return true;
}

export async function isFavourite(userId, playerId) {
  if (!userId) return false;
  const { data } = await supabase.from('player_favourites')
    .select('id').eq('user_id', userId).eq('player_id', String(playerId)).single();
  return !!data;
}

/* ── Normalise Supabase snake_case → camelCase for the frontend ── */
function normalizeRow(p) {
  return {
    id:               p.id,
    timestamp:        p.created_at,
    homeTeam:         p.home_team,
    awayTeam:         p.away_team,
    league:           p.league,
    homeWinProb:      p.home_win_prob,
    drawProb:         p.draw_prob,
    awayWinProb:      p.away_win_prob,
    predictedResult:  p.predicted_result,
    predictedOutcome: p.predicted_outcome,
    predictedScore:   p.predicted_score,
    confidence:       p.confidence,
    actualResult:     p.actual_result,
    actualScore:      p.actual_score,
    correct:          p.correct,
    scoreCorrect:     p.score_correct,
    resolved:         p.resolved,
    fixtureId:        p.fixture_id,
    matchDate:        p.match_date,
  };
}

/* ── Resolve predictions via backend + update Supabase ── */
export async function resolvePredictions(userId, apiBase) {
  if (!userId) return { resolved: 0 };

  // Get unresolved predictions from Supabase
  const { data: unresolved, error } = await supabase
    .from('predictions')
    .select('id, home_team, away_team, league, fixture_id, match_date, predicted_result, predicted_score')
    .eq('user_id', userId)
    .eq('resolved', false);

  if (error || !unresolved?.length) return { resolved: 0 };

  // Send to backend for resolution
  const resp = await fetch(`${apiBase}/predictions/resolve-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unresolved.map(p => ({
      id:               p.id,
      homeTeam:         p.home_team,
      awayTeam:         p.away_team,
      league:           p.league,
      fixtureId:        p.fixture_id,
      matchDate:        p.match_date,
      predictedResult:  p.predicted_result,
      predictedScore:   p.predicted_score,
    }))),
  });

  if (!resp.ok) return { resolved: 0 };
  const results = await resp.json();

  // Update resolved predictions in Supabase
  let resolvedCount = 0;
  for (const r of results) {
    if (!r.id) continue;
    const { error: upErr } = await supabase.from('predictions').update({
      actual_result:  r.actualResult,
      actual_score:   r.actualScore,
      correct:        r.correct,
      score_correct:  r.scoreCorrect,
      resolved:       true,
    }).eq('id', r.id).eq('user_id', userId);
    if (!upErr) resolvedCount++;
  }

  return { resolved: resolvedCount, total: unresolved.length };
}