import type { League } from '@/types/football';

// IDs mirror API-Football's league IDs so switching to the real API keeps everything stable.
export const leagues = {
  saudi: { id: 307, name: 'دوري روشن السعودي', country: 'السعودية', season: 2026 },
  premier: { id: 39, name: 'الدوري الإنجليزي الممتاز', country: 'إنجلترا', season: 2026 },
  laliga: { id: 140, name: 'الدوري الإسباني', country: 'إسبانيا', season: 2026 },
} satisfies Record<string, League>;
