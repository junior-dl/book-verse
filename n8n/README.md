# BookVerse n8n companion

The website never calls book providers while a visitor waits. Two n8n workflows fill the Neon catalog in the background:

| Workflow                                                | Schedule     | What it does                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BookVerse – Catalog Ingest** (`ingest.workflow.ts`)   | every 20 min | Claims up to 3 jobs from `ingest_queue`. **search** jobs (a visitor searched and got under 5 results) query Gutendex, Open Library, Google Books and CrossRef. **author** jobs (an author page has no bio yet) query Open Library and Wikipedia. When the queue is empty, a **discover** job pulls the next page of popular Gutendex books. |
| **BookVerse – Weekly Data Health** (`health.workflow.ts`) | Mondays 9:07 | Runs `bv_scan_health()`, which flags books with 3+ authors, authors born after a book was first published, and possible duplicates. It never edits the catalog: review flags at `/admin/flags` (emails listed in `ADMIN_EMAILS`). |
| **BookVerse – AI Tidy (Gemini)** (`gemini.workflow.ts`) | hourly       | Sends up to 60 unclassified provider subject headings to Gemini in **one** structured-output request and maps them onto the 24 BookVerse subjects.                                                                                                                                                                                          |

All matching, merging and de-duplication happens in Postgres (`bv_ingest_work`, `bv_upsert_author`, `bv_merge_works` in `server/db/migrations/0014`–`0015`). n8n only fetches and reshapes JSON, so the logic is versioned in git and n8n keeps no state.

## How it stays inside free tiers

- **Gemini:** at most 1 request per hour. `bv_take_budget('gemini', N)` counts calls per day in Neon (the day rolls over at midnight Pacific, like Google's quota) and stops at `geminiDailyLimit`. A run with nothing pending makes no request. Gemini limits are set per Google Cloud project, so give this workflow a key from its own project in AI Studio.
- **Providers:** one job at a time, with a 4-second pause between jobs and at most 3 jobs per run, so about 9 provider calls per run. Every HTTP node has `continueRegularOutput`, so one slow provider (Gutendex often takes over 10 seconds) doesn't fail the run.
- **Neon:** only links and cleaned fields are stored, never raw provider payloads. The queue is capped at 500 rows and deletes finished jobs. Budget rows older than 7 days are purged.
- **n8n storage:** turn off saving successful executions (see setup), so runs leave nothing behind.

## Setup

1. **Neon credential:** in n8n create a _Postgres_ credential named `BookVerse Neon (catalog-v2)` using the **pooled** connection string of the `catalog-v2` branch (Host, Database `neondb`, User, Password, SSL `require`). Then open both workflows and switch every Postgres node to it. n8n auto-picked another Neon credential on creation, so make sure none of the nodes still point at it.
2. **Gemini credential:** create a _Google Gemini (PaLM) API_ credential named `BookVerse – Gemini API` and select it in **Classify with Gemini**.
3. **Contact:** **Catalog Ingest → Config → `contactEmail`** is set to the GitHub repo URL, which Wikipedia and Open Library accept as a contact. Put an email address there to also use CrossRef's faster `mailto` pool.
4. **Execution data:** in each workflow open _Settings_ and set **Save successful production executions → Do not save**. Keep failed executions so you can debug.
5. Run each workflow once manually, check the results, then **Publish**.

## Editing

The `.workflow.ts` files are generated. Edit the JS in `src/*.js` or the queries in `src/build.py`, then run:

```bash
python3 n8n/src/build.py
```
