-- Prevent duplicate root locations within the same company.
CREATE UNIQUE INDEX "Location_root_company_name_key"
ON "Location" ("company", "name")
WHERE "parentId" IS NULL;
