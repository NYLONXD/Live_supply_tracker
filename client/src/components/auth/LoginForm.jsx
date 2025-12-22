import { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import authService from '../../services/auth.service';
import useAuthStore from '../../stores/authStore';

export default function LoginForm() {
  const { setUser, setToken } = useAuthStore();
  const [data, setData] = useState({ email:'', password:'' });

  const submit = async (e) => {
    e.preventDefault();
    const res = await authService.login(data);
    setUser(res.data.user);
    setToken(res.data.token);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="Email" onChange={e=>setData({...data,email:e.target.value})} />
      <Input label="Password" type="password" onChange={e=>setData({...data,password:e.target.value})} />
      <Button type="submit">Login</Button>
    </form>
  );
}
