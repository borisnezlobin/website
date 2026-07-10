// Set on a device to keep the owner's own reads out of article view counts.
// Readable (not httpOnly) so the admin UI can reflect and toggle it; it only
// gates counting, so there's nothing to protect.
export const VIEW_EXCLUDE_COOKIE = "vc_exclude";
