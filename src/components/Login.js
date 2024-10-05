import React from 'react';

const Login = () => {
  const handleLogin = () => {
    // Implement your login logic here
  };

  return (
    <div className="login">
      <h2>Login to Spotify</h2>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;