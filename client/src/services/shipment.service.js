import api from './api';

const shipmentService = {
  create(data) {
    return api.post('/shipments', data);
  },
  getMine() {
    return api.get('/shipments/my');
  },
  getAll() {
    return api.get('/admin/shipments');
  },
  getById(id) {
    return api.get(`/shipments/${id}`);
  },
  track(id) {
    return api.get(`/shipments/track/${id}`);
  },
  assignDriver(id, driverId) {
    return api.post(`/admin/shipments/${id}/assign`, { driverId });
  },
  updateStatus(id, status) {
    return api.patch(`/driver/shipments/${id}/status`, { status });
  }
};

export default shipmentService;
