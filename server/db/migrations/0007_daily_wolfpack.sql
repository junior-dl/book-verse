ALTER TABLE "books_cache" ADD COLUMN "source_id" numeric;--> statement-breakpoint
ALTER TABLE "books_cache" ADD COLUMN "source_download_count" numeric;--> statement-breakpoint
ALTER TABLE "books_cache" ADD COLUMN "download_count" numeric DEFAULT '0';