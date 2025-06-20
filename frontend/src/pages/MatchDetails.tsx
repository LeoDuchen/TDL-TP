import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

type Match = {
  id: number;
  createdBy: number;
  location: string;
  description: string;
  date: string;
  hour: string;
  players: number[];
  maxPlayers: number;
};

type User = {
  id: number;
  username: string;
  name: string;
};

function MatchDetails() {
  const storedCurrentUser = JSON.parse((localStorage.getItem('currentUser')) || ('null'));

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [match, setMatch] = useState<Match | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    fetch(`http://localhost:3001/matches/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al obtener el partido.');
        }
        return response.json();
      })
      .then(setMatch)
      .catch(() => setError('Error desconocido al obtener el partido.'));

    fetch('http://localhost:3001/users')
      .then(response => response.json())
      .then(setUsers)
      .catch(() => setError('Error desconocido al obtener los usuarios.'));
  }, [id]);

  function handleJoinMatch() {
    if ((!match) || (!storedCurrentUser)) {
      return;
    }

    fetch(`http://localhost:3001/matches/${match.id}/join`, {
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
      });
  };

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
        {match.players.map(pid => {
          const user = users.find(u => u.id === pid);
          return <li key={pid}>{(user?.name) || ('Jugador desconocido.')}</li>;
        })}
      </ul>
      <div style={{ marginTop: '15px' }}>
        <button onClick={handleJoinMatch} style={{ marginRight: '10px' }}>
          Unirme
        </button>
        <button onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default MatchDetails;