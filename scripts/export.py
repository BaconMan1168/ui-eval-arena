#!/usr/bin/env python3
"""
Export anonymized ratings to data/ratings.csv.

Usage:
  python scripts/export.py

Requires:
  pip install psycopg2-binary python-dotenv
"""

import csv
import os
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / '.env.local')

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
    ORDER BY r.timestamp
''')
rows = cur.fetchall()
conn.close()

if not rows:
    print('No ratings found.')
    sys.exit(0)

out_path = Path(__file__).parent.parent / 'data' / 'ratings.csv'
out_path.parent.mkdir(exist_ok=True)

with open(out_path, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['submission_id', 'model_name', 'star_rating', 'rater_session_hash', 'timestamp'])
    writer.writerows(rows)

print(f'data/ratings.csv written ({len(rows)} rows)')
