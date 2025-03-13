import React from 'react'



const LoginPage = () => {
  const login = () => {
    window.location.href = "http://192.168.0.103:3000/auth";
  };

  const logout = () => {
    window.location.href = "http://192.168.0.103:3000/logout";
  };
  return (
    <div>
      <button onClick={login}>Login with Google</button>
    </div>
  )
}

export default LoginPage