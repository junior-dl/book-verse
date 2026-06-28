ALTER TABLE "books_cache" DROP COLUMN "author";--> statement-breakpoint
ALTER TABLE "books_cache" DROP COLUMN "download_links";--> statement-breakpoint
ALTER TABLE "books_cache" ADD COLUMN "author" jsonb;--> statement-breakpoint
ALTER TABLE "books_cache" ADD COLUMN "download_links" jsonb;