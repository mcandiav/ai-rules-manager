-- Migration to add composed_rules to governed_artifacts
ALTER TABLE governed_artifacts ADD COLUMN composed_rules TEXT;
