import api from './api';

const adminService = {
  getUsers() {
    return api.get('/admin/users');
  },
  getDrivers() {
    return api.get('/admin/drivers');
  },
  promoteToDriver(userId) {
    return api.patch(`/admin/users/${userId}/promote`);
  },
  demoteDriver(driverId) {
    return api.patch(`/admin/drivers/${driverId}/demote`);
  },
  analytics() {
    return api.get('/admin/analytics');
  }
};

export default adminService;
