import {
  ADMIN,
  checkDelegatingRoles,
  createDelegatingRoles,
  MINTER,
  TRANSFER_AGENT,
} from '../../../helpers/AccessHelper';

describe('check delegating roles', () => {
  checkDelegatingRoles('Admin', ADMIN, {
    createDelegatingRoles,
    isInRole: (roles, role) => roles.isAdmin(role),
    forRole: (roles, options) => roles.forAdmin(options),
    addToRole: (roles, role, options) => roles.addAdmin(role, options),
  });

  checkDelegatingRoles('Minter', MINTER, {
    createDelegatingRoles,
    isInRole: (roles, role) => roles.isMinter(role),
    forRole: (roles, options) => roles.forMinter(options),
    addToRole: (roles, role, options) => roles.addMinter(role, options),
  });

  checkDelegatingRoles('Transfer Agent', TRANSFER_AGENT, {
    createDelegatingRoles,
    isInRole: (roles, role) => roles.isTransferAgent(role),
    forRole: (roles, options) => roles.forTransferAgent(options),
    addToRole: (roles, role, options) => roles.addTransferAgent(role, options),
  });
});
