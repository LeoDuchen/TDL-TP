import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type User = {
  name: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
};

// Usuarios hardcodeados, borrar después.
const hardcodedUsers: User[] = [
  { name: 'Pepe', lastName: 'Juan', username: 'pepe', password: '123', email: 'pepe@gmail.com' },
  { name: 'Nombre', lastName: 'Apellido', username: 'usuario', password: 'contraseña', email: 'usuario@contraseña'}
];

function Login() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const storedUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');

    const allUsers = [...hardcodedUsers, ...storedUsers]; // Usuarios hardcodeados, borrar después.

    //const user = storedUsers.find((user) => (user.username === username) && (user.password === password));
    const user = allUsers.find((user) => (user.username === username) && (user.password === password)); // Borrar y reemplazar por primer línea.

    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      navigate('/matches');
    } else {
      setError('Usuario o contraseña incorrectos.');
    }
  };

  function handleBack() {
    navigate('/');
  };

  const inputStyle = { width: '150px', padding: '10px', marginBottom: '10px' };

  return (
    <div style={{ backgroundColor: '#e3e4e5', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <div>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        
        <div>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        <div style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default Login;