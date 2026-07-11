import type { Check } from '../types.js';
import { ciChecks } from './ci.js';
import { contextChecks } from './context.js';
import { hookChecks } from './hooks.js';
import { hygieneChecks } from './hygiene.js';
import { sensorChecks } from './sensors.js';
import { skillChecks } from './skills.js';

export const ALL_CHECKS: Check[] = [
  ...contextChecks,
  ...skillChecks,
  ...hookChecks,
  ...sensorChecks,
  ...ciChecks,
  ...hygieneChecks,
];
