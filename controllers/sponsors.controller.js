import { connectToDatabase } from '../config/db.js';

const DEFAULT_SPONSORS = [
  { id: 'sp-1', name: 'SPONSOR 1', tier: 'TITLE', category: 'Official Partner', status: 'ACTIVE', link: '#' },
  { id: 'sp-2', name: 'SPONSOR 2', tier: 'CO-POWERED', category: 'Official Partner', status: 'ACTIVE', link: '#' },
  { id: 'sp-3', name: 'SPONSOR 3', tier: 'ENERGY', category: 'Official Partner', status: 'ACTIVE', link: '#' },
  { id: 'sp-4', name: 'SPONSOR 4', tier: 'BROADCAST', category: 'Official Partner', status: 'ACTIVE', link: '#' }
];

export const getSponsors = async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const sponsors = await db.collection('sponsors').find({}).toArray();
    if (sponsors.length === 0) {
      return res.status(200).json({ success: true, sponsors: DEFAULT_SPONSORS });
    }
    return res.status(200).json({ success: true, sponsors });
  } catch (error) {
    return res.status(200).json({ success: true, sponsors: DEFAULT_SPONSORS, fallback: true });
  }
};

export const createSponsor = async (req, res) => {
  try {
    const sponsor = req.body || {};
    if (!sponsor || !sponsor.name) {
      return res.status(400).json({ success: false, error: 'Sponsor name is required' });
    }

    const newSponsor = {
      id: sponsor.id || 'sp-' + Date.now(),
      name: sponsor.name,
      tier: sponsor.tier || 'OFFICIAL',
      category: sponsor.category || 'Official Partner',
      status: sponsor.status || 'ACTIVE',
      link: sponsor.link || '#',
      updatedAt: new Date().toISOString()
    };

    const { db } = await connectToDatabase();
    await db.collection('sponsors').updateOne(
      { id: newSponsor.id },
      { $set: newSponsor },
      { upsert: true }
    );

    return res.status(201).json({ success: true, sponsor: newSponsor });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
