// One-off cleanup: clears the original AI-industry demo content (sources/articles/analyses/...)
// left over in myhot_dev from before the psychology/AI-sycophancy pivot. Keeps operational
// tables (settings, notify_targets, budgets, admin_users, schema_migrations) untouched.
// Run: node scripts/clear-stale-demo-data.cjs
const postgres = require("postgres");

const CLEAR_TABLES = [
  "sources", "articles", "article_discoveries", "article_revisions", "analyses", "publications",
  "facts", "fact_articles", "stories", "story_digests", "story_heat_hourly", "story_signals",
  "story_aliases", "story_links", "hot_rankings", "grouping_decisions", "grouping_overrides",
  "pool_search", "selected_ledger", "selected_state", "reports", "report_revisions",
  "receipts", "receipt_attempts", "fetch_runs", "job_runs", "delivery_leases", "deliveries",
  "editorial_overrides", "embeddings", "quote_translations", "translation_attempts", "translations",
  "selectbench_results", "selectbench_runs", "ingest_events", "audit_log", "feedback", "feedback_bans",
];

const url = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/myhot_dev";

(async () => {
  const sql = postgres(url, { onnotice: () => {} });
  try {
    await sql.unsafe(`TRUNCATE TABLE ${CLEAR_TABLES.join(", ")} CASCADE`);
    console.log(`Truncated ${CLEAR_TABLES.length} tables on ${url}`);
    for (const t of ["sources", "articles", "analyses", "publications", "stories", "facts"]) {
      const [{ n }] = await sql.unsafe(`select count(*) as n from ${t}`);
      console.log(t, "=", n);
    }
  } finally {
    await sql.end({ timeout: 1 });
  }
})();
