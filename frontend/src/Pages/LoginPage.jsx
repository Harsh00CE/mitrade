import React from 'react'
import { BASE_URL } from '../utils/constant';



const LoginPage = () => {
  const login = () => {
    window.location.href = `http://${BASE_URL}:3000/auth`;
  };

  const logout = () => {
    window.location.href = `http://${BASE_URL}:3000/logout`;
  };
  return (
    <div>
      <button onClick={login}>Login with Google</button>
    </div>
  )
}

export default LoginPage