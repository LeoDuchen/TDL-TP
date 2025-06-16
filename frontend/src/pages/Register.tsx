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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if ((!name) || (!lastName) || (!username) || (!password) || (!email)) {
      setError('Falta completar todos los campos.');
      return;
    }

    fetch('http://localhost:3001/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, lastName, username, password, email }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          setError((data.error) || 'Error al registrar.');
          throw new Error((data.error) || 'Error al registrar.');
        }
        return response.json();
      })
      .then(() => {
        navigate('/');
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