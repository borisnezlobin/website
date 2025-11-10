export function listToString(list: string[], separator: string = ", ", lastSeparator: string = " and "): string {
    if (list.length === 0) return "";
    if (list.length === 1) return list[0];
    if (list.length === 2) return list[0] + lastSeparator + list[1];
    
    return list.slice(0, -1).join(separator) + separator + lastSeparator + list[list.length - 1];
}