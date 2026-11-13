ALTER TABLE "projects" ALTER COLUMN "challenge" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "approach" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "results" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "gallery" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "blocks" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
-- Copy each existing case study into blocks, in the order the page used to show it:
-- challenge, approach, results, gallery. Only projects that have no blocks yet.
UPDATE "projects" SET "blocks" = jsonb_build_array(
  jsonb_build_object('type', 'text', 'label', 'The challenge', 'text', "challenge", 'size', 'statement'),
  jsonb_build_object('type', 'text', 'label', 'Our approach', 'text', "approach", 'size', 'statement'),
  jsonb_build_object('type', 'results', 'label', 'Results', 'items', "results"),
  jsonb_build_object('type', 'gallery', 'images', "gallery")
) WHERE "blocks" = '[]'::jsonb;
