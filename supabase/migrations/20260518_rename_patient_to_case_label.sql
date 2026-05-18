ALTER TABLE entries RENAME COLUMN patient TO case_label;
ALTER TABLE entries ALTER COLUMN case_label DROP NOT NULL;
