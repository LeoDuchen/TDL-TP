import React, { useState, useEffect } from 'react';

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

function Matches() {
  const storedCurrentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const [users, setUsers] = useState<{ id: number; username: string; name: string }[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newMatch, setNewMatch] = useState<Match>({
    id: 0,
    createdBy: storedCurrentUser.id,
    location: '',
    description: '',
    date: '',
    hour: '',
    players: [storedCurrentUser.id],
    maxPlayers: 10
  });

  const [error, setError] = useState<{ [matchId: number]: string }>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [matchesPerPage, setMatchesPerPage] = useState(5);

  const indexLastMatch = currentPage * matchesPerPage;
  const indexFirstMatch = indexLastMatch - matchesPerPage;
  const currentMatches = matches.slice(indexFirstMatch, indexLastMatch);
  const totalPages = Math.ceil(matches.length / matchesPerPage);

  function handlePageChange(pageNumber: number) {
    setCurrentPage(pageNumber);
    localStorage.setItem('currentPage', pageNumber.toString());
  };

  function handleMatchesPerPageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = Number(e.target.value);
    setMatchesPerPage(newValue);
    setCurrentPage(1);
    localStorage.setItem('matchesPerPage', newValue.toString());
  };

  useEffect(() => {
    fetch('http://localhost:3001/users')
      .then(res => res.json())
      .then(usersData => {
        setUsers(usersData);
      })
      .catch(error => {
        console.error('Error al obtener los usuarios:', error.message);
        setError(prev => ({
          ...prev,
          fetchUsers: (error.message) || ('Error desconocido al cargar los usuarios.')
        }));
      });
  }, []);

  useEffect(() => {
    const storedPerPage = localStorage.getItem('matchesPerPage');
    if (storedPerPage) {
      setMatchesPerPage(Number(storedPerPage));
    }

    const storedPage = localStorage.getItem('currentPage');
    if (storedPage) {
      setCurrentPage(Number(storedPage));
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentPage]);

  function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault();

    if ((newMatch.location) && (newMatch.date) && (newMatch.hour)) {
      fetch('http://localhost:3001/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMatch)
      })
        .then(res => res.json())
        .then(createdMatch => {
          setMatches(prevMatches => [...prevMatches, createdMatch]);
          setNewMatch({
            id: 0,
            createdBy: storedCurrentUser.id,
            location: '',
            description: '',
            date: '',
            hour: '',
            players: [storedCurrentUser.id],
            maxPlayers: 10
          });
          setIsCreating(false);
        })
        .catch(error => {
          console.error('Error al crear el partido:', error.message);
          setError(prev => ({
            ...prev,
            createMatch: (error.message) || ('Error desconocido al crear el partido.')
          }));
        });
    }
  }

  useEffect(() => {
    fetch('http://localhost:3001/matches')
      .then(res => res.json())
      .then(matches => {
        console.log('Partidos desde el backend:', matches);
        setMatches(matches);
      })
      .catch(error => {
        console.error('Error al obtener los partidos:', error.message);
        setError(prev => ({
          ...prev,
          fetchMatches: (error.message) || ('Error desconocido al cargar los partidos.')
        }));
      });
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setNewMatch((prev) => ({
      ...prev,
      [name]: name === "maxPlayers" ? Number(value) : value
    }));
  };

  function handleJoinMatch(matchId: number) {
    const match = matches.find(m => m.id === matchId);

    if (!match) {
      return;
    }

    const newError: { [matchId: number]: string } = {};

    if (match.players.includes(storedCurrentUser.id)) {
      newError[matchId] = 'Ya estás anotado en este partido.'; 
      setError(newError);
      return;
    }

    if (match.players.length >= match.maxPlayers) {
      newError[matchId] = 'El partido está lleno.';
      setError(newError);
      return;
    }

    fetch(`http://localhost:3001/matches/${matchId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: storedCurrentUser.id })
    })
      .then(res => {
        if (!res.ok) {
          return res.text().then(msg => { throw new Error(msg); });
        }
        return res.json();
      })
      .then(updatedMatch => {
        const updatedMatches = matches.map(m => (m.id === matchId ? updatedMatch : m));
        setMatches(updatedMatches);
        setError(prev => {
          const newErrors = { ...prev };
          delete newErrors[matchId];
          return newErrors;
        });
      })
      .catch(error => {
        console.error('Error al unire al partido:', error.message);
        setError(prev => ({
          ...prev,
          joinMatch: (error.message) || ('Error desconocido al unirse al partido.')
        }));
      });
  }

  const cardStyle = {
    backgroundColor: '#ffffff',
    padding: '20px',
    margin: '10px',
    borderRadius: '10px',
    boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
    width: '300px'
  };

  const inputStyle = {
    padding: '10px',
    width: '150px',
    marginTop: '10px',
    marginBottom: '10px'
  };

  return (
    <div style={{ backgroundColor: '#e3e4e5', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Partidos Disponibles</h1>

      <button style={{ ...inputStyle, marginBottom: '20px' }} onClick={() => setIsCreating(isCreating ? false : true)}>
        Crear partido
      </button>

      {isCreating && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <h2>Crear Partido</h2>
          <form onSubmit={handleCreateMatch}>
            <div>
              <input
                type="text"
                placeholder="Dirección"
                name="location"
                value={newMatch.location}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Descripción del partido"
                name="description"
                value={newMatch.description}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <input
                type="date"
                name="date"
                value={newMatch.date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <input
                type="time"
                name="hour"
                value={newMatch.hour}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <input
                type="number"
                name="maxPlayers"
                value={newMatch.maxPlayers}
                onChange={handleInputChange}
                min={10}
                max={22}
                step={2}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={inputStyle}>
                Crear
              </button>
              <button type="button" style={inputStyle} onClick={() => setIsCreating(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {matches.length === 0 && <p>No hay partidos disponibles.</p>}

      {currentMatches.map((match) => (
        <div key={match.id} style={cardStyle}>
          <p><strong>Publicado por:</strong> {users.find(u => u.id === Number(match.createdBy))?.name || 'Usuario desconocido'}</p>
          <p><strong>Dirección:</strong> {match.location}</p>
          <p><strong>Descripción:</strong> {match.description}</p>
          <p><strong>Fecha:</strong> {match.date}</p>
          <p><strong>Hora:</strong> {match.hour}</p>
          <p><strong>Jugadores:</strong> {match.players.length} / {match.maxPlayers}</p>
          <div style={{ textAlign: 'left'}}>
            <strong>Anotados:</strong>
            <ul style={{ paddingLeft: '15px', margin: '5px' }}>
              {match.players.map((playerId) => {
                const user = users.find(u => u.id === Number(playerId));
                return (
                  <li key={playerId}>
                    {user ? user.name : 'Jugador desconocido.'}
                  </li>
                );
              })}
            </ul>
          </div>
          <button style={{ ...inputStyle, backgroundColor: '#efefef' }} onClick={() => handleJoinMatch(match.id)}>
            Unirme
          </button>
          {error[match.id] && (
            <div style={{ color: 'red', marginTop: '5px' }}>
              {error[match.id]}
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: '10px' }}>
        <select 
          onChange={handleMatchesPerPageChange}
          value={matchesPerPage}
          style={{
            padding: '10px',
            width: '160px',
            marginTop: '10px',
            marginBottom: '10px',
            borderRadius: '5px',
            textAlign: 'center',
          }}>
          <option value={5}>Mostrar 5 partidos</option>
          <option value={10}>Mostrar 10 partidos</option>
          <option value={20}>Mostrar 20 partidos</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {currentPage > 1 && (
          <button onClick={() => handlePageChange(currentPage - 1)} style={inputStyle}>
            Anterior
          </button>
        )}

        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i + 1} onClick={() => handlePageChange(i + 1)} style={{ ...inputStyle, backgroundColor: currentPage === i + 1 ? '#cccccc' : 'white', width: '40px' }}>
            {i + 1}
          </button>
        ))}

        {(indexLastMatch < matches.length) && (
          <button onClick={() => handlePageChange(currentPage + 1)} style={inputStyle}>
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}

export default Matches;