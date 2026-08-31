import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth.js';

export const authRouter = Router();

// Login endpoint
authRouter.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    plant: user.plant,
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      plant: user.plant,
    },
  });
});

// Current user profile
authRouter.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Demo accounts endpoint for rapid shopfloor switcher
authRouter.get('/demo-users', (req: Request, res: Response) => {
  const users = db.prepare('SELECT id, username, name, role, plant FROM users').all();
  res.json({ users });
});

// Register / Add a new supervisor or manager
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { username, password, name, role = 'supervisor', plant } = req.body;

    if (!username || !password || !name || !plant) {
      return res.status(400).json({
        error: 'username, password, name, and plant are required fields.',
      });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const id = `usr_${Date.now().toString().slice(-6)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, password_hash, name, role, plant, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, username.trim().toLowerCase(), passwordHash, name.trim(), role, plant.trim(), now);

    const newUser = { id, username: username.trim().toLowerCase(), name: name.trim(), role, plant: plant.trim() };
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create user: ' + err.message });
  }
});

