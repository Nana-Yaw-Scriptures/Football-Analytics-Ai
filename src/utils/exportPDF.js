import jsPDF from 'jspdf';

const COLORS = {
  bg: [10, 14, 26],
  card: [17, 24, 39],
  card2: [12, 18, 34],
  cyan: [34, 211, 238],
  purple: [168, 85, 247],
  emerald: [16, 185, 129],
  red: [239, 68, 68],
  yellow: [245, 158, 11],
  white: [255, 255, 255],
  slate300: [203, 213, 225],
  slate400: [148, 163, 184],
  slate500: [100, 116, 139],
  slate600: [71, 85, 105],
  slate700: [51, 65, 85],
  blue: [59, 130, 246],
  orange: [249, 115, 22],
};

function initPDF(title, subtitle) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const w = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, w, 297, 'F');

  doc.setFillColor(...COLORS.card);
  doc.rect(0, 0, w, 32, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.cyan);
  doc.text('Scorina AI', 15, 14);

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slate500);
  doc.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), w - 15, 14, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate400);
  doc.text(subtitle || '', 15, 22);

  doc.setFontSize(20);
  doc.setTextColor(...COLORS.white);
  doc.text(title, 15, 48);

  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(0.8);
  doc.line(15, 52, 80, 52);

  return { doc, w, y: 60 };
}

function addFooter(doc) {
  const w = doc.internal.pageSize.getWidth();
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...COLORS.card);
    doc.rect(0, 285, w, 12, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.slate600);
    doc.text('Scorina AI — scorinai.com', 15, 291);
    doc.text(`Page ${i} of ${pages}`, w - 15, 291, { align: 'right' });
  }
}

function checkPage(doc, y, needed = 30) {
  if (y + needed > 275) {
    doc.addPage();
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(...COLORS.bg);
    doc.rect(0, 0, w, 297, 'F');
    return 15;
  }
  return y;
}

function sectionHeader(doc, y, title, color = COLORS.cyan) {
  const w = doc.internal.pageSize.getWidth();
  y = checkPage(doc, y, 15);
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(15, y, 3, 8, 'F');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 22, y + 6);
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.2);
  doc.line(22, y + 9, w - 15, y + 9);
  return y + 15;
}

function statRow(doc, y, label, value, color = COLORS.white) {
  y = checkPage(doc, y, 8);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate400);
  doc.setFont('helvetica', 'normal');
  doc.text(label, 22, y);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(String(value), 90, y, { align: 'right' });
  return y + 6;
}

function probBar(doc, y, hw, dr, aw) {
  y = checkPage(doc, y, 15);
  const barW = 120;
  const barH = 5;
  const x = 22;

  doc.setFillColor(...COLORS.cyan);
  doc.rect(x, y, barW * hw, barH, 'F');
  doc.setFillColor(...COLORS.slate500);
  doc.rect(x + barW * hw, y, barW * dr, barH, 'F');
  doc.setFillColor(...COLORS.purple);
  doc.rect(x + barW * (hw + dr), y, barW * aw, barH, 'F');

  doc.setFontSize(7);
  y += barH + 5;
  doc.setTextColor(...COLORS.cyan);
  doc.text(`Home ${(hw * 100).toFixed(0)}%`, x, y);
  doc.setTextColor(...COLORS.slate500);
  doc.text(`Draw ${(dr * 100).toFixed(0)}%`, x + barW * 0.4, y);
  doc.setTextColor(...COLORS.purple);
  doc.text(`Away ${(aw * 100).toFixed(0)}%`, x + barW * 0.75, y);

  return y + 8;
}

function miniBar(doc, y, label, value, maxVal, color) {
  y = checkPage(doc, y, 8);
  const barW = 80;
  const pct = Math.min(value / (maxVal || 1), 1);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slate400);
  doc.setFont('helvetica', 'normal');
  doc.text(label, 22, y);
  // Track
  doc.setFillColor(...COLORS.card);
  doc.rect(75, y - 3.5, barW, 4, 'F');
  // Fill
  doc.setFillColor(...color);
  doc.rect(75, y - 3.5, barW * pct, 4, 'F');
  // Value
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'bold');
  doc.text(String(value), 165, y, { align: 'right' });
  return y + 6;
}

function scoreBox(doc, y, label, score, color, sublabel = '') {
  y = checkPage(doc, y, 20);
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COLORS.card2);
  doc.roundedRect(15, y, w - 30, 18, 2, 2, 'F');
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, y, w - 30, 18, 2, 2, 'S');

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.slate500);
  doc.setFont('helvetica', 'normal');
  doc.text(label.toUpperCase(), 22, y + 5);
  if (sublabel) {
    doc.setTextColor(...COLORS.slate600);
    doc.text(sublabel, 22, y + 9);
  }

  doc.setFontSize(18);
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'bold');
  doc.text(score || '—', w / 2, y + 13, { align: 'center' });

  return y + 22;
}

function formRow(doc, y, teamName, formSeq) {
  y = checkPage(doc, y, 10);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slate400);
  doc.setFont('helvetica', 'normal');
  doc.text((teamName || '').split(' ')[0].substring(0, 12), 22, y);

  (formSeq || []).slice(-5).forEach((r, i) => {
    const color = r === 'W' ? COLORS.emerald : r === 'D' ? COLORS.yellow : COLORS.red;
    doc.setFillColor(...color);
    doc.rect(65 + i * 10, y - 4, 8, 6, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(r, 67 + i * 10, y);
  });

  doc.setFont('helvetica', 'normal');
  return y + 8;
}

function difficultyBar(doc, y, difficulty) {
  y = checkPage(doc, y, 12);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slate400);
  doc.text('Match Difficulty', 22, y);

  for (let i = 0; i < 10; i++) {
    const filled = i < (difficulty || 5);
    const color = (difficulty || 5) >= 8 ? COLORS.red : (difficulty || 5) >= 6 ? COLORS.yellow : COLORS.emerald;
    if (filled) doc.setFillColor(...color);
    else doc.setFillColor(...COLORS.slate700);
    doc.rect(75 + i * 7, y - 4, 5, 5, 'F');
  }

  doc.setTextColor(...COLORS.slate500);
  doc.setFontSize(7);
  const label = (difficulty || 5) >= 9 ? 'Razor-thin' : (difficulty || 5) >= 7 ? 'Highly competitive' : (difficulty || 5) >= 5 ? 'Competitive' : 'One-sided';
  doc.text(label, 148, y);
  return y + 10;
}


