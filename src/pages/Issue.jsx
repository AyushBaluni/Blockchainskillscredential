import React, { useState, useContext } from 'react';
import { issueCertificate } from '../utils/api';
import { AuthContext } from '../AuthContext';

export default function Issue(){
  const [learnerName,setLearnerName]=useState('');
  const [course,setCourse]=useState('');
  const { token, user } = useContext(AuthContext);

  async function submit(e){
    e.preventDefault();
    const res = await issueCertificate({ learnerName, course, issuedBy: user?.name||user?.email }, token);
    if(res.certificate){
      alert('Issued: '+res.certificate.id);
    }else{
      alert(res.error||'Error');
    }
  }

  return (
    <div className='min-h-screen p-6 bg-slate-100'>
      <div className='max-w-xl bg-white p-6 rounded shadow'>
        <h2 className='text-xl font-bold mb-3'>Issue Certificate</h2>
        <form onSubmit={submit}>
          <label className='block mb-2'>Learner Name</label>
          <input value={learnerName} onChange={e=>setLearnerName(e.target.value)} className='w-full p-2 border rounded mb-3' />
          <label className='block mb-2'>Course</label>
          <input value={course} onChange={e=>setCourse(e.target.value)} className='w-full p-2 border rounded mb-3' />
          <button className='px-4 py-2 bg-teal-500 text-white rounded'>Issue</button>
        </form>
      </div>
    </div>
  );
}
