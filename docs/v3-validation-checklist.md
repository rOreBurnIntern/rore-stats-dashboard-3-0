# Phase 7: V3 Regression Validation Checklist

Date: 2026-03-06

1. Motherlode history reset logic is deterministic and unit tested.
2. Pagination fetches until upstream end and deduplicates repeated rounds.
3. Client consumes only local proxy endpoint (`/api/stats`) to avoid direct CORS dependence.
4. Data shape drift is handled via key normalization with stable response envelope.
5. Block win chart always renders 25 bins (1-25), including zero counts.
6. Loading, empty, and error states are explicitly implemented.
7. Chart instances are destroyed before re-render to avoid init race leaks.
8. Upstream timeout/retry and controlled 502 error payload are implemented.
