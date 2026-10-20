import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

export const courseTerms = ['Fall', 'Winter', 'Spring', 'Summer'] as const;

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const isValidMeeting = (meets: string) => {
  if (meets === '') return true;

  const match = meets.match(
    /^([A-Za-z]+) ((?:[01]?\d|2[0-3]):[0-5]\d)-((?:[01]?\d|2[0-3]):[0-5]\d)$/,
  );
  if (!match) return false;

  const [, dayText, start, end] = match;
  const days = dayText.match(/Tu|Th|Sa|Su|M|W|F/g) ?? [];
  const hasValidDays =
    days.join('') === dayText && new Set(days).size === days.length;

  return hasValidDays && timeToMinutes(start) < timeToMinutes(end);
};

export const CourseSchema = z.object({
  term: z.enum(courseTerms, { message: 'Choose a valid term' }),
  number: z
    .string()
    .regex(/^\d+(?:-\d+)?$/, 'Use a number with an optional section, e.g. 213-2'),
  meets: z.string().refine(isValidMeeting, {
    message: 'Use days and start-end, e.g. MWF 12:00-13:20',
  }),
  title: z.string().trim().min(2, 'Title must be at least 2 characters'),
});

export type Course = z.infer<typeof CourseSchema>;
export type Term = Course['term'];

export const courseResolver = zodResolver(CourseSchema);
