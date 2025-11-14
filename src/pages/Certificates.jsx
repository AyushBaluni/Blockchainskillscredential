import React, { useEffect, useState, useContext } from 'react';
import { listCertificates, revokeCertificate, downloadPDF } from '../utils/api';
import { AuthContext } from '../AuthContext';

export default function Certificates(){
  const [q, setQ] = useState('');
  const [data, setData] = useState({ total:0, page:1, limit:10, data:[] });
  const { token } = useContext(AuthContext);

  useEffect(()=>{ load(); },[]);

  async function load(p=1){
    const res = await listCertificates(q,p,10);
    setData(res);
  }

  async function revoke(id){
    if(!confirm('Revoke this certificate?')) return;
    const res = await revokeCertificate(id, token);
    alert(res.success ? 'Revoked' : (res.error||'Error'));
    load(data.page);
  }

  async function download(id){
    const blob = await downloadPDF(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = id + '.pdf'; document.body.appendChild(a); a.click();
    a.remove();
  }

  return (
    <div className='min-h-screen p-6 bg-slate-100'>
      <h1 className='text-xl font-bold mb-4'>Certificates</h1>
      <div className='mb-3'><input value={q} onChange={e=>setQ(e.target.value)} placeholder='Search...' className='p-2 border rounded'/> <button onClick={()=>load(1)} className='ml-2 px-3 py-1 bg-teal-500 text-white rounded'>Search</button></div>
      <div className='grid gap-3'>
        {data.data.map(c => (
          <div key={c.id} className='p-4 bg-white rounded shadow flex justify-between items-center'>
            <div>
              <div className='font-semibold'>{c.learnerName} — {c.course}</div>
              <div className='text-sm text-gray-500'>{c.id} • {new Date(c.issuedAt).toLocaleString()}</div>
            </div>
            <div className='flex gap-2'>
              <button onClick={()=>download(c.id)} className='px-3 py-1 bg-blue-600 text-white rounded'>PDF</button>
              <button onClick={()=>revoke(c.id)} className='px-3 py-1 bg-red-600 text-white rounded'>Revoke</button>
            </div>
          </div>
        ))}
      </div>
      <div className='mt-4 flex gap-2'>
        <button onClick={()=>load(Math.max(1,data.page-1))} className='px-3 py-1 bg-gray-200 rounded'>Prev</button>
        <div className='px-3 py-1 bg-white rounded'>Page {data.page}</div>
        <button onClick={()=>load(data.page+1)} className='px-3 py-1 bg-gray-200 rounded'>Next</button>
      </div>
    </div>
  );
}
