import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../services/api';

// Async thunks
export const fetchAttendance = createAsyncThunk(
    'attendance/fetch',
    async (studentId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/attendance/${studentId}`);
            return response.data;
        } catch (error) {
            // Return mock data if endpoint doesn't exist
            if (error.response?.status === 404) {
                return {
                    records: [],
                    monthlyData: []
                };
            }
            return rejectWithValue(error.message);
        }
    }
);

export const markAttendance = createAsyncThunk(
    'attendance/mark',
    async ({ studentId, date, status }, { rejectWithValue }) => {
        try {
            const response = await api.post('/attendance', {
                student_id: studentId,
                date,
                status
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const attendanceSlice = createSlice({
    name: 'attendance',
    initialState: {
        records: [],
        monthlyData: [],
        stats: {
            percentage: 0,
            presentDays: 0,
            absentDays: 0,
            totalDays: 0,
            streak: 0,
            monthlyTrend: 0,
            riskLevel: 'low' // low, medium, high
        },
        loading: false,
        error: null
    },
    reducers: {
        initializeAttendance: (state, action) => {
            const { percentage, presentDays, absentDays, totalDays, streak } = action.payload;
            state.stats.percentage = percentage || 0;
            state.stats.presentDays = presentDays || 0;
            state.stats.absentDays = absentDays || 0;
            state.stats.totalDays = totalDays || 0;
            state.stats.streak = streak || 0;
            state.stats.monthlyTrend = 0;

            // Risk level
            if (state.stats.percentage < 75) {
                state.stats.riskLevel = 'high';
            } else if (state.stats.percentage < 85) {
                state.stats.riskLevel = 'medium';
            } else {
                state.stats.riskLevel = 'low';
            }
        },

        calculateStats: (state) => {
            const records = state.records;
            const totalDays = records.length;
            const presentDays = records.filter(r => r.status === 'present').length;
            const absentDays = totalDays - presentDays;

            state.stats.totalDays = totalDays;
            state.stats.presentDays = presentDays;
            state.stats.absentDays = absentDays;
            state.stats.percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

            // Calculate streak
            let streak = 0;
            for (let i = records.length - 1; i >= 0; i--) {
                if (records[i].status === 'present') {
                    streak++;
                } else {
                    break;
                }
            }
            state.stats.streak = streak;

            // Risk level
            if (state.stats.percentage < 75) {
                state.stats.riskLevel = 'high';
            } else if (state.stats.percentage < 85) {
                state.stats.riskLevel = 'medium';
            } else {
                state.stats.riskLevel = 'low';
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAttendance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAttendance.fulfilled, (state, action) => {
                state.loading = false;
                state.records = action.payload.records || [];
                state.monthlyData = action.payload.monthlyData || [];
                attendanceSlice.caseReducers.calculateStats(state);
            })
            .addCase(fetchAttendance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(markAttendance.fulfilled, (state, action) => {
                state.records.push(action.payload);
                attendanceSlice.caseReducers.calculateStats(state);
            });
    }
});

export const { initializeAttendance, calculateStats } = attendanceSlice.actions;

// ============ ENHANCED SELECTORS ============

// Basic Selectors
export const selectAttendanceStats = (state) => state.attendance.stats;
export const selectAttendanceRecords = (state) => state.attendance.records;
export const selectMonthlyData = (state) => state.attendance.monthlyData;
export const selectAttendanceLoading = (state) => state.attendance.loading;
export const selectAttendanceError = (state) => state.attendance.error;

// Percentage Selector (Memoized)
export const selectAttendancePercentage = createSelector(
    [(state) => state.attendance.stats],
    (stats) => {
        const { presentDays, totalDays } = stats;
        return totalDays === 0 ? 0 : Math.round((presentDays / totalDays) * 100);
    }
);

// Streak Selector
export const selectAttendanceStreak = createSelector(
    [(state) => state.attendance.stats],
    (stats) => stats.streak || 0
);

// Risk Level Selector
export const selectRiskLevel = createSelector(
    [(state) => state.attendance.stats],
    (stats) => stats.riskLevel || 'low'
);

// Perfect Attendance Badge Selector (30+ consecutive presents)
export const selectPerfectAttendanceBadge = createSelector(
    [(state) => state.attendance.stats],
    (stats) => stats.streak >= 30
);

// Weekly Summary Selector (Last 7 days)
export const selectWeeklySummary = createSelector(
    [(state) => state.attendance.records],
    (records) => {
        const last7Days = records.slice(-7);
        const presentCount = last7Days.filter(r => r.status === 'present' || r.status === 'Present').length;
        const absentCount = last7Days.length - presentCount;
        const weeklyPercentage = last7Days.length > 0 
            ? Math.round((presentCount / last7Days.length) * 100) 
            : 0;
        
        return {
            presentCount,
            absentCount,
            totalDays: last7Days.length,
            percentage: weeklyPercentage
        };
    }
);

// Calendar Data Selector (Transform records to calendar format)
export const selectCalendarData = createSelector(
    [(state) => state.attendance.records],
    (records) => {
        const calendarMap = {};
        records.forEach(record => {
            const dateKey = record.date || record.attendance_date;
            if (dateKey) {
                calendarMap[dateKey] = record.status?.toLowerCase() || 'present';
            }
        });
        return calendarMap;
    }
);

// Motivational Message Selector
export const selectMotivationalMessage = createSelector(
    [selectAttendancePercentage, selectAttendanceStreak],
    (percentage, streak) => {
        if (percentage >= 95 && streak >= 7) {
            return { emoji: '🎉', message: 'Outstanding! Star student!' };
        } else if (percentage >= 90) {
            return { emoji: '⭐', message: 'Excellent attendance!' };
        } else if (percentage >= 80) {
            return { emoji: '👍', message: 'Good job! Keep it up!' };
        } else if (percentage >= 75) {
            return { emoji: '💪', message: 'You can do better!' };
        } else {
            return { emoji: '🤗', message: 'Let\'s improve together!' };
        }
    }
);

// Heatmap Data Selector (365-day grid)
export const selectHeatmapData = createSelector(
    [(state) => state.attendance.records],
    (records) => {
        const heatmapMap = {};
        records.forEach(record => {
            const dateKey = record.date || record.attendance_date;
            if (dateKey) {
                heatmapMap[dateKey] = record.status?.toLowerCase() || 'present';
            }
        });
        return heatmapMap;
    }
);

// Weekly Attendance Selector (for goal tracking)
export const selectWeeklyAttendance = createSelector(
    [(state) => state.attendance.records],
    (records) => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
        
        const weekRecords = records.filter(record => {
            const recordDate = new Date(record.date || record.attendance_date);
            return recordDate >= startOfWeek && recordDate <= today;
        });
        
        const present = weekRecords.filter(r => 
            r.status?.toLowerCase() === 'present'
        ).length;
        const absent = weekRecords.filter(r => 
            r.status?.toLowerCase() === 'absent'
        ).length;
        const goal = 5; // Default weekly goal
        const progress = goal > 0 ? Math.round((present / goal) * 100) : 0;
        
        return {
            present,
            absent,
            goal,
            progress: Math.min(progress, 100) // Cap at 100%
        };
    }
);

// Attendance Alerts Selector (for smart reminders)
export const selectAttendanceAlerts = createSelector(
    [
        (state) => state.attendance.records,
        selectAttendancePercentage
    ],
    (records, percentage) => {
        const today = new Date().toISOString().split('T')[0];
        const last7Days = records.slice(-7);
        
        // Check if attendance marked today
        const markedToday = records.some(r => 
            (r.date || r.attendance_date) === today
        );
        
        // Check low attendance
        const lowAttendance = percentage < 80;
        
        // Check frequent absences (3+ in last 7 days)
        const recentAbsences = last7Days.filter(r => 
            r.status?.toLowerCase() === 'absent'
        ).length;
        const frequentAbsence = recentAbsences >= 3;
        
        return {
            missingToday: !markedToday,
            lowAttendance,
            frequentAbsence,
            hasAlerts: !markedToday || lowAttendance || frequentAbsence
        };
    }
);

export default attendanceSlice.reducer;
