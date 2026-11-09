# Loan Tracker

A React app for tracking the payments and interest history of a single loan. All data is saved in your browser's local storage.

## Run it

Requires Node.js 18+.

```sh
cd /home/brad/code/amort
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Other commands

- `npm test` – run the loan calculation tests
- `npm run build` – production build into `dist/`
- `npm run preview` – serve the production build locally

## Usage

1. Enter the initial loan amount, annual interest rate and start date.
2. Add payments with an amount and payment date.
3. Use "Apply interest" with an effective date to calculate and post interest (manual for now).
4. Review the history table; delete any entry if needed.

Interest is simple daily interest (rate ÷ 365) on principal. Payments go to applied interest first, then principal.

Data is stored per browser under the local storage key `amort.loan.v1`; clearing site data erases it.
