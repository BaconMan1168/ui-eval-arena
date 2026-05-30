# ui-eval-arena

A live benchmark where human raters evaluate LLM-generated UI implementations side-by-side, extending Design2Code's automated metrics with structured human judgment.

Three models — **Claude Haiku 4.5**, **Gemini 2.0 Flash**, and **Llama 4 Scout** (via Groq) — independently generate HTML/CSS from a UI screenshot. Users rate outputs on a 1–5 star scale. Ratings feed a leaderboard and are compared against CLIP similarity scores from the [Design2Code](https://arxiv.org/abs/2403.03163) paper (NAACL 2025).

## How to run locally

```bash
npm install
cp .env.example .env.local   # fill in API keys
npm run db:migrate
npm run dev
```

## Research scripts

```bash
# Score generations with CLIP (requires Playwright + PyTorch)
python scripts/run-clip.py

# Export anonymized ratings to data/ratings.csv
python scripts/export.py

# Compute inter-rater reliability (Krippendorff's α)
python scripts/irr.py          # from CSV
python scripts/irr.py --db     # from DB directly
```

Python dependencies: `pip install psycopg2-binary python-dotenv krippendorff pandas numpy`

## Findings

> Pilot data not yet collected. This section will be filled in after the study completes.

### Results

| Model | Avg human rating | Human rank | Avg CLIP score | CLIP rank | Agreement |
|---|---|---|---|---|---|
| Claude Haiku 4.5 | [TODO] | [TODO] | [TODO] | [TODO] | [TODO] |
| Gemini 2.0 Flash | [TODO] | [TODO] | [TODO] | [TODO] | [TODO] |
| Llama 4 Scout | [TODO] | [TODO] | [TODO] | [TODO] | [TODO] |

### Inter-rater reliability

Krippendorff's α = [TODO] ([TODO] raters, [TODO] items)

### Human vs CLIP divergences

[TODO: narrative of where human and CLIP rankings disagreed and possible explanations]

## Reproducibility

Anonymized ratings exported from the pilot study are in [`data/ratings.csv`](data/ratings.csv).
