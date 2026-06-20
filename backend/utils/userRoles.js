/**
 * Normalises user role data across the two shapes that exist in the codebase:
 * - `user.roles` (array, multi-role support)
 * - `user.role` (string, legacy single-role)
 *
 * Always returns an array so callers can use `.includes()` uniformly.
 *
 * @param {object|null} user - req.user or a User document
 * @returns {string[]}
 */
export const getUserRoles = (user) =>
  user?.roles ?? (user?.role ? [user.role] : []);
