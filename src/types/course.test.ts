import { describe, expect, it } from 'vitest';
import { CourseSchema } from './course';

const validCourse = {
  term: 'Fall',
  number: '213-2',
  meets: 'TuTh 14:00-15:20',
  title: 'Data Structures',
};

describe('CourseSchema', () => {
  it('accepts a valid course and an empty meeting time', () => {
    expect(CourseSchema.safeParse(validCourse).success).toBe(true);
    expect(
      CourseSchema.safeParse({ ...validCourse, meets: '' }).success,
    ).toBe(true);
  });

  it('rejects invalid titles, terms, and course numbers', () => {
    expect(
      CourseSchema.safeParse({ ...validCourse, title: 'X' }).success,
    ).toBe(false);
    expect(
      CourseSchema.safeParse({ ...validCourse, term: 'Autumn' }).success,
    ).toBe(false);
    expect(
      CourseSchema.safeParse({ ...validCourse, number: 'CS 213' }).success,
    ).toBe(false);
  });

  it('rejects invalid meeting days and times', () => {
    expect(
      CourseSchema.safeParse({ ...validCourse, meets: 'MMW 9:00-9:50' })
        .success,
    ).toBe(false);
    expect(
      CourseSchema.safeParse({ ...validCourse, meets: 'MWF 25:00-26:00' })
        .success,
    ).toBe(false);
    expect(
      CourseSchema.safeParse({ ...validCourse, meets: 'MWF 12:00-11:00' })
        .success,
    ).toBe(false);
  });
});
