import ScraperFC as sfc
import pandas as pd

s = sfc.FBref()
cats = ['defensive', 'passing', 'possession', 'shooting', 'goal and shot creation', 'goalkeeping']

for cat in cats:
    print(f'\n=== {cat.upper()} ===')
    try:
        r = s.scrape_stats(year='2025-2026', league='England Premier League', stat_category=cat)
        df = r['player']
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = ['_'.join(str(x) for x in col if 'Unnamed' not in str(x) and 'nan' not in str(x)).strip('_') for col in df.columns]
        for col in df.columns:
            non_null = pd.to_numeric(df[col], errors='coerce').notna().sum()
            if non_null > 100:
                print(f'  {col}: {non_null} values')
    except Exception as e:
        print(f'  Error: {e}')