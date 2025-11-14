import React, { useEffect, useState, useContext } from 'react';
import { getStats } from '../utils/api';
import { AuthContext } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function Dashboard(){
  const [stats, setStats] = useState({ totalCertificates:0, revokedCertificates:0, totalUsers:0 });
  const { user, setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(()=>{ getStats().then(setStats); },[]);

  function logout(){ setUser(null); setToken(null); navigate('/'); }

  const data = [
    { name:'Day 1', certificates: 10 },
    { name:'Day 2', certificates: 20 },
    { name:'Day 3', certificates: 15 },
    { name:'Day 4', certificates: 30 },
  ];

  return (
    <div className='min-h-screen p-6 bg-slate-100'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-xl font-bold'>Dashboard</h1>
        <div className='flex gap-2 items-center'>
          <span>{user?.name}</span>
          <button onClick={logout} className='px-3 py-1 bg-red-500 text-white rounded'>Logout</button>
        </div>
      </div>
      <div className='grid grid-cols-3 gap-4 mb-6'>
        <div className='p-4 bg-white rounded shadow'><h3>Total Certificates</h3><p className='text-2xl'>{stats.totalCertificates}</p></div>
        <div className='p-4 bg-white rounded shadow'><h3>Revoked</h3><p className='text-2xl'>{stats.revokedCertificates}</p></div>
        <div className='p-4 bg-white rounded shadow'><h3>Users</h3><p className='text-2xl'>{stats.totalUsers}</p></div>
      </div>
      <div className='p-4 bg-white rounded shadow mb-6'>
        <h3 className='mb-2'>Certificates over time</h3>
        <ResponsiveContainer width='100%' height={200}><LineChart data={data}><XAxis dataKey='name'/><YAxis/><Tooltip/><Line dataKey='certificates' stroke='#14b8a6' /></LineChart></ResponsiveContainer>
      </div>
      <div className='flex gap-2'>
        <Link to='/issue' className='px-4 py-2 bg-teal-500 text-white rounded'>Issue Certificate</Link>
        <Link to='/certificates' className='px-4 py-2 bg-slate-700 text-white rounded'>View Certificates</Link>
      </div>
    </div>
  );
}
