import api from './api';

const driverService = {
  myDeliveries() {
    return api.get('/driver/shipments');
  },
  updateLocation(id, coords) {
    return api.post(`/driver/shipments/${id}/location`, coords);
  }
};

export default driverService;
    