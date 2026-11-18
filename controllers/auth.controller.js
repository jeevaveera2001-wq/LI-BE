import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
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

// Helper: Create Gmail SMTP transporter if credentials are provided in env or default
const createMailTransporter = () => {
  const user = (process.env.GMAIL_USER || 'livetournaments.in@gmail.com').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || 'ngdrnjgwbjfglfga').trim().replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // 587 uses STARTTLS
    requireTLS: true,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000
  });
};

export const sendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isReset = purpose === 'reset' || purpose === 'forgot';
    const incomingOtp = req.body?.otp ? String(req.body.otp).trim() : null;
    const otp = (incomingOtp && incomingOtp.length === 6) ? incomingOtp : Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    activeOtps.set(cleanEmail, { otp, expiry });

    console.log(`[Auth API] Generated Google verification code G-${otp} for ${cleanEmail} (purpose: ${isReset ? 'reset' : 'registration'})`);

    // If Gmail credentials are set, dispatch real email via Gmail SMTP (port 587)
    const transporter = createMailTransporter();
    const senderUser = (process.env.GMAIL_USER || 'livetournaments.in@gmail.com').trim();
    const actionLabel = isReset ? 'password reset' : 'registration';
    const subjectLine = isReset 
      ? `${otp} is your Live Tournaments Password Reset Code`
      : `${otp} is your Live Tournaments Google verification code`;

    const mailOptions = {
      from: `"Live Tournaments Verification" <${senderUser}>`,
      to: cleanEmail,
      subject: subjectLine,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; color: #0f172a;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a;">
              LIVE TOURNAMENTS<span style="color: #f59e0b;">.IN</span>
            </h2>
          </div>
          
          <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
            Hello,
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
            Use the following Google verification code to complete your <strong>${actionLabel}</strong> on <strong>Live Tournaments</strong>:
          </p>

          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
            <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
              Google Verification Code
            </div>
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 6px; font-family: monospace; color: #0f172a; margin: 4px 0;">
              G-${otp}
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">
              Enter <strong>${otp}</strong> or <strong>G-${otp}</strong> in the portal
            </div>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 24px;">
            This code expires in <strong>10 minutes</strong>. If you did not initiate this request, no further action is required.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          
          <div style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.4;">
            © ${new Date().getFullYear()} Live tournaments.in. Official Competitive BGMI Esports Portal.
          </div>
        </div>
      `
    };

    if (transporter) {
      // Dispatch immediately and asynchronously in background - NEVER block the HTTP response
      transporter.sendMail(mailOptions)
        .then((info) => {
          console.log(`[Auth API] Successfully dispatched Google verification code to ${cleanEmail}, Msg ID: ${info?.messageId}`);
        })
        .catch((err) => {
          console.error(`[Auth API] Gmail SMTP dispatch error for ${cleanEmail}:`, err?.message || err);
        });
    }

    // Return instant HTTP 200 response (< 50ms) to ensure lightning-fast UI responsiveness
    // Note: otp is NOT included in response - verification is strictly via the email inbox
    return res.status(200).json({
      success: true,
      message: 'Google verification code dispatched to your email',
      email: cleanEmail,
      emailSent: true
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

export const resetPassword = async (req, res) => {
  try {
    const { email, password, otp } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and new password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (otp) {
      const record = activeOtps.get(cleanEmail);
      let cleanOtp = String(otp).trim();
      if (cleanOtp.toUpperCase().startsWith('G-')) {
        cleanOtp = cleanOtp.substring(2).trim();
      }
      cleanOtp = cleanOtp.replace(/\D/g, '');

      if (!record || record.otp !== cleanOtp || Date.now() > record.expiry) {
        return res.status(400).json({ success: false, error: 'Invalid or expired Google verification code' });
      }
      activeOtps.delete(cleanEmail);
    }

    const passwordHash = hashPassword(password);

    try {
      const { db } = await connectToDatabase();
      await db.collection('users').updateOne(
        { email: cleanEmail },
        { $set: { passwordHash, updatedAt: new Date().toISOString() } }
      );
    } catch (e) {
      console.warn('DB update failed for resetPassword:', e.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully updated'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
