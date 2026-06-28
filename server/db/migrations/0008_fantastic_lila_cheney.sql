ALTER TABLE "books_cache" ALTER COLUMN "download_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "books_cache" DROP COLUMN "source_id";