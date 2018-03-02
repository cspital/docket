/**
 * Represents anything with a name.
 */
export interface Named {
    name: string;
}

/**
 * Requests notification capabilities if new user.
 */
export function requestNotify() {
    if (Notification) {
        Notification.requestPermission();
    }
}

/**
 * Notifies client that a monitored item failed.
 * @param job item that failed
 */
export function notify(job: Named): Notification | null {
    if (Notification) {
        return new Notification(`${job.name} failed!`);
    }
    return null;
}