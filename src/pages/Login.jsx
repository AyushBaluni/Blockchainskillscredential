import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api';
import { AuthContext } from '../AuthContext';

export default function Login(){
  const [email,setEmail]=useState('admin@skill.com');
  const [password,setPassword]=useState('admin123');
  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  async function submit(e){
    e.preventDefault();
    const res = await login(email,password);
    if(res.token){
      setUser(res.user); setToken(res.token);
      navigate('/dashboard');
    }else{
      alert(res.error || 'Login failed');
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-50'>
      <form onSubmit={submit} className='p-6 bg-white rounded shadow w-96'>
        <h2 className='text-xl font-bold mb-4'>Login</h2>
        <label className='block mb-2'>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} className='w-full p-2 border rounded mb-3' />
        <label className='block mb-2'>Password</label>
        <input type='password' value={password} onChange={e=>setPassword(e.target.value)} className='w-full p-2 border rounded mb-3' />
        <button className='px-4 py-2 bg-teal-500 text-white rounded'>Login</button>
      </form>
    </div>
  );
}
