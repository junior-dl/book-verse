ALTER TABLE "books_cache" 
ALTER COLUMN "author_name" 
SET DATA TYPE text[] 
USING CASE 
  WHEN "author_name" IS NULL THEN NULL 
  ELSE ARRAY["author_name"]
END;