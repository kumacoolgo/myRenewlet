ALTER TABLE household_items ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY
        status ASC,
        COALESCE(end_date, next_renewal_date, '9999-12-31') ASC,
        id DESC
    ) AS position
  FROM household_items
)
UPDATE household_items
SET sort_order = (
  SELECT position
  FROM ordered
  WHERE ordered.id = household_items.id
);

CREATE INDEX IF NOT EXISTS idx_household_items_sort_order
ON household_items(sort_order);
