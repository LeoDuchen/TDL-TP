import { Link } from 'react-router-dom';

function Home() {
  const buttonStyle = { width: '150px' };

  return (
    <div style={{ backgroundColor: '#e3e4e5', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Canchas y Fútbol</h1>

      <div>
        <Link to="/login">
          <button style={buttonStyle}>
            Iniciar Sesión
          </button>
        </Link>

        <Link to="/register">
          <button style={{ ...buttonStyle, marginLeft: '20px' }}>
            Registrarse
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;