import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { cloudinary } from '../lib/cloudinary';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const login = async (req: Request, res: Response) => {
  try {
    const parsedBody = loginSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: 'Invalid input', details: parsedBody.error.format() });
      return;
    }

    const { email, password } = parsedBody.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
});

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parsedBody = updateProfileSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: 'Invalid input', details: parsedBody.error.format() });
      return;
    }

    const { name, password } = parsedBody.data;
    const dataToUpdate: any = {};

    if (name) dataToUpdate.name = name;
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    // Upload to Cloudinary using upload_stream
    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'devsto_avatars' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file!.buffer);
    });

    const result = (await uploadPromise) as any;

    // Update user in database
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: result.secure_url },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });

    res
      .status(200)
      .json({ message: 'Avatar updated successfully', user, avatarUrl: result.secure_url });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
