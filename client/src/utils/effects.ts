import { RunState } from '../model/job';

/**
 * Fades element out over 250ms.
 * @param el target element
 */
export async function fadeOut(el: HTMLElement): Promise<void> {
    if (el.classList.contains('fade-in')) {
        el.classList.remove('fade-in');
    }
    el.classList.add('fade-out');
    return new Promise<void>(resolve => setTimeout(() => resolve(), 260));
}

/**
 * Fades element in over 250ms.
 * @param el target element
 */
export function fadeIn(el: HTMLElement): Promise<void> {
    if (el.classList.contains('fade-out')) {
        el.classList.remove('fade-out');
    }
    el.classList.add('fade-in');
    return new Promise<void>(resolve => setTimeout(() => resolve(), 260));
}

/**
 * Fades out an HTML element and performs the callback before fading back in.
 * @param el Element to fade
 * @param cb Action to take
 */
export async function fadeWith(el: HTMLElement, cb: (() => void) | null): Promise<void> {
    await fadeOut(el);
    if (cb) {
        cb();
    }
    fadeIn(el);
}

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