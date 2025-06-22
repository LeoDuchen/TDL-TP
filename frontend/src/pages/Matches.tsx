import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

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
  link: string;
};

async function validateLocation(location: string): Promise<boolean> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TDL-TP/1.0 (https://github.com/LeoDuchen/TDL-TP)'
      }
    });

    const data = await response.json();
    return data.length > 0;
  } catch (error) {
    console.error("Error validando la dirección:", error);
    return false;
  }
}

function Matches() {
  const storedCurrentUser = JSON.parse((localStorage.getItem('currentUser')) || ('null'));
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('currentUser');
    navigate('/');
  };
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newMatch, setNewMatch] = useState<Match>({
    id: 0,
    createdBy: storedCurrentUser.id,
    location: '',
    description: '',
    date: '',
    hour: '',
    players: [{ id: storedCurrentUser.id, name: storedCurrentUser.name }],
    maxPlayers: 10,
    link: ''
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

  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault();

    if ((newMatch.location) && (newMatch.date) && (newMatch.hour)) {
      const validLocation = await validateLocation(newMatch.location);

      if (!validLocation) {
        setError(prev => ({
          ...prev,
          createMatch: 'La dirección ingresada no es válida o no fue encontrada.'
        }));
        return;
      }

      fetch('http://localhost:3001/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMatch)
      })
        .then(response => response.json())
        .then(createdMatch => {
          setMatches(prevMatches => [...prevMatches, createdMatch]);
          setNewMatch({
            id: 0,
            createdBy: storedCurrentUser.id,
            location: '',
            description: '',
            date: '',
            hour: '',
            players: [{ id: storedCurrentUser.id, name: storedCurrentUser.name }],
            maxPlayers: 10,
            link: ''
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
      .then(response => response.json())
      .then(matches => {
        console.log('Partidos desde el backend:', matches);
        setMatches(matches);
      })
      .catch(error => {
        console.error('Error al obtener los partidos:', error.message);
        setError(prev => ({
          ...prev,
          fetchMatches: (error.message) || ('Error desconocido al obtener los partidos.')
        }));
      });
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    
    if (name === 'location') {
      setError(prev => {
        const newError = { ...prev };
        delete (newError as any)['createMatch'];
        return newError;
      });
    }

    setNewMatch((prev) => ({
      ...prev,
      [name]: name === "maxPlayers" ? Number(value) : value
    }));
  };

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

      <button style={{ ...inputStyle, position: 'fixed', top: '20px', right: '20px', backgroundColor: '#ffaaaa'}} onClick={handleLogout}>
        Cerrar sesión
      </button>

      <button style={{ ...inputStyle, marginBottom: '20px' }} onClick={() => setIsCreating(isCreating ? false : true)}>
        Crear partido
      </button>

      {Object.values(error).map((errorMessage, index) => (
        <div key={index} style={{ color: 'red', fontWeight: 'bold', marginTop: '10px' }}>
          {errorMessage}
        </div>
      ))}

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

      {(matches.length === 0) && (<p>No hay partidos disponibles.</p>)}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '20px',
          maxWidth: '960px',
        }}
      >
        {currentMatches.map((match) => (
          <Link
            key={match.id}
            to={`/matches/${match.link}`}
            style={{
              ...cardStyle,
              width: '280px',
              cursor: 'pointer',
              textDecoration: 'none',
              color: 'inherit',
              boxSizing: 'border-box',
            }}
          >
            <p><strong>Dirección:</strong> {match.location}</p>
            <p><strong>Fecha:</strong> {match.date}</p>
            <p><strong>Jugadores:</strong> {match.players.length}/{match.maxPlayers}</p>
          </Link>
        ))}
      </div>

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
          }}
        >
          <option value={6}>Mostrar 6 partidos</option>
          <option value={12}>Mostrar 12 partidos</option>
          <option value={24}>Mostrar 24 partidos</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {currentPage > 1 && (
          <button style={inputStyle} onClick={() => handlePageChange(currentPage - 1)}>
            Anterior
          </button>
        )}

        {Array.from({ length: totalPages }, (_, i) => (
          <button style={{ ...inputStyle, backgroundColor: currentPage === i + 1 ? '#cccccc' : 'white', width: '40px' }} key={i + 1} onClick={() => handlePageChange(i + 1)}>
            {i + 1}
          </button>
        ))}

        {(indexLastMatch < matches.length) && (
          <button style={inputStyle} onClick={() => handlePageChange(currentPage + 1)}>
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}

export default Matches;