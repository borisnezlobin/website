import { VIEW_EXCLUDE_COOKIE } from "./view-config";

const FIVE_YEARS = 60 * 60 * 24 * 365 * 5;

export const isViewExcluded = () =>
    typeof document !== "undefined" &&
    document.cookie.split("; ").includes(`${VIEW_EXCLUDE_COOKIE}=1`);

export const setViewExcluded = (on: boolean) => {
    document.cookie = on
        ? `${VIEW_EXCLUDE_COOKIE}=1; path=/; max-age=${FIVE_YEARS}; samesite=lax`
        : `${VIEW_EXCLUDE_COOKIE}=; path=/; max-age=0; samesite=lax`;
};
