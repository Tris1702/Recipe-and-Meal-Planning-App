-- Extension và kiểu liệt kê dùng chung cho toàn bộ schema.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent() bản gốc là STABLE nên không dùng được trong index. Bọc lại thành
-- IMMUTABLE bằng cách chỉ định thẳng từ điển, nhờ vậy index trigram trên tên
-- công thức bỏ dấu mới tạo được (ADR-005).
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT lower(public.unaccent('public.unaccent', $1)) $$;

DO $$ BEGIN
  CREATE TYPE recipe_status AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE meal_slot AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE unit_dimension AS ENUM ('mass', 'volume', 'count');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
