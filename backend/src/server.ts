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

dbPromise.then(async (db) => {
  await db.run('PRAGMA foreign_keys = ON');
  db.run(`CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    createdBy INTEGER,
    location TEXT,
    description TEXT,
    date TEXT,
    hour TEXT,
    players TEXT,
    maxPlayers INTEGER,
    FOREIGN KEY (createdBy) REFERENCES users(id)
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

app.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if ((!username) || (!password)) {
      return res.status(400).json({ error: 'Falta completar todos los campos.' });
    }

    const db = await dbPromise;

    const user = await db.get(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (user) {
      return res.status(200).json({ user });
    }

    return res.status(400).json({ error: 'Usuario o contraseña incorrectos.' });

  } catch (error) {
    return res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
});

app.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, lastName, username, password, email } = req.body;

    if ((!name) || (!lastName) || (!username) || (!password) || (!email)) {
      return res.status(400).json({ error: 'Falta completar todos los campos.' });
    }

    const db = await dbPromise;

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
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar el usuario.' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const db = await dbPromise;
    const users = await db.all('SELECT id, name, username FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios.' });
  }
});

app.get('/matches', async (req: Request, res: Response) => {
  try {
    const db = await dbPromise;
    const matchesRaw = await db.all('SELECT * FROM matches');

    const matches = matchesRaw.map(match => ({
      ...match,
      players: JSON.parse(match.players || '[]')
    }));

    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los partidos.' });
  }
});

app.post('/matches', async (req: Request, res: Response) => {
  try {
    const { createdBy, location, description, date, hour, maxPlayers } = req.body;

    if ((!createdBy) || (!location) || (!date) || (!hour) || (!maxPlayers)) {
      return res.status(400).json({ error: 'Falta completar todos los campos.' });
    }
    
    const players = [createdBy];
    const db = await dbPromise;

    const result = await db.run(
      `INSERT INTO matches (createdBy, location, description, date, hour, players, maxPlayers) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [createdBy, location, description, date, hour, JSON.stringify(players), maxPlayers]
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
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el partido.' });
  }
});

app.post('/matches/:id/join', async (req: Request, res: Response) => {
  try {
    const matchId = parseInt(req.params.id);
    const { userId } = req.body;

    if (typeof userId !== 'number') {
      return res.status(400).json({ error: 'El ID del usuario debe ser un número válido.' });
    }

    const db = await dbPromise;

    const match = await db.get('SELECT * FROM matches WHERE id = ?', [matchId]);

    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado.' });
    }

    const players = JSON.parse(match.players || '[]') as number[];

    if (players.includes(userId)) {
      return res.status(400).json({ error: 'Ya estás anotado en este partido.' });
    }

    if (players.length >= match.maxPlayers) {
      return res.status(400).json({ error: 'El partido está lleno.' });
    }

    players.push(userId);

    await db.run('UPDATE matches SET players = ? WHERE id = ?', [JSON.stringify(players), matchId]);

    return res.status(200).json({ ...match, players })
  } catch (error) {
    res.status(500).json({ error: 'Error al unirse al partido.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});