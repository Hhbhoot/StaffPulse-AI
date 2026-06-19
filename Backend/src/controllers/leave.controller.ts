import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';
import { getIo } from '../lib/socket';

const applyLeaveSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(5),
});

export const applyLeave = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const parsed = applyLeaveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
      return;
    }

    const { startDate, endDate, reason } = parsed.data;

    if (new Date(startDate) > new Date(endDate)) {
      res.status(400).json({ error: 'startDate cannot be after endDate' });
      return;
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
      },
      include: {
        user: {
          select: { id: true, name: true, managerId: true },
        },
      },
    });

    try {
      getIo().emit('leaveRequested', leaveRequest);
    } catch (e) {
      console.error('Socket emit error:', e);
    }

    res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ leaveRequests });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
