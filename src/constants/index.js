/**
 * Application Constants
 */

export const ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  AGENT: 'agent',
};

export const DELIVERY_STATUS = {
  PENDING: 'pending',
  DELIVERED: 'delivered',
  SKIPPED: 'skipped',
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  STOPPED: 'stopped',
  DELETED: 'deleted',
};

export const REQUEST_TYPES = {
  EXTRA_MILK: 'extra_milk',
  MORNING_MILK: 'morning_milk',
  EVENING_MILK: 'evening_milk',
  PAUSE_DELIVERY: 'pause_delivery',
  CUSTOM: 'custom',
};

export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};
