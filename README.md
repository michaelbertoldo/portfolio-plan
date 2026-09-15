# Algorithmic Trading Research Platform — portfolio dashboard

A public, read-only case study for QuantFinanceLearn. The dashboard separates
historical research from genuine forward SHADOW evidence and contains no broker
connection, order submission, PAPER activation, or live-trading controls.

## Local development

```bash
npm install
npm run dev
```

Production-style development expects a sanitized snapshot at
`public/data/quant-finance-status.json`. If it is absent, the interface renders
the designed unavailable state. For local UI work only, opt into the clearly
labelled demonstration fixture:

```bash
VITE_USE_STATUS_FIXTURE=true npm run dev
```

## Quality checks

```bash
npm run format:check
npm run lint
npm test
npm run build
```

## Publishing sanitized status

Generate the allowlisted snapshot from a separate clean QuantFinanceLearn
worktree or clone. Point the exporter at the scheduled checkout's ledger; it is
opened read-only while the sanitized file is written in the isolated checkout.
Then copy that file into this repository:

```bash
python scripts/export_public_status.py \
  --database /path/to/scheduled-checkout/data/phase2/operations.db \
  --output outputs/public-dashboard/status.json

cp outputs/public-dashboard/status.json \
  /path/to/portfolio-plan/public/data/quant-finance-status.json
```

Never generate or edit tracked dashboard data inside the scheduled operational
QuantFinanceLearn worktree. A dirty operational worktree intentionally blocks
SHADOW collection.

## Deployment

The project is a Vite static site. Vercel can import the repository using the
included `vercel.json`; no environment secrets are required. Other static hosts
should run `npm run build`, publish `dist/`, and provide SPA fallback to
`index.html`.

The frontend must never receive Alpaca credentials, database files, webhook
URLs, broker-account information, or direct access to QuantFinanceLearn. It
consumes only `/data/quant-finance-status.json`.

Historical backtests and forward SHADOW observations do not establish future
profitability. PAPER remains locked and live trading is unavailable.
