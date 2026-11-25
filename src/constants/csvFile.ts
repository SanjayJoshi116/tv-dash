// The data file name — no `import.meta.env` here, so e2e/fixtures.ts (Playwright, where
// import.meta.env is undefined) can import it. App code uses CSV_URL from paths.ts.
export const CSV_FILE = 'tv_series.csv'
