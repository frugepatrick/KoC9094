import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

type Data = {
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, notes, to } = req.body;

  if (!date || !notes) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"Knights Meeting Notes" <${process.env.EMAIL_USERNAME}>`,
      to: to || 'fruge.patrick@gmail.com',
      subject: `Meeting Notes - ${date}`,
      html: notes,
    });

    console.log('✅ Email sent:', info.messageId);
    return res.status(200).json({ message: 'Email sent successfully!' });

  } catch (error: any) {
    console.error('❌ Email error:', error);

    // Catch non-JSON safe content
    return res.status(500).json({ error: error?.message || 'Email failed to send.' });
  }
}
