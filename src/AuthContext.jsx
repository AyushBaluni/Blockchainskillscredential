import React, { createContext, useState, useEffect } from 'react';
export const AuthContext = createContext();
export function AuthProvider({ children }){
  const [user, setUser] = useState(() => {
    try{ return JSON.parse(localStorage.getItem('user')) || null }catch(e){ return null }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token')||null);
  useEffect(()=>{ if(user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user'); }, [user]);
  useEffect(()=>{ if(token) localStorage.setItem('token', token); else localStorage.removeItem('token'); }, [token]);
  return <AuthContext.Provider value={{ user, setUser, token, setToken }}>{children}</AuthContext.Provider>;
}
