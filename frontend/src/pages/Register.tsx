import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [name, setName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  interface User {
    id: number;
    name: string;
    lastName: string;
    username: string;
    password: string;
    email: string;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (name && lastName && username && password && email) {
      const newUser: User = { id: 0, name, lastName, username, password, email };

      let savedUsers = JSON.parse(localStorage.getItem('users') || '[]');

      if (savedUsers.some((user: User) => (user.username === username))) {
        setError('Nombre de usuario ya está en uso.');
      } else if (savedUsers.some((user: User) => (user.email === email))) {
        setError('Email ya está en uso.');
      } else {
        savedUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(savedUsers));

        navigate('/');
      }
    } else {
      setError('Falta completar todos los campos.');
    }
  };

  function handleBack() {
    navigate('/');
  };

  const inputStyle = { width: '150px', padding: '10px', marginBottom: '10px' };

  return (
    <div style={{ backgroundColor: '#e3e4e5', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2>Registro</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <div>
          <input 
            type="text" 
            placeholder="Nombre" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required
            style={inputStyle}
          />
        </div>
        <div>
          <input 
            type="text" 
            placeholder="Apellido" 
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)} 
            required
            style={inputStyle}
          />
        </div>
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
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            style={inputStyle}
          />
        </div>
        
        <div>
          <button type="submit" style={inputStyle}>
            Registrarse
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
}

export default Register;