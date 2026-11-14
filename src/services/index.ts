import { config } from '@/config';
import { createApifootballDataSource } from './apifootball/apifootballDataSource';
import { mockDataSource } from './mockDataSource';
import type { FootballDataSource } from './types';

/**
 * Single entry point for data. Switches to apifootball.com automatically when a key is configured.
 * (The previous api-sports.io source is kept in ./api-football for reference.)
 */
export const footballApi: FootballDataSource = config.apiFootballKey
  ? createApifootballDataSource(config.apiFootballKey, config.featuredLeagueIds)
  : mockDataSource;

export type { FootballDataSource } from './types';
