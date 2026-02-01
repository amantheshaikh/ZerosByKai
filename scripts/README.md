# Scripts Directory

Utility scripts for the ZerosByKai project.

## Available Scripts

### `sync-public-files.sh`

Syncs public files from `frontend/public/` to project root.

**Files synced:**
- `robots.txt`
- `sitemap.xml`
- `llms.txt`

**Usage:**

```bash
# From frontend directory
cd frontend
npm run sync-public

# Or run directly
bash scripts/sync-public-files.sh
```

**When to use:**
- After updating `robots.txt`, `sitemap.xml`, or `llms.txt` in `frontend/public/`
- Before committing changes to ensure root files are in sync
- As part of your deployment workflow

**Why sync?**
- **Source of truth:** `frontend/public/` (web-accessible)
- **Root copies:** For quick reference and some tools that expect them in root
- **Consistency:** Keeps both locations in sync

---

## Adding New Scripts

When adding new utility scripts:

1. Create script in `scripts/` directory
2. Make it executable: `chmod +x scripts/your-script.sh`
3. Add npm script in `frontend/package.json` if needed
4. Document it in this README

---

**Last Updated:** February 2, 2026
