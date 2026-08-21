# KANGAYATH WEB — Database Migration Safety Rules

## 1. Migration Framework

KANGAYATH WEB uses **Alembic** alongside **SQLAlchemy 2.0 async** for database schema management.

Migration files are located in: `apps/api/alembic/versions/`

---

## 2. Rules for Zero-Downtime Database Migrations

1. **Never Drop or Rename Columns in a Single Step**:
   - Step 1: Add the new column (nullable or with default).
   - Step 2: Deploy application code that reads/writes both columns.
   - Step 3: Backfill old data into new column.
   - Step 4: Drop old column in a subsequent release.

2. **Index Creation**:
   - In production PostgreSQL, always create large indexes concurrently (`postgresql_concurrently=True`) to avoid locking tables against writes.

3. **Foreign Keys**:
   - Ensure foreign key constraints explicitly declare `ondelete` actions (`CASCADE` or `RESTRICT`) consistent with domain lifecycle rules.
   - Categories and Subcategories must use `RESTRICT` to prevent accidental loss of products.
   - Product Images and Product Variants must use `CASCADE` when a parent product is permanently purged.

4. **Enum Safety**:
   - In PostgreSQL, adding new values to `VARCHAR`-backed Pydantic/SQLAlchemy enums requires no schema rewrite. Native PostgreSQL enums must use `ALTER TYPE ... ADD VALUE`.

---

## 3. Migration Commands Cheatsheet

### Generate New Autodetected Migration
```bash
cd apps/api
alembic revision --autogenerate -m "add_field_name_to_table"
```

### Apply Migrations to Current Database
```bash
alembic upgrade head
```

### Check Current Applied Revision
```bash
alembic current
```

### Rollback Previous Migration
```bash
alembic downgrade -1
```
