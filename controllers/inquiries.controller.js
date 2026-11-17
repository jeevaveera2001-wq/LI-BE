import { connectToDatabase } from '../config/db.js';

let inMemoryInquiries = [];

export const getInquiries = async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const inquiries = await db.collection('inquiries').find({}).sort({ _id: -1 }).toArray();
    const formatted = inquiries.map(item => {
      const { _id, ...rest } = item;
      return { ...rest, mongoId: _id.toString() };
    });
    return res.status(200).json({ success: true, inquiries: formatted });
  } catch (error) {
    return res.status(200).json({ success: true, inquiries: inMemoryInquiries, fallback: true });
  }
};

export const createInquiry = async (req, res) => {
  try {
    const body = req.body || {};
    const inquiry = body.inquiry || body;

    if (!inquiry || !inquiry.id) {
      return res.status(400).json({ success: false, error: 'Missing inquiry payload' });
    }

    try {
      const { db } = await connectToDatabase();
      await db.collection('inquiries').updateOne(
        { id: inquiry.id },
        {
          $set: { ...inquiry, updatedAt: new Date().toISOString() },
          $setOnInsert: { createdAt: new Date().toISOString() }
        },
        { upsert: true }
      );
    } catch (e) {
      inMemoryInquiries.unshift(inquiry);
    }

    return res.status(201).json({ success: true, inquiryId: inquiry.id });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateInquiry = async (req, res) => {
  try {
    const { id, status } = req.body || {};
    try {
      const { db } = await connectToDatabase();
      await db.collection('inquiries').updateOne(
        { id },
        { $set: { status: status || 'RESOLVED', updatedAt: new Date().toISOString() } }
      );
    } catch (e) {
      const item = inMemoryInquiries.find(i => i.id === id);
      if (item) item.status = status || 'RESOLVED';
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.query || req.body || {};
    try {
      const { db } = await connectToDatabase();
      await db.collection('inquiries').deleteOne({ id });
    } catch (e) {
      inMemoryInquiries = inMemoryInquiries.filter(i => i.id !== id);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
