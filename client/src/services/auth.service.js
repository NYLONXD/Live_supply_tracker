import api from './api';

const authService = {
  login(data) {
    return api.post('/auth/login', data);
  },
  signup(data) {
    return api.post('/auth/signup', data);
  },
  me() {
    return api.get('/auth/me');
  },
  logout() {
    return api.post('/auth/logout');
  },
};

export default authService;
