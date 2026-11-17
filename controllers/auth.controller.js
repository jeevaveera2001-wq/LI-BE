import crypto from 'node:crypto';
import { connectToDatabase } from '../config/db.js';

const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@livetournaments.in';
// SHA256 of "Admin@2026"
const ADMIN_HASH = 'ce028ff1dd39e85c4a6334d2a88bca9de49938790b38cced55a619c1ea6fc3bd';
const PASSWORD_SALT = 'livetournaments_esports_2026_salt';

// In-memory OTP storage
const activeOtps = new Map();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + PASSWORD_SALT).digest('hex');
}

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    activeOtps.set(cleanEmail, { otp, expiry });

    console.log(` [Auth API] Generated OTP ${otp} for ${cleanEmail}`);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      email: cleanEmail,
      otp // Provided for testing / friction-free UX
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const record = activeOtps.get(cleanEmail);

    if (!record) {
      return res.status(400).json({ success: false, error: 'No OTP requested for this email' });
    }

    if (Date.now() > record.expiry) {
      activeOtps.delete(cleanEmail);
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    activeOtps.delete(cleanEmail);
    return res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body || {};
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, error: 'Username/email and password required' });
    }

    const cleanInput = usernameOrEmail.toLowerCase().trim();
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');

    // Admin match check
    if ((cleanInput === ADMIN_USERNAME || cleanInput === ADMIN_EMAIL) && inputHash === ADMIN_HASH) {
      return res.status(200).json({
        success: true,
        user: {
          username: ADMIN_USERNAME,
          email: ADMIN_EMAIL,
          role: 'ADMIN',
          displayName: 'Match Ops Admin'
        }
      });
    }

    // Database lookup for registered players
    try {
      const { db } = await connectToDatabase();
      const user = await db.collection('users').findOne({
        $or: [{ username: cleanInput }, { email: cleanInput }]
      });

      if (user && user.passwordHash === hashPassword(password)) {
        return res.status(200).json({
          success: true,
          user: {
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role || 'PLAYER'
          }
        });
      }
    } catch (e) {
      console.warn('DB lookup failed, checking admin only:', e.message);
    }

    return res.status(401).json({ success: false, error: 'Invalid username/email or password' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = cleanEmail.split('@')[0];
    const passwordHash = hashPassword(password);

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      mobile: (mobile || '').trim(),
      passwordHash,
      role: 'PLAYER',
      createdAt: new Date().toISOString()
    };

    try {
      const { db } = await connectToDatabase();
      await db.collection('users').updateOne(
        { email: cleanEmail },
        { $setOnInsert: newUser },
        { upsert: true }
      );
    } catch (e) {
      console.warn('DB write failed for registration:', e.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
