-- Migration: Add Password Reset Token Table
-- Created: 2026-02-04
-- Description: Adds password_reset_token table for forgot password functionality

-- Create password_reset_token table
CREATE TABLE IF NOT EXISTS "password_reset_token" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL UNIQUE,
    "expires_at" TIMESTAMP NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "password_reset_token_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user_account"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_reset_token" ON "password_reset_token"("token");
CREATE INDEX IF NOT EXISTS "idx_reset_user_id" ON "password_reset_token"("user_id");

-- Add comment to table
COMMENT ON TABLE "password_reset_token" IS 'Stores password reset tokens for forgot password functionality';
COMMENT ON COLUMN "password_reset_token"."token" IS 'Unique reset token sent via email';
COMMENT ON COLUMN "password_reset_token"."expires_at" IS 'Token expiration timestamp (typically 1 hour from creation)';
COMMENT ON COLUMN "password_reset_token"."used" IS 'Flag to prevent token reuse';
