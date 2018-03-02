/**
 * Converts date into 8/4/2017 2:05:00 PM format.
 * @param d date to transform
 */
export const dateToString = (d: Date) => `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;

/**
 * Transforms given date (date part) into SQL Server int format per sp_help_job spec.
 * @param dt date to transform
 */
export function dateToMSInt(dt: Date): number {
    const fy = dt.getFullYear() * 10000;
    const mo = (dt.getMonth() + 1) * 100;
    const da = dt.getDate();
    return fy + mo + da;
}

/**
 * Transforms given date (time part) into SQL Server int format per sp_help_job spec.
 * @param dt date to transform
 */
export function timeToMSInt(dt: Date): number {
    const hr = dt.getHours() * 10000;
    const mn = dt.getMinutes() * 100;
    const sc = dt.getSeconds();
    return hr + mn + sc;
}