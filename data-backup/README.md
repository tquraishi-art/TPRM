# Data Backup

This folder contains the original source files before data sanitization.

| File | Description | Date |
|---|---|---|
| `index_original_with_real_data.html` | Full TPRM platform with real company names, person names, SBR scores, SCA findings, and IRQ data | 2026-08-14 |

## What was sanitized

- 90+ real company names (suppliers, vendors, auditors)
- 50+ real person names (sourcing leads, owners)
- Specific SOW/contract numbers
- Internal location references
- Specific financial figures

## Restoring original data

To restore the original file:
```bash
cp data-backup/index_original_with_real_data.html index.html
```

## Re-running sanitization

To re-sanitize from the original:
```bash
cp data-backup/index_original_with_real_data.html index.html
python scripts/sanitize_data.py
```
