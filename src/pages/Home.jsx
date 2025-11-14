import React from 'react';
import { Link } from 'react-router-dom';
export default function Home(){
  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-50'>
      <div className='max-w-2xl p-8 bg-white rounded shadow'>
        <h1 className='text-2xl font-bold mb-4'>SkillPramaan — Decentralized Certificates</h1>
        <p className='mb-4'>Welcome. Please <Link to='/login' className='text-blue-600'>login</Link> to access dashboard.</p>
        <div className='flex gap-2'>
          <Link to='/login' className='px-4 py-2 bg-teal-500 text-white rounded'>Login</Link>
          <a href='/'>Back to Home</a>
        </div>
      </div>
    </div>
  );
}
