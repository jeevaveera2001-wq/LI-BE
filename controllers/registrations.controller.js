import { connectToDatabase } from '../config/db.js';

// In-memory fallback if MongoDB connection fails
let inMemoryRegistrations = [];

export const getRegistrations = async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('registrations');
    const registrations = await collection.find({}).sort({ _id: -1 }).toArray();

    const formatted = registrations.map(item => {
      const { _id, ...rest } = item;
      return { ...rest, mongoId: _id.toString() };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      registrations: formatted
    });
  } catch (err) {
    console.warn('MongoDB query failed, serving memory fallback:', err.message);
    return res.status(200).json({
      success: true,
      count: inMemoryRegistrations.length,
      registrations: inMemoryRegistrations,
      fallback: true
    });
  }
};

export const createRegistration = async (req, res) => {
  try {
    const body = req.body || {};
    if (body.action === 'CLEAR_ALL') {
      try {
        const { db } = await connectToDatabase();
        await db.collection('registrations').deleteMany({});
      } catch (e) {
        inMemoryRegistrations = [];
      }
      return res.status(200).json({ success: true, message: 'All registrations cleared' });
    }

    const squad = body.squad || body;
    if (!squad || !squad.id) {
      return res.status(400).json({ success: false, error: 'Missing squad registration payload' });
    }

    try {
      const { db } = await connectToDatabase();
      const collection = db.collection('registrations');
      await collection.updateOne(
        { id: squad.id },
        {
          $set: { ...squad, updatedAt: new Date().toISOString() },
          $setOnInsert: { createdAt: new Date().toISOString() }
        },
        { upsert: true }
      );
    } catch (e) {
      const idx = inMemoryRegistrations.findIndex(r => r.id === squad.id);
      if (idx >= 0) inMemoryRegistrations[idx] = squad;
      else inMemoryRegistrations.unshift(squad);
    }

    return res.status(201).json({
      success: true,
      message: 'Squad registered successfully',
      squadId: squad.id
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRegistration = async (req, res) => {
  try {
    const { id, status, newStatus } = req.body || {};
    const targetStatus = status || newStatus;

    if (!id || !targetStatus) {
      return res.status(400).json({ success: false, error: 'Missing id or status to update' });
    }

    try {
      const { db } = await connectToDatabase();
      await db.collection('registrations').updateOne(
        { id },
        { $set: { status: targetStatus, updatedAt: new Date().toISOString() } }
      );
    } catch (e) {
      const item = inMemoryRegistrations.find(r => r.id === id);
      if (item) item.status = targetStatus;
    }

    return res.status(200).json({ success: true, message: `Status updated to ${targetStatus}` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.query || req.body || {};
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing registration id to delete' });
    }

    try {
      const { db } = await connectToDatabase();
      await db.collection('registrations').deleteOne({ id });
    } catch (e) {
      inMemoryRegistrations = inMemoryRegistrations.filter(r => r.id !== id);
    }

    return res.status(200).json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
