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

  const [coordinates, setCoordinates] = useState<{ lat: string, lon: string } | null>(null);

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

  useEffect(() => {
    if (!match?.location) {
      return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(match.location)}`)
      .then(res => res.json())
      .then(data => {
        if ((data) && (data.length > 0)) {
          setCoordinates({ lat: data[0].lat, lon: data[0].lon });
        }
      })
      .catch(error => console.error('Error localizando la dirección:', error));
  }, [match?.location]);

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
    if (!match) {
      return;
    }

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

  function handleRemovePlayer(player: { id: number | null; name: string }) {
    if (!match) {
      return;
    }

    fetch(`http://localhost:3001/matches/${match.link}/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(player.id !== null ? { userId: player.id } : { guestName: player.name }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error((errorData.error) || ('Error al eliminar el jugador.'));
        }
        return response.json();
      })
      .then(updatedMatch => {
        setMatch(updatedMatch);
        setError(null);
      })
      .catch(error => {
        console.error('Error al eliminar el jugador:', error.message);
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
      <p><strong>Dirección:</strong> {match.location}</p>
      <p><strong>Descripción:</strong> {match.description}</p>
      <p><strong>Fecha:</strong> {match.date}</p>
      <p><strong>Hora:</strong> {match.hour}</p>
      <p><strong>Jugadores:</strong> {match.players.length}/{match.maxPlayers}</p>
      <ul style={{ paddingLeft: '20px' }}>
        {match.players.map((player, index) => (
          <li key={index} style={{ marginBottom: '8px' }}>
            <span style={{ marginRight: '10px' }}>{player.name}</span>
            {(storedCurrentUser?.id === match.createdBy) && (
              <button
                style={{
                  cursor: 'pointer',
                  backgroundColor: '#ffaaaa',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '1px 6px',
                }}
                onClick={() => handleRemovePlayer(player)}
              >
                Eliminar
              </button>
            )}
          </li>
        ))}
      </ul>

      {(coordinates) && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '400px',
            height: '430px',
            borderRadius: '10px',
            boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
            zIndex: 1000,
            backgroundColor: '#f9f9f9',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <iframe
            width="100%"
            height="400px"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(coordinates.lon) - 0.003}%2C${parseFloat(coordinates.lat) - 0.003}%2C${parseFloat(coordinates.lon) + 0.003}%2C${parseFloat(coordinates.lat) + 0.003}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lon}`}
            style={{ borderRadius: '10px 10px 0 0' }}
          />
          <a
            href={`https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textAlign: 'center'
            }}
          >
            Ver en OpenStreetMap
          </a>
        </div>
      )}

      <div>
        <button onClick={handleJoinMatch} style={{ marginRight: '10px', width: '100px' }}>
          Unirme
        </button>
        
        <button onClick={() => navigate('/matches')} style= {{ width: '100px' }}>
          Volver
        </button>
      </div>

      {(isGuestJoining) && (
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

        {(copied) && (
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

      {(error) && (
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