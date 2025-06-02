import React, { useState, useEffect } from 'react';

type Match = {
  id: number;
  createdBy: string;
  location: string;
  date: string;
  hour: string;
  players: string[];
};

function Matches() {
  const storedCurrentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const storedCurrentName = storedCurrentUser?.name || 'defaultUser';

  const [matches, setMatches] = useState<Match[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newMatch, setNewMatch] = useState<Match>({
    id: 0,
    createdBy: storedCurrentName,
    location: '',
    date: '',
    hour: '',
    players: [storedCurrentName]
  });

  useEffect(() => {
    const storedMatches = JSON.parse(localStorage.getItem('matches') || '[]');
    setMatches(storedMatches);
  }, []);

  function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault();
    
    if (newMatch.location && newMatch.date && newMatch.hour) {
      const newId = Math.max(0, ...matches.map(m => m.id)) + 1;
      const matchToSave = { ...newMatch, id: newId };
      const updatedMatches = [...matches, matchToSave];
      setMatches(updatedMatches);
      localStorage.setItem('matches', JSON.stringify(updatedMatches));
      setNewMatch({ id: 0, createdBy: '', location: '', date: '', hour: '', players: [] });
      setIsCreating(false);
    }
  };

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setNewMatch((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  function handleJoinMatch(matchId: number) {
    const updatedMatches = matches.map(match => {
      if ((match.id === matchId) && (!match.players.includes(storedCurrentName))) {
        return {
          ...match,
          players: [...match.players, storedCurrentName]
        };
      }
      return match;
    });

    setMatches(updatedMatches);
    localStorage.setItem('matches', JSON.stringify(updatedMatches));
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

      <button style={{ ...inputStyle, marginBottom: '20px' }} onClick={() => setIsCreating(prev => !prev)}>
        Crear partido
      </button>

      {isCreating && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <h2>Crear Partido</h2>
          <form onSubmit={handleCreateMatch}>
            <div>
              <input
                type="text"
                placeholder="Ubicación"
                name="location"
                value={newMatch.location}
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

      {matches.map((match) => (
        <div key={match.id} style={cardStyle}>
          <p><strong>Publicado por:</strong> {match.createdBy}</p>
          <p><strong>Ubicación:</strong> {match.location}</p>
          <p><strong>Fecha:</strong> {match.date}</p>
          <p><strong>Hora:</strong> {match.hour}</p>
          <p><strong>Jugadores:</strong> {match.players.length} / 10</p>
          <button style={inputStyle} onClick={() => handleJoinMatch(match.id)}>
            Unirme
          </button>
        </div>
      ))}
    </div>
  );
}

export default Matches;