// ══════════════════════════════════════════
// EXPORT: Match Prediction Report
// ══════════════════════════════════════════

export function exportMatchPrediction(mlData, h2hData, homeFixtures, awayFixtures, analysisText, scorersData) {
  const home = mlData.home_team_name || 'Home';
  const away = mlData.away_team_name || 'Away';
  const { doc, w, y: startY } = initPDF(`${home} vs ${away}`, 'Match Prediction Report — 2025/26 Season');
  let y = startY;

  // ── Prediction Summary ──
  y = sectionHeader(doc, y, 'Prediction Summary');

  // Confidence level badge
  const confLevel = mlData.confidence_level || 'Medium';
  const confColor = confLevel === 'High' ? COLORS.emerald : confLevel === 'Medium' ? COLORS.yellow : COLORS.red;
  doc.setFillColor(...confColor);
  doc.roundedRect(22, y - 2, 28, 6, 1, 1, 'F');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text(`${confLevel.toUpperCase()} CONFIDENCE`, 36, y + 2.5, { align: 'center' });
  y += 8;

  y = statRow(doc, y, 'Predicted Outcome', mlData.predicted_outcome || '—', COLORS.cyan);
  y = statRow(doc, y, 'Confidence', `${((mlData.confidence || 0) * 100).toFixed(0)}%`, COLORS.emerald);
  y += 4;

  // ── Three Score Boxes ──
  y = sectionHeader(doc, y, 'Score Predictions');

  // Side by side: predicted score + most likely score
  y = checkPage(doc, y, 22);
  const boxW = (w - 38) / 2;

  // Predicted Score (outcome-aligned)
  doc.setFillColor(...COLORS.card2);
  doc.roundedRect(15, y, boxW, 20, 2, 2, 'F');
  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, y, boxW, 20, 2, 2, 'S');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('PREDICTED SCORE', 15 + boxW / 2, y + 5, { align: 'center' });
  doc.setTextColor(...COLORS.slate600);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Aligned with outcome', 15 + boxW / 2, y + 9, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text(mlData.predicted_score || '—', 15 + boxW / 2, y + 17, { align: 'center' });

  // Most Likely Score (raw Poisson)
  const box2X = 15 + boxW + 8;
  doc.setFillColor(...COLORS.card2);
  doc.roundedRect(box2X, y, boxW, 20, 2, 2, 'F');
  doc.setDrawColor(...COLORS.yellow);
  doc.setLineWidth(0.3);
  doc.roundedRect(box2X, y, boxW, 20, 2, 2, 'S');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.yellow);
  doc.setFont('helvetica', 'bold');
  doc.text('MOST LIKELY SCORE', box2X + boxW / 2, y + 5, { align: 'center' });
  doc.setTextColor(...COLORS.slate600);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Raw Poisson prediction', box2X + boxW / 2, y + 9, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text(mlData.most_likely_score || mlData.top_scorelines?.[0]?.score || '—', box2X + boxW / 2, y + 17, { align: 'center' });

  y += 24;

  // Top scorelines grid
  if (mlData.top_scorelines && mlData.top_scorelines.length > 0) {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.slate500);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP SCORELINES', 22, y);
    y += 5;
    mlData.top_scorelines.slice(0, 6).forEach((s, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const sx = 22 + col * 55;
      const sy = y + row * 8;
      const isTop = i === 0;
      if (isTop) doc.setFillColor(...COLORS.cyan);
      else doc.setFillColor(...COLORS.card);
      doc.roundedRect(sx, sy - 3, 48, 6, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(isTop ? COLORS.bg[0] : COLORS.white[0], isTop ? COLORS.bg[1] : COLORS.white[1], isTop ? COLORS.bg[2] : COLORS.white[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(s.score, sx + 14, sy + 0.5);
      doc.setTextColor(isTop ? COLORS.bg[0] : COLORS.slate500[0], isTop ? COLORS.bg[1] : COLORS.slate500[1], isTop ? COLORS.bg[2] : COLORS.slate500[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(`${s.probability}%`, sx + 35, sy + 0.5);
    });
    y += 20;
  }

  // ── Win Probabilities ──
  y = sectionHeader(doc, y, 'Win Probabilities');
  y = probBar(doc, y, mlData.home_win || 0.33, mlData.draw || 0.33, mlData.away_win || 0.33);

  // ── Match Stats ──
  y = sectionHeader(doc, y, 'Match Statistics');

  // xG comparison
  const hXg = mlData.home_expected_goals || 0;
  const aXg = mlData.away_expected_goals || 0;
  const totalXg = hXg + aXg || 1;

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slate400);
  doc.text('Expected Goals (xG)', 22, y);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.cyan);
  doc.text(hXg.toFixed(2), 22, y + 6);
  doc.setTextColor(...COLORS.slate500);
  doc.text('vs', 90, y + 6, { align: 'center' });
  doc.setTextColor(...COLORS.purple);
  doc.text(aXg.toFixed(2), 158, y + 6, { align: 'right' });

  const xgBarX = 32;
  const xgBarW = 120;
  doc.setFillColor(...COLORS.cyan);
  doc.rect(xgBarX, y + 8, xgBarW * (hXg / totalXg), 3, 'F');
  doc.setFillColor(...COLORS.purple);
  doc.rect(xgBarX + xgBarW * (hXg / totalXg), y + 8, xgBarW * (aXg / totalXg), 3, 'F');
  y += 16;

  // Difficulty
  y = difficultyBar(doc, y, mlData.match_difficulty);

  // ── Form Momentum ──
  y = sectionHeader(doc, y, 'Form Momentum');

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.slate500);
  doc.text(`${home.split(' ')[0]} (last 5)`, 22, y);
  y += 5;
  y = formRow(doc, y, home, mlData.home_form_sequence);
  y += 2;
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.slate500);
  doc.text(`${away.split(' ')[0]} (last 5)`, 22, y);
  y += 5;
  y = formRow(doc, y, away, mlData.away_form_sequence);
  y += 2;

  // Recent fixtures
  const hFixes = homeFixtures?.fixtures?.slice(0, 4) || [];
  const aFixes = awayFixtures?.fixtures?.slice(0, 4) || [];

  if (hFixes.length > 0 || aFixes.length > 0) {
    y = checkPage(doc, y, 30);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.slate500);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Results', 22, y);
    y += 5;

    const maxRows = Math.max(hFixes.length, aFixes.length);
    for (let i = 0; i < maxRows; i++) {
      y = checkPage(doc, y, 6);
      const m = hFixes[i];
      const am = aFixes[i];

      if (m) {
        const rc = m.result === 'W' ? COLORS.emerald : m.result === 'D' ? COLORS.yellow : COLORS.red;
        doc.setFillColor(...rc);
        doc.rect(22, y - 3.5, 5, 5, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.text(m.result, 23.5, y);
        doc.setTextColor(...COLORS.slate400);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`${m.venue === 'Home' ? 'vs' : '@'} ${(m.opponent || '').replace(' FC', '').substring(0, 14)}`, 30, y);
        doc.setTextColor(...COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.text(`${m.homeGoals}-${m.awayGoals}`, 68, y);
      }

      if (am) {
        const rc = am.result === 'W' ? COLORS.emerald : am.result === 'D' ? COLORS.yellow : COLORS.red;
        doc.setFillColor(...rc);
        doc.rect(w / 2 + 5, y - 3.5, 5, 5, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.text(am.result, w / 2 + 6.5, y);
        doc.setTextColor(...COLORS.slate400);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`${am.venue === 'Home' ? 'vs' : '@'} ${(am.opponent || '').replace(' FC', '').substring(0, 14)}`, w / 2 + 13, y);
        doc.setTextColor(...COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.text(`${am.homeGoals}-${am.awayGoals}`, w / 2 + 51, y);
      }
      y += 6;
    }
  }

  // ── Tactical DNA ──
  y = sectionHeader(doc, y, 'Tactical DNA Fingerprint', COLORS.purple);

  const dnaMetrics = (side) => {
    const xg    = side === 'home' ? (mlData.home_expected_goals || 0) : (mlData.away_expected_goals || 0);
    const oppXg = side === 'home' ? (mlData.away_expected_goals || 0) : (mlData.home_expected_goals || 0);
    const wp    = side === 'home' ? (mlData.home_win || 0.33) : (mlData.away_win || 0.33);
    const form  = side === 'home' ? (mlData.home_form_sequence || []) : (mlData.away_form_sequence || []);
    const pts   = form.reduce((s, r, i) => s + (r==='W'?3:r==='D'?1:0)*Math.pow(0.85, form.length-1-i), 0);
    const max   = form.reduce((s,_,i) => s+3*Math.pow(0.85,form.length-1-i), 0);
    const fs    = max > 0 ? (pts/max)*100 : 50;
    return [
      { l: 'Attack',    v: Math.min(100, Math.max(10, Math.round(xg * 38))),                                      c: COLORS.red },
      { l: 'Press',     v: Math.min(100, Math.max(10, Math.round((3.5 - oppXg) / 3.5 * 100))),                    c: COLORS.orange },
      { l: 'Tempo',     v: Math.min(100, Math.max(15, Math.round(fs > 0 ? fs : (wp * 80)))),                      c: COLORS.yellow },
      { l: 'Defend',    v: Math.min(100, Math.max(10, Math.round((2.8 - oppXg) / 2.8 * 100))),                    c: COLORS.emerald },
      { l: 'Vertical',  v: Math.min(100, Math.max(20, Math.round(xg * 35))),                                      c: COLORS.cyan },
      { l: 'Dominance', v: Math.min(100, Math.max(10, Math.round(wp * 130))),                                     c: COLORS.purple },
    ];
  };

  const homeDNA = dnaMetrics('home');
  const awayDNA = dnaMetrics('away');

  // Home DNA
  y = checkPage(doc, y, 50);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text(home.split(' ').slice(0,2).join(' '), 22, y);
  doc.setTextColor(...COLORS.slate600);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(homeDNA.map(m => `${m.v}-${m.l.substring(0,3).toUpperCase()}`).join(' / '), 22, y + 4);
  y += 8;
  homeDNA.forEach(m => { y = miniBar(doc, y, m.l, m.v, 100, m.c); });
  y += 3;

  // Away DNA
  y = checkPage(doc, y, 50);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.purple);
  doc.setFont('helvetica', 'bold');
  doc.text(away.split(' ').slice(0,2).join(' '), 22, y);
  doc.setTextColor(...COLORS.slate600);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(awayDNA.map(m => `${m.v}-${m.l.substring(0,3).toUpperCase()}`).join(' / '), 22, y + 4);
  y += 8;
  awayDNA.forEach(m => { y = miniBar(doc, y, m.l, m.v, 100, m.c); });
  y += 3;

  // ── Likely Goalscorers ──
  if (scorersData && (scorersData.home?.length > 0 || scorersData.away?.length > 0)) {
    y = sectionHeader(doc, y, 'Likely Goalscorers', COLORS.emerald);

    const allScorers = [
      ...(scorersData.home || []).map(p => ({ ...p, side: 'Home', sideColor: COLORS.cyan })),
      ...(scorersData.away || []).map(p => ({ ...p, side: 'Away', sideColor: COLORS.purple })),
    ];

    // Header
    y = checkPage(doc, y, 8);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.slate500);
    doc.setFont('helvetica', 'bold');
    doc.text('Player', 22, y);
    doc.text('Team', 85, y);
    doc.text('Side', 120, y);
    doc.text('Score Prob', 145, y);
    y += 5;

    allScorers.forEach(p => {
      y = checkPage(doc, y, 7);
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.white);
      doc.setFont('helvetica', 'bold');
      doc.text((p.name || '').substring(0, 22), 22, y);
      doc.setTextColor(...COLORS.slate400);
      doc.setFont('helvetica', 'normal');
      doc.text((p.team || '').replace(' FC','').substring(0, 18), 85, y);
      doc.setTextColor(...p.sideColor);
      doc.text(p.side, 120, y);

      // Probability bar
      const bW = 30;
      const bX = 140;
      doc.setFillColor(...COLORS.slate700);
      doc.rect(bX, y - 3.5, bW, 3.5, 'F');
      doc.setFillColor(...p.sideColor);
      doc.rect(bX, y - 3.5, bW * ((p.scoreProbability || 0) / 100), 3.5, 'F');
      doc.setTextColor(...p.sideColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`${p.scoreProbability || 0}%`, 175, y, { align: 'right' });

      y += 6;
    });
    y += 3;
  }

  // ── Match Verdict ──
  y = sectionHeader(doc, y, 'Match Verdict', COLORS.yellow);
  y = checkPage(doc, y, 25);

  doc.setFillColor(...COLORS.card2);
  doc.roundedRect(15, y, w - 30, 22, 2, 2, 'F');
  doc.setDrawColor(...COLORS.yellow);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, y, w - 30, 22, 2, 2, 'S');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text(mlData.predicted_outcome || '—', 22, y + 7);

  const hXg2 = mlData.home_expected_goals || 0;
  const aXg2 = mlData.away_expected_goals || 0;
  const diff2 = Math.abs(hXg2 - aXg2);
  const winner2 = hXg2 > aXg2 ? home.split(' ')[0] : away.split(' ')[0];
  const loser2  = hXg2 > aXg2 ? away.split(' ')[0] : home.split(' ')[0];
  const verdictText = diff2 > 1.2
    ? `${winner2} should dominate — significant xG gap over ${loser2}.`
    : diff2 > 0.6
    ? `${winner2} hold a clear advantage but ${loser2} can cause problems.`
    : diff2 > 0.3
    ? `Narrow edge to ${winner2} — expect a competitive match.`
    : 'Too close to call — either side could win this one.';

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slate300);
  doc.setFont('helvetica', 'normal');
  const vLines = doc.splitTextToSize(verdictText, w - 44);
  vLines.forEach((line, i) => { doc.text(line, 22, y + 13 + i * 4); });
  y += 26;

  // ── Key Factors ──
  if (mlData.key_factors && mlData.key_factors.length > 0) {
    y = sectionHeader(doc, y, 'Key Factors', COLORS.yellow);
    mlData.key_factors.forEach(f => {
      y = checkPage(doc, y, 7);
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.slate300);
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${f}`, 22, y);
      y += 5.5;
    });
    y += 3;
  }

  // ── H2H ──
  if (h2hData && h2hData.matches && h2hData.matches.length > 0) {
    y = sectionHeader(doc, y, 'Head-to-Head Record', COLORS.purple);
    y = statRow(doc, y, `${home} Wins`, h2hData.homeWins || 0, COLORS.cyan);
    y = statRow(doc, y, 'Draws', h2hData.draws || 0, COLORS.yellow);
    y = statRow(doc, y, `${away} Wins`, h2hData.awayWins || 0, COLORS.purple);
    y += 3;

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slate500);
    doc.text('Recent Meetings:', 22, y);
    y += 5;

    h2hData.matches.slice(0, 6).forEach(m => {
      y = checkPage(doc, y, 6);
      const isDraw = m.homeGoals === m.awayGoals;
      const homeWon = m.homeGoals > m.awayGoals;
      const scoreColor = isDraw ? COLORS.yellow : homeWon ? COLORS.cyan : COLORS.purple;
      const date = new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.slate400);
      doc.setFont('helvetica', 'normal');
      doc.text(`${date}`, 22, y);
      doc.text(`${(m.homeTeam || '').replace(' FC','').substring(0,16)}`, 45, y);
      doc.setTextColor(...scoreColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`${m.homeGoals} - ${m.awayGoals}`, 105, y, { align: 'center' });
      doc.setTextColor(...COLORS.slate400);
      doc.setFont('helvetica', 'normal');
      doc.text(`${(m.awayTeam || '').replace(' FC','').substring(0,16)}`, 118, y);
      y += 5;
    });
    y += 3;
  }

  // ── AI Analysis ──
  if (analysisText) {
    y = sectionHeader(doc, y, 'AI Tactical Analysis', COLORS.emerald);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slate300);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(analysisText.replace(/[#*]/g, '').substring(0, 5000), w - 37);
    lines.forEach(line => {
      y = checkPage(doc, y, 5);
      doc.text(line, 22, y);
      y += 4.5;
    });
  }

  addFooter(doc);
  doc.save(`${home}_vs_${away}_prediction.pdf`);
}


// ══════════════════════════════════════════
// EXPORT: Player Comparison Report
// ══════════════════════════════════════════

export function exportPlayerComparison(players) {
  if (!players || players.length < 2) return;
  const names = players.map(p => p.name).join(' vs ');
  const { doc, w, y: startY } = initPDF(names, 'Player Comparison Report');
  let y = startY;

  players.forEach((p, idx) => {
    const color = idx === 0 ? COLORS.cyan : idx === 1 ? COLORS.purple : COLORS.yellow;
    y = sectionHeader(doc, y, p.name, color);
    y = statRow(doc, y, 'Team', p.team || '-', COLORS.white);
    y = statRow(doc, y, 'Position', p.position || '-', COLORS.slate300);
    y = statRow(doc, y, 'Rating', p.rating?.toFixed(1) || '-', COLORS.emerald);
    y = statRow(doc, y, 'Appearances', p.appearances || 0, COLORS.white);
    y = statRow(doc, y, 'Goals', p.goals || 0, COLORS.cyan);
    y = statRow(doc, y, 'Assists', p.assists || 0, COLORS.purple);
    y = statRow(doc, y, 'xG', p.xG?.toFixed(2) || 0, COLORS.emerald);
    y = statRow(doc, y, 'xA', p.xA?.toFixed(2) || 0, COLORS.yellow);
    y = statRow(doc, y, 'Goals/90', p.goalsPerNinety?.toFixed(2) || 0, COLORS.cyan);
    y = statRow(doc, y, 'Assists/90', p.assistsPerNinety?.toFixed(2) || 0, COLORS.purple);
    y = statRow(doc, y, 'Key Passes', p.keyPasses || 0, COLORS.white);
    y = statRow(doc, y, 'Shots', p.shotsTotal || 0, COLORS.white);
    y = statRow(doc, y, 'Shot Accuracy', `${p.shotAccuracy || 0}%`, COLORS.orange);
    y = statRow(doc, y, 'Pass Accuracy', `${p.passAccuracy || 0}%`, COLORS.emerald);
    y = statRow(doc, y, 'Tackles', p.tacklesTotal || 0, COLORS.white);
    y = statRow(doc, y, 'Interceptions', p.interceptions || 0, COLORS.white);
    y = statRow(doc, y, 'Duels Won', `${p.duelsWon || 0} (${p.duelWinPct || 0}%)`, COLORS.white);
    y = statRow(doc, y, 'Yellow Cards', p.yellowCards || 0, COLORS.yellow);
    y = statRow(doc, y, 'Red Cards', p.redCards || 0, COLORS.red);
    y += 5;
  });

  y = sectionHeader(doc, y, 'Quick Comparison', COLORS.yellow);
  const labels = ['Goals', 'Assists', 'Rating', 'xG', 'Key Passes'];
  const keys   = ['goals', 'assists', 'rating', 'xG', 'keyPasses'];
  labels.forEach((label, i) => {
    y = checkPage(doc, y, 7);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slate400);
    doc.text(label, 22, y);
    players.forEach((p, pi) => {
      const color = pi === 0 ? COLORS.cyan : pi === 1 ? COLORS.purple : COLORS.yellow;
      doc.setTextColor(...color);
      doc.setFont('helvetica', 'bold');
      const val = p[keys[i]];
      doc.text(String(typeof val === 'number' ? (val % 1 ? val.toFixed(2) : val) : val || 0), 80 + pi * 35, y);
    });
    doc.setFont('helvetica', 'normal');
    y += 6;
  });

  addFooter(doc);
  doc.save(`comparison_${players.map(p => p.name.split(' ').pop()).join('_vs_')}.pdf`);
}


// ══════════════════════════════════════════
// EXPORT: Season Simulation Report
// ══════════════════════════════════════════

export function exportSeasonSimulation(simulation) {
  if (!simulation) return;
  const { doc, w, y: startY } = initPDF(`${simulation.league} Season Simulation`, 'Predicted Final Standings');
  let y = startY;

  y = sectionHeader(doc, y, 'Simulation Summary');
  y = statRow(doc, y, 'League', simulation.league, COLORS.white);
  y = statRow(doc, y, 'Matches Simulated', simulation.totalSimulated || 0, COLORS.cyan);
  y = statRow(doc, y, 'Remaining Fixtures', simulation.totalRemaining || 0, COLORS.purple);
  const champ = simulation.predictedTable?.[0];
  if (champ) {
    y = statRow(doc, y, 'Predicted Champion', champ.team?.replace(/ FC$| AFC$| CF$/, ''), COLORS.yellow);
    y = statRow(doc, y, 'Champion Points', champ.points, COLORS.emerald);
  }
  y += 5;

  y = sectionHeader(doc, y, 'Predicted Final Table');
  y = checkPage(doc, y, 10);
  doc.setFillColor(...COLORS.card);
  doc.rect(15, y - 3, w - 30, 8, 'F');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.slate500);
  doc.setFont('helvetica', 'bold');
  const cols = [{ l: '#', x: 18 }, { l: 'Team', x: 28 }, { l: 'P', x: 90 }, { l: 'W', x: 100 }, { l: 'D', x: 110 }, { l: 'L', x: 120 }, { l: 'GD', x: 132 }, { l: 'Pts', x: 145 }, { l: 'Chg', x: 158 }];
  cols.forEach(c => doc.text(c.l, c.x, y + 2));
  y += 9;

  (simulation.predictedTable || []).forEach((team, i) => {
    y = checkPage(doc, y, 6);
    const isCL  = i < (simulation.config?.cl || 4);
    const isEL  = i >= (simulation.config?.cl || 4) && i < (simulation.config?.cl || 4) + (simulation.config?.el || 2);
    const isRel = i >= (simulation.predictedTable.length - (simulation.config?.relegation || 3));

    if (isCL)       { doc.setFillColor(...COLORS.blue);   doc.rect(15, y - 3.5, 1.5, 5, 'F'); }
    else if (isEL)  { doc.setFillColor(...COLORS.orange);  doc.rect(15, y - 3.5, 1.5, 5, 'F'); }
    else if (isRel) { doc.setFillColor(...COLORS.red);     doc.rect(15, y - 3.5, 1.5, 5, 'F'); }

    doc.setFontSize(7);
    const posColor = isCL ? COLORS.blue : isEL ? COLORS.orange : isRel ? COLORS.red : COLORS.slate500;
    doc.setTextColor(...posColor);
    doc.setFont('helvetica', 'bold');
    doc.text(String(team.predictedPosition), 18, y);
    doc.setTextColor(...COLORS.white);
    doc.text((team.team || '').replace(/ FC$| AFC$| CF$/, '').substring(0, 25), 28, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.slate400);
    doc.text(String(team.played || 0), 90, y);
    doc.text(String(team.won || 0), 100, y);
    doc.text(String(team.drawn || 0), 110, y);
    doc.text(String(team.lost || 0), 120, y);
    const gd = team.goalDifference || 0;
    doc.setTextColor(gd > 0 ? COLORS.emerald[0] : gd < 0 ? COLORS.red[0] : COLORS.slate500[0], gd > 0 ? COLORS.emerald[1] : gd < 0 ? COLORS.red[1] : COLORS.slate500[1], gd > 0 ? COLORS.emerald[2] : gd < 0 ? COLORS.red[2] : COLORS.slate500[2]);
    doc.text(`${gd > 0 ? '+' : ''}${gd}`, 132, y);
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.text(String(team.points || 0), 145, y);
    const chg = team.positionChange || 0;
    if (chg > 0)      { doc.setTextColor(...COLORS.emerald); doc.text(`+${chg}`, 158, y); }
    else if (chg < 0) { doc.setTextColor(...COLORS.red);     doc.text(String(chg), 158, y); }
    else              { doc.setTextColor(...COLORS.slate600); doc.text('0', 158, y); }
    y += 5.5;
  });

  y += 5;
  y = checkPage(doc, y, 12);
  doc.setFontSize(7);
  [{ c: COLORS.blue, l: 'Champions League' }, { c: COLORS.orange, l: 'Europa League' }, { c: COLORS.red, l: 'Relegation' }].forEach((z, i) => {
    doc.setFillColor(...z.c);
    doc.rect(22 + i * 50, y, 3, 3, 'F');
    doc.setTextColor(...COLORS.slate500);
    doc.text(z.l, 27 + i * 50, y + 2.5);
  });

  addFooter(doc);
  doc.save(`${simulation.league.replace(/\s/g, '_')}_simulation.pdf`);
}


// ══════════════════════════════════════════
// EXPORT: League Standings
// ══════════════════════════════════════════

export function exportLeagueStandings(league, standings) {
  if (!standings || standings.length === 0) return;
  const { doc, w, y: startY } = initPDF(`${league} Standings`, 'League Table — 2025/26 Season');
  let y = startY;

  y = checkPage(doc, y, 10);
  doc.setFillColor(...COLORS.card);
  doc.rect(15, y - 3, w - 30, 8, 'F');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.slate500);
  doc.setFont('helvetica', 'bold');
  const cols = [{ l: '#', x: 18 }, { l: 'Team', x: 28 }, { l: 'P', x: 88 }, { l: 'W', x: 97 }, { l: 'D', x: 106 }, { l: 'L', x: 115 }, { l: 'GF', x: 124 }, { l: 'GA', x: 134 }, { l: 'GD', x: 144 }, { l: 'Pts', x: 157 }];
  cols.forEach(c => doc.text(c.l, c.x, y + 2));
  y += 9;

  standings.forEach((team, i) => {
    y = checkPage(doc, y, 6);
    const pos   = team.position || i + 1;
    const total = standings.length;
    const isCL  = pos <= 4;
    const isEL  = pos === 5;
    const isRel = pos > total - 3;

    if (isCL)       { doc.setFillColor(...COLORS.blue);   doc.rect(15, y - 3.5, 1.5, 5, 'F'); }
    else if (isEL)  { doc.setFillColor(...COLORS.orange);  doc.rect(15, y - 3.5, 1.5, 5, 'F'); }
    else if (isRel) { doc.setFillColor(...COLORS.red);     doc.rect(15, y - 3.5, 1.5, 5, 'F'); }

    doc.setFontSize(7);
    const posColor = isCL ? COLORS.blue : isEL ? COLORS.orange : isRel ? COLORS.red : COLORS.slate500;
    doc.setTextColor(...posColor);
    doc.setFont('helvetica', 'bold');
    doc.text(String(pos), 18, y);
    doc.setTextColor(...COLORS.white);
    doc.text((team.team || '').replace(/ FC$| AFC$/, '').substring(0, 28), 28, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.slate400);
    doc.text(String(team.played || 0), 88, y);
    doc.text(String(team.won || 0), 97, y);
    doc.text(String(team.draw || 0), 106, y);
    doc.text(String(team.lost || 0), 115, y);
    doc.text(String(team.goals_for || 0), 124, y);
    doc.text(String(team.goals_against || 0), 134, y);
    const gd = team.goal_diff || 0;
    doc.setTextColor(gd > 0 ? COLORS.emerald[0] : gd < 0 ? COLORS.red[0] : COLORS.slate500[0], gd > 0 ? COLORS.emerald[1] : gd < 0 ? COLORS.red[1] : COLORS.slate500[1], gd > 0 ? COLORS.emerald[2] : gd < 0 ? COLORS.red[2] : COLORS.slate500[2]);
    doc.text(`${gd > 0 ? '+' : ''}${gd}`, 144, y);
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.text(String(team.points || 0), 157, y);
    y += 5.5;
  });

  y += 5;
  y = checkPage(doc, y, 12);
  doc.setFontSize(7);
  [{ c: COLORS.blue, l: 'Champions League' }, { c: COLORS.orange, l: 'Europa League' }, { c: COLORS.red, l: 'Relegation' }].forEach((z, i) => {
    doc.setFillColor(...z.c);
    doc.rect(22 + i * 50, y, 3, 3, 'F');
    doc.setTextColor(...COLORS.slate500);
    doc.text(z.l, 27 + i * 50, y + 2.5);
  });

  addFooter(doc);
  doc.save(`${league.replace(/\s/g, '_')}_standings.pdf`);
}
// ══════════════════════════════════════════
// EXPORT: Social Media Share Card (PNG)
// Now async: preloads club crests (CORS-safe) and shows match date / competition.
// If a crest fails to load, the card still renders without it.
// ══════════════════════════════════════════

// Load an image with CORS enabled. Resolves to the image, or null on failure
// (so a missing/blocked crest never breaks the card).
// Crests come from football-data.org, which does NOT send CORS headers, so we
// route them through our own backend proxy to make them same-origin.
const API_BASE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL)
  || 'https://football-analytics-ai-production.up.railway.app';
 
function proxiedCrest(url) {
  if (!url) return null;
  // Already same-origin or a data URL — use as-is.
  if (url.startsWith('data:') || url.startsWith('/')) return url;
  return `${API_BASE}/crest?url=${encodeURIComponent(url)}`;
}
 
function loadCrest(url) {
  return new Promise((resolve) => {
    const src = proxiedCrest(url);
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
 
// Draw a crest inside a white disc (so it reads on the dark card), centered at (cx, cy).
function drawCrestDisc(ctx, img, cx, cy, r) {
  // white disc
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fill();
  ctx.restore();
 
  if (img) {
    // clip the logo into the disc, with a little padding
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
    ctx.clip();
    const pad = 14;
    const d = (r - 6) * 2 - pad;
    ctx.drawImage(img, cx - d / 2, cy - d / 2, d, d);
    ctx.restore();
  }
}
 
export async function exportShareCard(mlData, h2hData) {
  const home = mlData.home_team_name || 'Home';
  const away = mlData.away_team_name || 'Away';
  const homeWin = ((mlData.home_win || 0) * 100).toFixed(0);
  const draw    = ((mlData.draw    || 0) * 100).toFixed(0);
  const awayWin = ((mlData.away_win || 0) * 100).toFixed(0);
  const predicted = mlData.predicted_score || '?-?';
  const conf    = ((mlData.confidence || 0) * 100).toFixed(0);
  const confLevel = mlData.confidence_level || 'Medium';
  const hXg     = (mlData.home_expected_goals || 0).toFixed(2);
  const aXg     = (mlData.away_expected_goals || 0).toFixed(2);
  const outcome = mlData.predicted_outcome || '';
 
  // Competition + date line (uses whatever fields you have; all optional)
  const league = mlData.league || mlData.competition || '';
  let dateStr = '';
  const rawDate = mlData.match_date || mlData.date || mlData.fixture_date;
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d)) {
      dateStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }
  }
  const metaLine = [league, dateStr].filter(Boolean).join('  •  ');
 
  // Preload both crests before drawing (so toDataURL works).
  const [homeImg, awayImg] = await Promise.all([
    loadCrest(mlData.home_team_logo || mlData.home_logo || mlData.homeLogo || mlData.home_crest || mlData.home_team_badge || (mlData.home_team && mlData.home_team.logo)),
    loadCrest(mlData.away_team_logo || mlData.away_logo || mlData.awayLogo || mlData.away_crest || mlData.away_team_badge || (mlData.away_team && mlData.away_team.logo)),
  ]);
 
  const SIZE = 1080;
  const canvas = document.createElement('canvas');
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
 
  // ── Background ──
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, '#050810');
  bg.addColorStop(0.5, '#0a0f1f');
  bg.addColorStop(1, '#060c1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);
 
  // Grid lines (subtle)
  ctx.strokeStyle = 'rgba(34,211,238,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < SIZE; i += 80) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(SIZE, i); ctx.stroke();
  }
 
  // Top accent bar
  const topBar = ctx.createLinearGradient(0, 0, SIZE, 0);
  topBar.addColorStop(0, '#22d3ee');
  topBar.addColorStop(0.5, '#a855f7');
  topBar.addColorStop(1, '#22d3ee');
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, SIZE, 6);
 
  // ── Brand ──
  ctx.font = '800 48px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('Scorina', 60, 90);
 
  // AI badge
  const aiGrad = ctx.createLinearGradient(0, 60, 0, 100);
  aiGrad.addColorStop(0, '#22d3ee');
  aiGrad.addColorStop(1, '#a855f7');
  ctx.fillStyle = aiGrad;
  const aiX = 60 + ctx.measureText('Scorina').width + 12;
  roundRect(ctx, aiX, 58, 72, 38, 10);
  ctx.fill();
  ctx.font = '900 28px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('AI', aiX + 36, 83);
 
  ctx.font = '600 28px Arial, sans-serif';
  ctx.fillStyle = 'rgba(100,116,139,0.8)';
  ctx.textAlign = 'right';
  ctx.fillText('Match Prediction', SIZE - 60, 90);
 
  // ── Competition / date line (new) ──
  if (metaLine) {
    ctx.font = '600 24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(148,163,184,0.65)';
    ctx.textAlign = 'center';
    ctx.fillText(metaLine.toUpperCase(), SIZE / 2, 140);
  }
 
  // ── Crests (new) ── drawn above the team names
  const crestY = 210;
  const crestR = 54;
  drawCrestDisc(ctx, homeImg, SIZE / 4, crestY, crestR);
  drawCrestDisc(ctx, awayImg, (SIZE / 4) * 3, crestY, crestR);
 
  // ── VS Header ── (shifted down to sit under the crests)
  const vsY = 330;
  const homeShort = home.replace(/ FC$| AFC$| United$/, '').split(' ').slice(0, 2).join(' ');
  const awayShort = away.replace(/ FC$| AFC$| United$/, '').split(' ').slice(0, 2).join(' ');
  ctx.font = '900 52px Arial, sans-serif';
  ctx.fillStyle = '#22d3ee';
  ctx.textAlign = 'center';
  ctx.fillText(homeShort, SIZE / 4, vsY);
  // VS (centered between the crests)
  ctx.font = '700 34px Arial, sans-serif';
  ctx.fillStyle = 'rgba(100,116,139,0.6)';
  ctx.fillText('VS', SIZE / 2, crestY + 10);
  // Away team
  ctx.font = '900 52px Arial, sans-serif';
  ctx.fillStyle = '#a855f7';
  ctx.fillText(awayShort, (SIZE / 4) * 3, vsY);
 
  // Full names below
  ctx.font = '500 25px Arial, sans-serif';
  ctx.fillStyle = 'rgba(148,163,184,0.7)';
  ctx.fillText(home, SIZE / 4, vsY + 40);
  ctx.fillText(away, (SIZE / 4) * 3, vsY + 40);
 
  // Divider
  const divGrad = ctx.createLinearGradient(60, 0, SIZE - 60, 0);
  divGrad.addColorStop(0, 'transparent');
  divGrad.addColorStop(0.3, 'rgba(34,211,238,0.3)');
  divGrad.addColorStop(0.7, 'rgba(168,85,247,0.3)');
  divGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, vsY + 70); ctx.lineTo(SIZE - 60, vsY + 70); ctx.stroke();
 
  // ── Predicted Score Box ──
  const boxY = 445;
  ctx.fillStyle = 'rgba(17,24,39,0.95)';
  roundRect(ctx, SIZE/2 - 160, boxY, 320, 110, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(34,211,238,0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, SIZE/2 - 160, boxY, 320, 110, 20);
  ctx.stroke();
 
  ctx.font = '700 22px Arial, sans-serif';
  ctx.fillStyle = 'rgba(100,116,139,0.8)';
  ctx.textAlign = 'center';
  ctx.fillText('PREDICTED SCORE', SIZE / 2, boxY + 32);
 
  ctx.font = '900 72px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(predicted, SIZE / 2, boxY + 95);
 
  // Confidence badge
  const cColor = confLevel === 'High' ? '#10b981' : confLevel === 'Medium' ? '#f59e0b' : '#ef4444';
  ctx.fillStyle = cColor + '22';
  roundRect(ctx, SIZE/2 - 160, boxY + 122, 320, 38, 10);
  ctx.fill();
  ctx.strokeStyle = cColor + '66';
  ctx.lineWidth = 1.5;
  roundRect(ctx, SIZE/2 - 160, boxY + 122, 320, 38, 10);
  ctx.stroke();
  ctx.font = '800 22px Arial, sans-serif';
  ctx.fillStyle = cColor;
  ctx.textAlign = 'center';
  ctx.fillText(`${confLevel.toUpperCase()} CONFIDENCE • ${conf}%`, SIZE / 2, boxY + 147);
 
  // ── Win Probability Bar ──
  const barY = 680;
  ctx.font = '600 24px Arial, sans-serif';
  ctx.fillStyle = 'rgba(100,116,139,0.7)';
  ctx.fillText('WIN PROBABILITIES', SIZE / 2, barY - 16);
 
  const barX = 60;
  const barW = SIZE - 120;
  const barH = 28;
  const hw = parseFloat(homeWin) / 100;
  const dw = parseFloat(draw) / 100;
  const aw = parseFloat(awayWin) / 100;
 
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  roundRect(ctx, barX, barY, barW, barH, 14);
  ctx.fill();
 
  if (hw > 0) {
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(barX, barY, barW * hw, barH, [14, 0, 0, 14]) : roundRectPartial(ctx, barX, barY, barW * hw, barH, 14, 0, 0, 14);
    ctx.fill();
  }
  if (dw > 0) {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(barX + barW * hw, barY, barW * dw, barH);
  }
  if (aw > 0) {
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(barX + barW * (hw + dw), barY, barW * aw, barH, [0, 14, 14, 0]) : roundRectPartial(ctx, barX + barW * (hw + dw), barY, barW * aw, barH, 0, 14, 14, 0);
    ctx.fill();
  }
 
  const labelY = barY + barH + 30;
  ctx.font = '800 30px Arial, sans-serif';
  ctx.fillStyle = '#22d3ee';
  ctx.textAlign = 'left';
  ctx.fillText(`${homeShort} ${homeWin}%`, barX, labelY);
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText(`Draw ${draw}%`, SIZE / 2, labelY);
  ctx.fillStyle = '#a855f7';
  ctx.textAlign = 'right';
  ctx.fillText(`${awayShort} ${awayWin}%`, barX + barW, labelY);
 
  // ── xG Stats ──
  const xgY = 830;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, xgY - 20); ctx.lineTo(SIZE - 60, xgY - 20); ctx.stroke();
 
  ctx.font = '600 22px Arial, sans-serif';
  ctx.fillStyle = 'rgba(100,116,139,0.7)';
  ctx.textAlign = 'center';
  ctx.fillText('EXPECTED GOALS (xG)', SIZE / 2, xgY + 10);
 
  ctx.font = '900 54px Arial, sans-serif';
  ctx.fillStyle = '#22d3ee';
  ctx.textAlign = 'center';
  ctx.fillText(hXg, SIZE / 4, xgY + 72);
  ctx.fillStyle = 'rgba(100,116,139,0.5)';
  ctx.font = '700 36px Arial, sans-serif';
  ctx.fillText('—', SIZE / 2, xgY + 72);
  ctx.font = '900 54px Arial, sans-serif';
  ctx.fillStyle = '#a855f7';
  ctx.fillText(aXg, (SIZE / 4) * 3, xgY + 72);
 
  // ── Outcome label ──
  if (outcome) {
    const outY = 935;
    ctx.fillStyle = 'rgba(17,24,39,0.8)';
    roundRect(ctx, 60, outY, SIZE - 120, 64, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,158,11,0.4)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 60, outY, SIZE - 120, 64, 14);
    ctx.stroke();
    ctx.font = '700 22px Arial, sans-serif';
    ctx.fillStyle = 'rgba(100,116,139,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('VERDICT', SIZE / 2, outY + 24);
    ctx.font = '900 30px Arial, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(outcome, SIZE / 2, outY + 52);
  }
 
  // ── Footer ──
  ctx.fillStyle = 'rgba(100,116,139,0.4)';
  ctx.font = '500 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('scorinai.com  •  AI-Powered Football Analytics', SIZE / 2, SIZE - 36);
 
  // Bottom accent line
  const bottomBar = ctx.createLinearGradient(0, 0, SIZE, 0);
  bottomBar.addColorStop(0, '#a855f7');
  bottomBar.addColorStop(0.5, '#22d3ee');
  bottomBar.addColorStop(1, '#a855f7');
  ctx.fillStyle = bottomBar;
  ctx.fillRect(0, SIZE - 6, SIZE, 6);
 
  // ── Download ── (guard against a tainted canvas if a crest lacked CORS headers)
  try {
    const link = document.createElement('a');
    link.download = `${homeShort}_vs_${awayShort}_ScorinaAI.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('Share card export failed (likely a cross-origin crest). Retrying without crests.', err);
    // Fallback: redraw once without crests so the user still gets a card.
    return exportShareCardNoCrest(mlData, h2hData);
  }
}
 
// Fallback path: identical card but skips crest loading entirely (never taints canvas).
function exportShareCardNoCrest(mlData, h2hData) {
  const clone = Object.assign({}, mlData);
  delete clone.home_team_logo; delete clone.home_logo;
  delete clone.away_team_logo; delete clone.away_logo;
  // crests already failed; loadCrest will resolve null and the card renders text-only
  return exportShareCard(clone, h2hData);
}
 
// Helper: roundRect polyfill
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function roundRectPartial(ctx, x, y, w, h, tl, tr, br, bl) {
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}
