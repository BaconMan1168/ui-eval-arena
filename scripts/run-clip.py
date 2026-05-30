#!/usr/bin/env python3
"""
Compute CLIP cosine similarity between each generation's rendered HTML and
the original screenshot. Writes scores back to generations.clip_score.

Usage:
  python scripts/run-clip.py

Requires:
  pip install playwright transformers torch Pillow psycopg2-binary requests python-dotenv
  playwright install chromium
"""

import os
import io
import sys
import datetime
import requests
import psycopg2
from pathlib import Path
from dotenv import load_dotenv
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
from playwright.sync_api import sync_playwright

load_dotenv(Path(__file__).parent.parent / '.env.local')

DB_URL = os.environ.get('DATABASE_URL_UNPOOLED') or os.environ.get('DATABASE_URL')
if not DB_URL:
    sys.exit('DATABASE_URL_UNPOOLED or DATABASE_URL must be set in .env.local')

BLOB_TOKEN = os.environ.get('BLOB_READ_WRITE_TOKEN', '')

print('Loading CLIP model (first run downloads ~350MB)...')
model = CLIPModel.from_pretrained('openai/clip-vit-base-patch32')
processor = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')
model.eval()

def clip_similarity(img_a: Image.Image, img_b: Image.Image) -> float:
    inputs = processor(images=[img_a, img_b], return_tensors='pt', padding=True)
    with torch.no_grad():
        feats = model.get_image_features(**inputs)
    feats = feats / feats.norm(dim=-1, keepdim=True)
    return float((feats[0] * feats[1]).sum())

def fetch_screenshot(url: str) -> Image.Image:
    headers = {'Authorization': f'Bearer {BLOB_TOKEN}'} if BLOB_TOKEN else {}
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return Image.open(io.BytesIO(resp.content)).convert('RGB')

def render_html(page, html: str) -> Image.Image:
    page.set_content(html, wait_until='networkidle')
    png_bytes = page.screenshot(full_page=False)
    return Image.open(io.BytesIO(png_bytes)).convert('RGB')

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

cur.execute('''
    SELECT g.id, g.html_output, s.screenshot_url
    FROM generations g
    JOIN submissions s ON s.id = g.submission_id
    WHERE g.clip_score IS NULL
''')
rows = cur.fetchall()

if not rows:
    print('No unscored generations found.')
    conn.close()
    sys.exit(0)

print(f'Scoring {len(rows)} generation(s)...')

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={'width': 1280, 'height': 800})

    for gen_id, html_output, screenshot_url in rows:
        try:
            ref_img = fetch_screenshot(screenshot_url)
            rendered_img = render_html(page, html_output)
            score = clip_similarity(ref_img, rendered_img)
            now = datetime.datetime.utcnow()
            cur.execute(
                'UPDATE generations SET clip_score = %s, clip_scored_at = %s WHERE id = %s',
                (round(score, 4), now, gen_id)
            )
            conn.commit()
            print(f'  {gen_id}: {score:.4f}')
        except Exception as e:
            print(f'  {gen_id}: ERROR — {e}')
            conn.rollback()

    browser.close()

conn.close()
print('Done.')
