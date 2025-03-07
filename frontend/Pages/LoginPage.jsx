import React from 'react'



const LoginPage = () => {
  const login = () => {
    window.location.href = "http://localhost:3000/auth";
  };

  const logout = () => {
    window.location.href = "http://localhost:3000/logout";
  };
  return (
    <div>
      <button onClick={login}>Login with Google</button>
    </div>
  )
}

export default LoginPage