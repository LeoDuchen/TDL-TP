import express, { Request, Response } from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

const dbPromise = open({
  filename: './src/database.db',
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

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    lastName TEXT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT UNIQUE
  )`);
});

app.get('/', (req: Request, res: Response) => {
  res.send('Servidor está funcionando.');
});

// Usuarios hardcodeados, borrar después.
const hardcodedUsers = [
  { id: 1, name: 'Pepe', lastName: 'Juan', username: 'pepe', password: '123', email: 'pepe@gmail.com' },
  { id: 2, name: 'Nombre', lastName: 'Apellido', username: 'usuario', password: 'contraseña', email: 'usuario@contraseña' }
];

app.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if ((!username) || (!password)) {
    return res.status(400).json({ error: 'Falta completar todos los campos.' });
  }

  const db = await dbPromise;

  try {
    const user = await db.get(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (user) {
      return res.status(200).json({ user });
    }

    // Usuarios hardcodeados, borrar después.
    const hardcodedUser = hardcodedUsers.find(
      (user) => user.username === username && user.password === password
    );
    if (hardcodedUser) {
      return res.status(200).json({ user: hardcodedUser });
    }

    return res.status(400).json({ error: 'Usuario o contraseña incorrectos.' });

  } catch (error) {
    return res.status(500).json({ error: 'Error del servidor.' });
  }
});

app.post('/register', async (req: Request, res: Response) => {
  const { name, lastName, username, password, email } = req.body;

  if ((!name) || (!lastName) || (!username) || (!password) || (!email)) {
    return res.status(400).json({ error: 'Falta completar todos los campos.' });
  }

  const db = await dbPromise;

  try {
    const userCheck = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (userCheck) {
      if (userCheck.username === username) {
        return res.status(400).json({ error: 'Nombre de usuario ya está en uso.' });
      }
      if (userCheck.email === email) {
        return res.status(400).json({ error: 'Email ya está en uso.' });
      }
    }

    const result = await db.run(
      `INSERT INTO users (name, lastName, username, password, email) VALUES (?, ?, ?, ?, ?)`,
      [name, lastName, username, password, email]
    );

    const newUser = {
      id: result.lastID,
      name,
      lastName,
      username,
      password,
      email
    };

    res.status(201).json(newUser);
  } catch (error: any) {
    return res.status(500).json({ error: 'Error del servidor.' });
  }
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
  const { playerUsername, playerName } = req.body;

  const db = await dbPromise;

  const match = await db.get('SELECT * FROM matches WHERE id = ?', [matchId]);

  if (!match) {
    return res.status(404).json({ error: 'Partido no encontrado.' });
  }

  const players = JSON.parse(match.players || '[]') as { username: string, name: string }[];

  if (players.some(p => p.username === playerUsername)) {
    return res.status(400).json({ error: 'Ya estás anotado en este partido.' });
  }

  if (players.length >= match.maxPlayers) {
    return res.status(400).json({ error: 'El partido está lleno.' });
  }

  players.push({ username: playerUsername, name: playerName });

  await db.run('UPDATE matches SET players = ? WHERE id = ?', [JSON.stringify(players), matchId]);

  return res.status(200).json({ ...match, players });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});