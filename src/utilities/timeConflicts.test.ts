import { describe, expect, it } from 'vitest';
import { hasCourseConflict } from './timeConflicts';

const course = (term: string, meets: string) => ({ term, meets });

describe('hasCourseConflict', () => {
  it('finds courses with a shared day and overlapping time', () => {
    expect(
      hasCourseConflict(course('Fall', 'TuTh 14:00-15:20'), [
        course('Fall', 'Tu 15:00-16:00'),
      ]),
    ).toBe(true);
  });

  it('allows courses in different terms or with adjacent times', () => {
    expect(
      hasCourseConflict(course('Winter', 'MWF 9:00-9:50'), [
        course('Fall', 'MWF 9:00-9:50'),
      ]),
    ).toBe(false);
    expect(
      hasCourseConflict(course('Fall', 'MWF 9:50-10:40'), [
        course('Fall', 'MWF 9:00-9:50'),
      ]),
    ).toBe(false);
  });

  it('allows courses with no meeting time', () => {
    expect(
      hasCourseConflict(course('Fall', ''), [
        course('Fall', 'MWF 9:00-9:50'),
      ]),
    ).toBe(false);
  });
});
