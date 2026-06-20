import createError from 'http-errors';

/**
 * Asserts that a resource is owned by the given user.
 * Throws a 403 if the check fails; returns void on success.
 *
 * @param {object} resource - Mongoose document with an owner field
 * @param {string} ownerField - Field name on resource holding the owner ObjectId
 * @param {string|object} userId - The requesting user's _id
 * @param {string} [message] - Override the default error message
 */
export const assertOwner = (resource, ownerField, userId, message = 'Access denied') => {
  if (resource[ownerField].toString() !== userId.toString()) {
    throw createError(403, message);
  }
};
