#!/bin/bash
# Mobile responsiveness patch for Football Analyst AI
# Run from your src/ directory: bash mobile_patch.sh

echo "Patching AnalysisPage.js..."

# 1. League card grid in match tab: 5 cols → 3/6 responsive
sed -i 's/grid grid-cols-5 gap-1\.5 mb-5 overflow-x-auto/grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-5/g' src/pages/AnalysisPage.js

# 2. ScoutReport percentile label column
sed -i 's/w-28 flex-shrink-0 text-right/w-16 sm:w-28 flex-shrink-0 text-right/g' src/pages/AnalysisPage.js

# 3. ScoutReport value column
# (careful - there are multiple w-12 uses, target the text-right one)
sed -i 's/w-12 text-right flex-shrink-0/w-10 sm:w-12 text-right flex-shrink-0/g' src/pages/AnalysisPage.js

# 4. ScoutReport percentile label (pct badge column)
sed -i 's/w-24 flex-shrink-0/w-16 sm:w-24 flex-shrink-0/g' src/pages/AnalysisPage.js

# 5. xGLab league filter: 6 cols → 3/6 
sed -i 's/grid grid-cols-6 gap-2 mb-5/grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 mb-4 sm:mb-5/g' src/pages/AnalysisPage.js

# 6. xGLab view tabs: add overflow-x-auto for mobile
sed -i 's/flex gap-1\.5 rounded-2xl p-1\.5 border border-white\/12" style={{background/flex gap-1 sm:gap-1.5 rounded-2xl p-1 sm:p-1.5 border border-white\/12 overflow-x-auto" style={{background/g' src/pages/AnalysisPage.js

# 7. Match tab team selectors: add mobile spacing
sed -i 's/grid-cols-2 gap-3 mb-4/grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4/g' src/pages/AnalysisPage.js

# 8. Section padding on mobile
sed -i 's/px-4 md:px-6 py-8/px-4 sm:px-5 md:px-6 py-5 sm:py-8/g' src/pages/AnalysisPage.js

echo "Patching AnalyticsPage.js..."

# 1. League selector: 7 cols → 4/7
sed -i 's/grid-cols-7 gap-2 mb-4/grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2 mb-3 sm:mb-4/g' src/pages/AnalyticsPage.js

# 2. Top performers category tabs: allow wrapping
sed -i 's/flex gap-1\.5 mb-5 overflow-x-auto pb-1}/flex flex-wrap gap-1 sm:gap-1.5 mb-4 sm:mb-5/g' src/pages/AnalyticsPage.js

# 3. League overview filter strip: allow wrapping
sed -i 's/flex items-center gap-1\.5 mb-5 overflow-x-auto pb-1 flex-wrap/flex items-center gap-1 sm:gap-1.5 mb-4 sm:mb-5 flex-wrap/g' src/pages/AnalyticsPage.js

# 4. Comparison: hero cards grid - make scrollable on mobile for 3 players
# This targets the dynamic grid used for comparison cards
sed -i 's/grid gap-3 mb-5" style={{ gridTemplateColumns/grid gap-2 sm:gap-3 mb-4 sm:mb-5 overflow-x-auto" style={{ gridTemplateColumns/g' src/pages/AnalyticsPage.js

# 5. League overview table: ensure horizontal scroll
sed -i 's/overflow-x-auto}>/overflow-x-auto}>\n                  <div style={{minWidth:"600px"}}>/g' src/pages/AnalyticsPage.js

echo "All patches applied!"
echo ""
echo "Manual check recommended for:"
echo "  - AnalysisPage tactical formation selector (grid-cols-3 in each formation group)"
echo "  - AnalyticsPage similarity cluster scatter (SVG auto-scales via ResizeObserver)"
echo "  - AnalyticsPage radar chart (ResponsiveContainer auto-scales)"