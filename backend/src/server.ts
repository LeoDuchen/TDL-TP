import express, { Request, Response } from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

const dbPromise = open({
  filename: './database.db',
  driver: sqlite3.Database
});

dbPromise.then((db) => {
  db.run(`CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    createdBy TEXT,
    location TEXT,
    description TEXT,
    date TEXT,
    hour TEXT,
    players TEXT,
    maxPlayers INTEGER
  )`);
});

app.get('/', (req: Request, res: Response) => {
  res.send('Servidor está funcionando.');
});

app.get('/matches', async (req: Request, res: Response) => {
  const db = await dbPromise;
  const matches = await db.all('SELECT * FROM matches');
  res.json(matches);
});

app.post('/matches', async (req: Request, res: Response) => {
  const { createdBy, location, description, date, hour, players, maxPlayers } = req.body;
  
  const db = await dbPromise;

  const result = await db.run(
    `INSERT INTO matches (createdBy, location, description, date, hour, players, maxPlayers) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [createdBy, location, description, date, hour, JSON.stringify(players || []), maxPlayers]
  );

  const newMatch = {
    id: result.lastID,
    createdBy,
    location,
    description,
    date,
    hour,
    players: players || [],
    maxPlayers
  };

  res.status(201).json(newMatch);
});

app.post('/matches/:id/join', async (req: Request, res: Response) => {
  const matchId = parseInt(req.params.id);
  const { playerName } = req.body;

  const db = await dbPromise;

  const match = await db.get('SELECT * FROM matches WHERE id = ?', [matchId]);

  if (!match) {
    return res.status(404).send('Partido no encontrado.');
  }

  const players = JSON.parse(match.players);

  if (players.includes(playerName)) {
    return res.status(400).send('El usuario ya está anotado.');
  }

  if (players.length >= match.maxPlayers) {
    return res.status(400).send('El partido está lleno.');
  }

  players.push(playerName);

  await db.run('UPDATE matches SET players = ? WHERE id = ?', [JSON.stringify(players), matchId]);

  return res.status(200).json({ ...match, players });
});

app.put('/matches/:id', async (req: Request, res: Response) => {
  const matchId = parseInt(req.params.id);
  const { location, description, date, hour, maxPlayers } = req.body;

  const db = await dbPromise;

  const match = await db.get('SELECT * FROM matches WHERE id = ?', [matchId]);

  if (match) {
    await db.run('UPDATE matches SET location = ?, description = ?, date = ?, hour = ?, maxPlayers = ? WHERE id = ?',
      [location, description, date, hour, maxPlayers, matchId]);
      
    res.json({ ...match, location, description, date, hour, maxPlayers });
  } else {
    res.status(404).send('Partido no encontrado.');
  }
});

// Sin funcionamiento, hay que agregar la funcionalidad de eliminar partidos creados en el frontend primero.
app.delete('/matches/:id', async (req: Request, res: Response) => {
  const matchId = parseInt(req.params.id);

  const db = await dbPromise;

  const match = await db.get('SELECT * FROM matches WHERE id = ?', [matchId]);

  if (match) {
    await db.run('DELETE FROM matches WHERE id = ?', [matchId]);
    res.status(204).send();
  } else {
    res.status(404).send('Partido no encontrado.');
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});