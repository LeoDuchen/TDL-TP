import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

type Player = {
  id: number | null;
  name: string;
};

type Match = {
  id: number;
  createdBy: number;
  location: string;
  description: string;
  date: string;
  hour: string;
  players: Player[];
  maxPlayers: number;
  link: string
};

function MatchDetails() {
  const storedCurrentUser = JSON.parse((localStorage.getItem('currentUser')) || ('null'));

  const { link } = useParams<{ link: string }>();
  const navigate = useNavigate();

  const [match, setMatch] = useState<Match | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [errorVisible, setErrorVisible] = useState(false);

  const [copied, setCopied] = useState(false);
  const [copiedVisible, setCopiedVisible] = useState(false);

  const [guestName, setGuestName] = useState<string>('');
  const [isGuestJoining, setIsGuestJoining] = useState(false);

  useEffect(() => {
    if (!link) {
      return;
    }

    fetch(`http://localhost:3001/matches/${link}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al obtener el partido.');
        }
        return response.json();
      })
      .then(setMatch)
      .catch(() => setError('Error desconocido al obtener el partido.'));
  }, [link]);

  function handleJoinMatch() {
    if (!match) {
      return;
    }

    if (storedCurrentUser) {
      fetch(`http://localhost:3001/matches/${match.link}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: storedCurrentUser.id })
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error((errorData.error) || ('Error desconocido al unirse al partido.'));
        }
        return response.json();
      })
      .then(updatedMatch => {
        setMatch(updatedMatch);
        setError(null);
      })
      .catch(error => {
        console.error('Error al unirse al partido:', error.message);
        setError(error.message);
        setErrorVisible(true);
        setTimeout(() => setErrorVisible(false), 2000);
        setTimeout(() => setError(null), 2500);
      });
    } else {
      setIsGuestJoining(true);
    }
  };

  function handleGuestJoinMatch() {
    if (!guestName.trim()) {
      setError('Debes ingresar un nombre válido.');
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 2000);
      setTimeout(() => setError(null), 2500);
      return;
    }

    fetch(`http://localhost:3001/matches/${match?.link}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: guestName.trim() }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error((errorData.error) || ('Error desconocido al unirse al partido.'));
        }
        return response.json();
      })
      .then(updatedMatch => {
        setMatch(updatedMatch);
        setError(null);
        setIsGuestJoining(false);
        setGuestName('');
      })
      .catch(error => {
        console.error('Error al unirse al partido:', error.message);
        setError(error.message);
        setErrorVisible(true);
        setTimeout(() => setErrorVisible(false), 2000);
        setTimeout(() => setError(null), 2500);
      });
  }

  if (!match) {
    return (
      <div
        style={{
          backgroundColor: '#e3e4e5',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}
      >
        No existe este partido.
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#e3e4e5', minHeight: '100vh', width: '100vw', flexDirection: 'column', padding: '20px' }}>
      <h2>Detalles del Partido</h2>
      <p><strong>Ubicación:</strong> {match.location}</p>
      <p><strong>Descripción:</strong> {match.description}</p>
      <p><strong>Fecha:</strong> {match.date}</p>
      <p><strong>Hora:</strong> {match.hour}</p>
      <p><strong>Jugadores:</strong> {match.players.length}/{match.maxPlayers}</p>
      <ul style={{ margin: '20px', padding: 0 }}>
        {match.players.map((player, index) => (
          <li key={index}>{player.name}</li>
        ))}
      </ul>
      <div style={{ marginTop: '15px' }}>
        <button onClick={handleJoinMatch} style={{ marginRight: '10px', width: '100px' }}>
          Unirme
        </button>
        
        <button onClick={() => navigate('/matches')} style= {{ width: '100px' }}>
          Volver
        </button>
      </div>

      {isGuestJoining && (
        <div style={{ marginTop: '10px' }}>
          <input
            type="text"
            placeholder="Ingresa tu nombre"
            value={guestName}
            onChange={e => { setGuestName(e.target.value); setError(''); }}
            style={{ padding: '10px', marginRight: '10px', width: '190px'}}
          />

          <button onClick={handleGuestJoinMatch} style={{ padding: '10px', width: '100px', marginRight: '10px' }}>
            Confirmar
          </button>

          <button onClick={() => { setIsGuestJoining(false); setGuestName(''); }} style={{ padding: '10px', width: '100px' }}>
            Cancelar
          </button>
        </div>
      )}

      <div style={{ marginTop: '10px' }}>
        <button
          onClick={() => {
            if (match) {
              const url = `${window.location.origin}/matches/${match.link}`;
              navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setCopiedVisible(true);
                setTimeout(() => setCopiedVisible(false), 2000);
                setTimeout(() => setCopied(false), 2500);
              });
            }
          }}
          style={{ width: '210px' }}
        >
          Compartir
        </button>

        {copied && (
          <div
            style={{
              color: 'green',
              fontWeight: 'bold',
              marginTop: '10px',
              opacity: copiedVisible ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out'
            }}
          >
            ¡Link del partido copiado!
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            color: 'red',
            fontWeight: 'bold',
            marginTop: '10px',
            opacity: errorVisible ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default MatchDetails;