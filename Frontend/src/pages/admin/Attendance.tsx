import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { motion } from 'framer-motion';
import api from '../../api';
import { socket } from '../../lib/socket';

export function AdminAttendance() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    api
      .get(`/admin/all-attendance?page=${currentPage}&limit=${itemsPerPage}`)
      .then((res) => {
        setAttendance(res.data.attendance);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages);
        }
      })
      .finally(() => setLoading(false));

    socket.on('attendanceUpdate', (newRecord) => {
      setAttendance((prev) => {
        const exists = prev.find((r) => r.id === newRecord.id);
        if (exists) {
          return prev.map((r) => (r.id === newRecord.id ? newRecord : r));
        }
        return [newRecord, ...prev];
      });
    });

    return () => {
      socket.off('attendanceUpdate');
    };
  }, [currentPage]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-2">System Attendance</h1>
      <GlassCard>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-white/5 rounded-t-xl">
                  <tr>
                    <th className="px-4 py-4 rounded-tl-xl">Date</th>
                    <th className="px-4 py-4">Staff Name</th>
                    <th className="px-4 py-4">Check In</th>
                    <th className="px-4 py-4 rounded-tr-xl">Check Out</th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {attendance.map((record) => (
                    <motion.tr
                      variants={item}
                      key={record.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-4">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 font-medium text-white">
                        {record.user?.name}
                      </td>
                      <td className="px-4 py-4">
                        {new Date(record.checkIn).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-4">
                        {record.checkOut ? (
                          new Date(record.checkOut).toLocaleTimeString()
                        ) : (
                          <span className="text-yellow-400/80">Active</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </motion.tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-4 border-t border-white/10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-white bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-white bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </GlassCard>
    </div>
  );
}
