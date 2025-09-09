-- Create "health_checks" table
CREATE TABLE "health_checks" (
  "id" text NOT NULL,
  "status" text NOT NULL DEFAULT 'healthy',
  "message" text NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
-- Create "users" table
CREATE TABLE "users" (
  "id" character varying(191) NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "display_name" text NULL,
  "email" text NULL,
  "avatar_url" text NULL,
  "locale" text NULL DEFAULT 'ja',
  PRIMARY KEY ("id")
);
-- Create index "users_email_key" to table: "users"
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
