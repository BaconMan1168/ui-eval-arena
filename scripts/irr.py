#!/usr/bin/env python3
"""
Compute Krippendorff's alpha (inter-rater reliability) from collected ratings.

Usage:
  python scripts/irr.py          # reads data/ratings.csv (default)
  python scripts/irr.py --db     # queries DB directly

Requires:
  pip install krippendorff pandas psycopg2-binary python-dotenv
"""

import argparse
import os
import sys
from pathlib import Path

import krippendorff
import numpy as np
import pandas as pd
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / '.env.local')

COLUMNS = ['submission_id', 'model_name', 'star_rating', 'rater_session_hash', 'timestamp']


def load_from_csv() -> pd.DataFrame:
    csv_path = Path(__file__).parent.parent / 'data' / 'ratings.csv'
    if not csv_path.exists():
        sys.exit('data/ratings.csv not found — run export.py first')
    return pd.read_csv(csv_path)


def load_from_db() -> pd.DataFrame:
    import psycopg2

    DB_URL = os.environ.get('DATABASE_URL_UNPOOLED') or os.environ.get('DATABASE_URL')
    if not DB_URL:
        sys.exit('DATABASE_URL_UNPOOLED or DATABASE_URL must be set in .env.local')

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute('''
        SELECT s.id, g.model_name, r.star_rating, r.rater_session_hash, r.timestamp
        FROM ratings r
        JOIN generations g ON g.id = r.generation_id
        JOIN submissions s ON s.id = g.submission_id
    ''')
    rows = cur.fetchall()
    conn.close()

    if not rows:
        sys.exit('No ratings found in DB.')

    return pd.DataFrame(rows, columns=COLUMNS)


def compute_alpha(df: pd.DataFrame) -> float:
    df['item'] = df['submission_id'].astype(str) + '|' + df['model_name']
    matrix = df.pivot_table(
        index='item',
        columns='rater_session_hash',
        values='star_rating',
        aggfunc='first'
    ).values.astype(float)
    # krippendorff expects raters as rows, items as columns
    return krippendorff.alpha(matrix.T, level_of_measurement='ordinal')


def interpret(alpha: float) -> str:
    if alpha >= 0.8:
        return 'strong agreement'
    if alpha >= 0.67:
        return 'tentative agreement'
    return 'low agreement (treat with caution)'


parser = argparse.ArgumentParser(description='Compute Krippendorff\'s alpha for collected ratings')
parser.add_argument('--db', action='store_true', help='Read from DB instead of data/ratings.csv')
args = parser.parse_args()

df = load_from_db() if args.db else load_from_csv()

n_raters = df['rater_session_hash'].nunique()
n_items = (df['submission_id'].astype(str) + '|' + df['model_name']).nunique()
n_ratings = len(df)

alpha = compute_alpha(df)

print(f'\nRaters:   {n_raters}')
print(f'Items:    {n_items}  (submission × model pairs)')
print(f'Ratings:  {n_ratings}')
print(f'\nKrippendorff\'s α = {alpha:.4f}  ({interpret(alpha)})')

print('\nPer-model breakdown:')
for model, group in df.groupby('model_name'):
    model_alpha = compute_alpha(group)
    print(f'  {model:<30} α = {model_alpha:.4f}')
