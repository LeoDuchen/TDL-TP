import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if ((!username) || (!password)) {
      setError('Falta completar todos los campos.');
      return;
    }

    fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          setError((data.error) || ('Error al iniciar sesión.'));
          throw new Error((data.error) || ('Error al iniciar sesión.'));
        }
        return response.json();
      })
      .then((data) => {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        navigate('/matches');
      })
      .catch((error) => {
        console.error('Error de conexión:', error.message);
        setError((error.message) || ('Error al conectar con el servidor.'));
      });
  }

  function handleBack() {
    navigate('/');
  };

  const inputStyle = { 
    width: '150px',
    padding: '10px',
    marginBottom: '10px'
  };

  return (
    <div style={{ backgroundColor: '#e3e4e5', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <div>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            required
            style={inputStyle}
          />
        </div>
        
        <div>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            required
            style={inputStyle}
          />
        </div>
        
        <div>
          <button type="submit" style={inputStyle}>
            Iniciar sesión
          </button>
        </div>

        <div>
          <button type="button" style={inputStyle} onClick={handleBack}>
            Volver
          </button>
        </div>
      </form>
      
      {error && (
        <div style={{ color: 'red', fontWeight: 'bold', marginTop: '10px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default Login;