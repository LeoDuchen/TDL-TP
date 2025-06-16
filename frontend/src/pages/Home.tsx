import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const storedCurrentUser = JSON.parse((localStorage.getItem('currentUser')) || ('null'));

  function handleLogout() {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const buttonStyle = { width: '150px' };

  const inputStyle = {
    padding: '10px',
    width: '150px',
    marginTop: '10px',
    marginBottom: '10px'
  };

  return (
    <div style={{ backgroundColor: '#e3e4e5', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Canchas y Fútbol</h1>

      {(storedCurrentUser) && (<button style={{ ...inputStyle, position: 'fixed', top: '20px', right: '20px', backgroundColor: '#ffaaaa'}} onClick={handleLogout}>
        Cerrar sesión
      </button>)}

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