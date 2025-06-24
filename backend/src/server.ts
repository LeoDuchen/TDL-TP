import express, { Request, Response } from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import crypto from 'crypto';

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
    link TEXT UNIQUE,
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

app.get('/matches/:link', async (req: Request, res: Response) => {
  try {
    const { link } = req.params;
    const db = await dbPromise;
    const match = await db.get('SELECT * FROM matches WHERE link = ?', [link]);

    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado.' });
    }

    const matchWithParsedPlayers = {
      ...match,
      players: JSON.parse((match.players) || ('[]'))
    };

    res.json(matchWithParsedPlayers);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el partido.' });
  }
});

app.post('/matches', async (req: Request, res: Response) => {
  try {
    const { createdBy, location, description, date, hour, maxPlayers } = req.body;

    if ((!createdBy) || (!location) || (!date) || (!hour) || (!maxPlayers)) {
      return res.status(400).json({ error: 'Falta completar todos los campos.' });
    }
    
    const db = await dbPromise;
    const user = await db.get('SELECT name FROM users WHERE id = ?', [createdBy]);
    const players = [{ id: createdBy, name: (user?.name) || ('Usuario') }];

    let link;
    let linkExists;
    do {
      link = crypto.randomBytes(6).toString('hex');
      linkExists = await db.get('SELECT * FROM matches WHERE link = ?', [link]);
    } while (linkExists);

    const result = await db.run(
      `INSERT INTO matches (createdBy, location, description, date, hour, players, maxPlayers, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [createdBy, location, description, date, hour, JSON.stringify(players), maxPlayers, link]
    );

    const newMatch = {
      id: result.lastID,
      createdBy,
      location,
      description,
      date,
      hour,
      players: (players) || ([]),
      maxPlayers,
      link
    };

    res.status(201).json(newMatch);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el partido.' });
  }
});

app.post('/matches/:link/join', async (req: Request, res: Response) => {
  try {
    const { userId, name } = req.body;
    const { link } = req.params;

    const db = await dbPromise;
    const match = await db.get('SELECT * FROM matches WHERE link = ?', [link]);

    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado.' });
    }

    const players = JSON.parse(match.players || '[]') as { id: number | null, name: string }[];

    if (players.length >= match.maxPlayers) {
      return res.status(400).json({ error: 'El partido está lleno.' });
    }

    if (userId) {
      if (typeof userId !== 'number') {
        return res.status(400).json({ error: 'El ID del usuario debe ser un número válido.' });
      }

      const user = await db.get('SELECT name FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      if (players.some(p => p.id === userId)) {
        return res.status(400).json({ error: 'Ya te anotaste en este partido.' });
      }

      players.push({ id: userId, name: user.name });
    } else {
      if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ error: 'Ya hay alguien anotado con ese nombre.' });
      }

      players.push({ id: null, name: name });
    }

    await db.run('UPDATE matches SET players = ? WHERE id = ?', [JSON.stringify(players), match.id]);

    return res.status(200).json({ ...match, players })
  } catch (error) {
    res.status(500).json({ error: 'Error al unirse al partido.' });
  }
});

app.post('/matches/:link/remove', async (req: Request, res: Response) => {
  try {
    const { userId, guestName } = req.body;
    const { link } = req.params;

    const db = await dbPromise;
    const match = await db.get('SELECT * FROM matches WHERE link = ?', [link]);

    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado.' });
    }

    let players = JSON.parse(match.players || '[]') as { id: number | null, name: string }[];

    if (userId) {
      players = players.filter(p => p.id !== userId);
    } else {
      players = players.filter(p => !((p.id === null) && (p.name.toLowerCase() === guestName.toLowerCase())));
    }

    await db.run('UPDATE matches SET players = ? WHERE id = ?', [JSON.stringify(players), match.id]);

    return res.status(200).json({ ...match, players })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el jugador.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});