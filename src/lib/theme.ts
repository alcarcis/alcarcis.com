/**
 * The localStorage key that holds a theme override. The toggle script imports it, and the
 * pre-paint inline script in BaseLayout receives it through `define:vars` because an inline
 * script cannot import modules, so both read and write the same entry.
 */
export const themeStorageKey = "theme";
