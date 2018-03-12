import { RunState } from '../model/job';

export type StatusCSS = 'status-running' | 'status-pass' | 'status-fail';
/**
 * Converts a Status to its CSS class string.
 * @param stat job Status
 */
export function getStatus(stat: RunState): StatusCSS {
    switch (stat) {
        case 'Running':
            return 'status-running';
        case 'Succeeded':
            return 'status-pass';
        default:
            return 'status-fail';
    }
}