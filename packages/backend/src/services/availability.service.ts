// packages/backend/src/services/availability.service.ts
import { prisma } from '@barberia/shared';
import { googleCalendarService } from './google-calendar.service';
import dayjs from 'dayjs';

export class AvailabilityService {
  /**
   * Get available slots for a specific date
   */
  async getAvailableSlots(date: string) {
    const targetDate = dayjs(date).startOf('day');
    const dayOfWeek = targetDate.day();

    // 1. Get business hours for that day
    const schedule = await prisma.availability.findUnique({
      where: { dayOfWeek },
    });

    if (!schedule || !schedule.isActive) return [];

    const workStart = targetDate.hour(parseInt(schedule.startTime.split(':')[0])).minute(parseInt(schedule.startTime.split(':')[1]));
    const workEnd = targetDate.hour(parseInt(schedule.endTime.split(':')[0])).minute(parseInt(schedule.endTime.split(':')[1]));

    // 2. Get busy slots from GCal
    const gcalBusySlots = await googleCalendarService.getBusySlots(
      workStart.toDate(),
      workEnd.toDate()
    );

    // 2.5 Get busy slots from DB (to prevent double bookings before GCal syncs)
    const dbAppointments = await prisma.appointment.findMany({
      where: {
        startTime: { gte: workStart.toDate() },
        endTime: { lte: workEnd.toDate() },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    // 2.75 Get manually blocked slots
    const blockedSlots = await prisma.blockedSlot.findMany({
      where: {
        date: {
          gte: targetDate.startOf('day').toDate(),
          lte: targetDate.endOf('day').toDate(),
        },
      },
    });

    const busySlots = [
      ...gcalBusySlots,
      ...dbAppointments.map((app) => ({
        start: app.startTime.toISOString(),
        end: app.endTime.toISOString(),
      })),
      ...blockedSlots.map((bs: any) => {
        const bsStart = targetDate.hour(parseInt(bs.startTime.split(':')[0])).minute(parseInt(bs.startTime.split(':')[1]));
        const bsEnd = targetDate.hour(parseInt(bs.endTime.split(':')[0])).minute(parseInt(bs.endTime.split(':')[1]));
        return {
          start: bsStart.toISOString(),
          end: bsEnd.toISOString(),
        };
      }),
    ];

    // 3. Generate 30-min slots
    const slots = [];
    let current = workStart;
    const now = dayjs();
    const isToday = targetDate.isSame(now, 'day');

    while (current.add(30, 'minute').isBefore(workEnd) || current.add(30, 'minute').isSame(workEnd)) {
      const slotStart = current;
      const slotEnd = current.add(30, 'minute');

      // Skip if slot is in the past for today
      if (isToday && slotStart.isBefore(now)) {
        current = current.add(30, 'minute');
        continue;
      }

      // Check if slot overlaps with any busy slot
      const isBusy = busySlots.some((busy) => {
        const busyStart = dayjs(busy.start);
        const busyEnd = dayjs(busy.end);
        return (
          (slotStart.isBefore(busyEnd) && slotStart.isAfter(busyStart)) ||
          (slotEnd.isAfter(busyStart) && slotEnd.isBefore(busyEnd)) ||
          (slotStart.isSame(busyStart) || slotEnd.isSame(busyEnd))
        );
      });

      if (!isBusy) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          label: slotStart.format('HH:mm'),
        });
      }

      current = current.add(30, 'minute');
    }

    return slots;
  }
}

export const availabilityService = new AvailabilityService();
