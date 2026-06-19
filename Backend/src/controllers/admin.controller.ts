import { Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { PDFParse } from 'pdf-parse';
import { generateEmbedding, upsertDocumentChunks, generateAttendanceReport } from '../lib/ai';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['MANAGER', 'STAFF']),
  managerId: z.string().uuid().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
});

const assignManagerSchema = z.object({
  staffId: z.string().uuid(),
  managerId: z.string().uuid(),
});

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
      return;
    }

    const { name, email, password, role, managerId } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });
      if (!manager || manager.role !== Role.MANAGER) {
        res.status(400).json({ error: 'Invalid manager ID' });
        return;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        managerId: managerId ?? null,
      },
      select: { id: true, name: true, email: true, role: true, managerId: true },
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
      return;
    }

    const updateData = Object.fromEntries(
      Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
    );

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, managerId: true },
    });

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error or user not found' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;

    // Optional: Add logic to reassign staff or delete attendance if necessary
    await prisma.user.delete({ where: { id: userId } });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error or user not found' });
  }
};

export const assignManager = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = assignManagerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
      return;
    }

    const { staffId, managerId } = parsed.data;

    const manager = await prisma.user.findUnique({ where: { id: managerId } });
    if (!manager || manager.role !== Role.MANAGER) {
      res.status(400).json({ error: 'Invalid manager ID' });
      return;
    }

    const staff = await prisma.user.update({
      where: { id: staffId },
      data: { managerId },
      select: { id: true, name: true, role: true, managerId: true },
    });

    res.status(200).json({ message: 'Manager assigned successfully', staff });
  } catch (error) {
    console.error('Assign manager error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managerId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [attendanceRecords, total] = await Promise.all([
      prisma.attendance.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.attendance.count(),
    ]);

    res.status(200).json({
      attendance: attendanceRecords,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const leaveRequests = await prisma.leaveRequest.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, managerId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ leaveRequests });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAttendanceStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalEmployees, checkedInToday, checkedOutToday, weekRecords, monthRecords, allRecords] =
      await Promise.all([
        prisma.user.count(),
        prisma.attendance.count({
          where: { createdAt: { gte: today } },
        }),
        prisma.attendance.count({
          where: { createdAt: { gte: today }, checkOut: { not: null } },
        }),
        prisma.attendance.findMany({
          where: { createdAt: { gte: startOfWeek } },
          select: { overtimeHours: true },
        }),
        prisma.attendance.findMany({
          where: { createdAt: { gte: startOfMonth } },
          select: { overtimeHours: true },
        }),
        prisma.attendance.aggregate({
          _avg: { workingHours: true },
        }),
      ]);

    const currentlyOnline = checkedInToday - checkedOutToday;
    const totalOvertimeWeek = weekRecords.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
    const totalOvertimeMonth = monthRecords.reduce(
      (acc, curr) => acc + (curr.overtimeHours || 0),
      0
    );

    res.status(200).json({
      stats: {
        totalEmployees,
        checkedInToday,
        checkedOutToday,
        currentlyOnline,
        totalOvertimeWeek: parseFloat(totalOvertimeWeek.toFixed(2)),
        totalOvertimeMonth: parseFloat(totalOvertimeMonth.toFixed(2)),
        averageWorkingHours: parseFloat((allRecords._avg.workingHours || 0).toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const adminUpdateLeaveStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const leaveId = req.params.id as string;

    const parsed = adminUpdateLeaveStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
      return;
    }

    const { status } = parsed.data;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
    });

    if (!leaveRequest) {
      res.status(404).json({ error: 'Leave request not found' });
      return;
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status },
    });

    res
      .status(200)
      .json({ message: 'Leave status updated successfully', leaveRequest: updatedLeave });
  } catch (error) {
    console.error('Admin update leave status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { originalname, buffer, mimetype } = req.file;

    let textContent = '';

    if (mimetype === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      textContent = data.text;
    } else if (mimetype === 'text/plain') {
      textContent = buffer.toString('utf-8');
    } else {
      res.status(400).json({ error: 'Unsupported file type. Please upload PDF or TXT.' });
      return;
    }

    if (!textContent.trim()) {
      res.status(400).json({ error: 'Could not extract text from the document.' });
      return;
    }

    // Save metadata to DB
    const document = await prisma.document.create({
      data: {
        title: originalname,
        uploadedBy: req.user!.userId,
      },
    });

    if (!textContent || textContent.trim() === '') {
      return res.status(400).json({ error: 'The uploaded document contains no readable text.' });
    }

    // Chunk the text
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: string[] = [];

    let i = 0;
    while (i < textContent.length) {
      chunks.push(textContent.slice(i, i + chunkSize));
      i += chunkSize - overlap;
    }

    // Generate embeddings and upsert
    const chunkData = [];
    for (let index = 0; index < chunks.length; index++) {
      const chunkText = chunks[index]!;
      const embedding = await generateEmbedding(chunkText);
      chunkData.push({
        id: `${document.id}-chunk-${index}`,
        text: chunkText,
        embedding,
      });

      // Save to Postgres
      await prisma.documentChunk.create({
        data: {
          documentId: document.id,
          text: chunkText,
          pineconeId: chunkData[chunkData.length - 1]!.id,
        },
      });
    }

    // Upsert to Pinecone
    await upsertDocumentChunks(chunkData);

    res.status(201).json({ message: 'Document uploaded and processed successfully', document });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Internal server error processing document' });
  }
};

export const getAIReport = async (req: AuthRequest, res: Response) => {
  try {
    const groupedAttendance = await prisma.attendance.groupBy({
      by: ['userId'],
      _sum: { workingHours: true, overtimeHours: true },
      _count: { id: true },
      where: { workingHours: { not: null } },
    });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, role: true },
    });

    const metrics = groupedAttendance.map((g) => {
      const user = users.find((u) => u.id === g.userId);
      return {
        name: user?.name || 'Unknown',
        role: user?.role,
        daysPresent: g._count.id,
        totalWorkingHours: g._sum.workingHours ? parseFloat(g._sum.workingHours.toFixed(2)) : 0,
        totalOvertimeHours: g._sum.overtimeHours ? parseFloat(g._sum.overtimeHours.toFixed(2)) : 0,
      };
    });

    const report = await generateAttendanceReport({
      overview: 'Company-wide Attendance Metrics',
      employeeStats: metrics,
    });
    res.json({ report });
  } catch (error) {
    console.error('Admin AI Report error:', error);
    res.status(500).json({ error: 'Failed to generate AI report' });
  }
};
