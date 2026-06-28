ALTER TABLE "books_cache" RENAME COLUMN "author_name" TO "author";--> statement-breakpoint
ALTER TABLE "books_cache" ADD COLUMN "summary" text[];--> statement-breakpoint
ALTER TABLE "books_cache" ADD COLUMN "language" text[];--> statement-breakpoint
ALTER TABLE "books_cache" ADD COLUMN "download_links" text[];