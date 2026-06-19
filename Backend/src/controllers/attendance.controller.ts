import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getIo } from '../lib/socket';

export const checkIn = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if user already checked in today
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingAttendance) {
      res.status(400).json({ error: 'Already checked in for today' });
      return;
    }

    // Check for any pending check-outs from previous days
    const lastAttendance = await prisma.attendance.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastAttendance && !lastAttendance.checkOut) {
      res
        .status(400)
        .json({ error: 'Please check out from your previous session before checking in again.' });
      return;
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        checkIn: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, managerId: true },
        },
      },
    });

    try {
      getIo().emit('attendanceUpdate', attendance);
    } catch (e) {
      console.error('Socket emit error:', e);
    }

    res.status(201).json({ message: 'Checked in successfully', attendance });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkOut = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find the most recent attendance record
    const attendance = await prisma.attendance.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!attendance || attendance.checkOut) {
      res.status(400).json({ error: 'No active check-in session found' });
      return;
    }

    const checkOutTime = new Date();
    const checkInTime = attendance.checkIn!;

    // Calculate working hours
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // Calculate overtime (assuming standard 8 hour workday)
    const standardHours = 8;
    const overtimeHours =
      workingHours > standardHours ? parseFloat((workingHours - standardHours).toFixed(2)) : 0;

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: checkOutTime,
        workingHours,
        overtimeHours,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, managerId: true },
        },
      },
    });

    try {
      getIo().emit('attendanceUpdate', updatedAttendance);
    } catch (e) {
      console.error('Socket emit error:', e);
    }

    res.status(200).json({ message: 'Checked out successfully', attendance: updatedAttendance });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.attendance.count({
        where: { userId },
      }),
    ]);

    res.status(200).json({
      attendance: records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let todayRecord = await prisma.attendance.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // If there is a pending check-out from a previous day, use that as the active record
    const lastRecord = await prisma.attendance.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastRecord && !lastRecord.checkOut) {
      todayRecord = lastRecord;
    }

    // Get all attendance for the current month
    const monthlyRecords = await prisma.attendance.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    const totalHoursMonth = monthlyRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0);
    const totalOvertimeMonth = monthlyRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
    const daysPresent = monthlyRecords.length;

    res.status(200).json({
      stats: {
        totalHoursMonth: parseFloat(totalHoursMonth.toFixed(2)),
        totalOvertimeMonth: parseFloat(totalOvertimeMonth.toFixed(2)),
        daysPresent,
      },
      todayRecord,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
