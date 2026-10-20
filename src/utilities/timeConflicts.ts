type CourseMeeting = {
  term: string;
  meets: string;
};

type Meeting = {
  days: string[];
  start: number;
  end: number;
};

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const parseMeeting = (meets: string): Meeting | null => {
  if (meets === '') return null;

  const [dayText, timeText] = meets.split(' ');
  const [start, end] = timeText.split('-');

  return {
    days: dayText.match(/Tu|Th|Sa|Su|M|W|F/g) ?? [],
    start: timeToMinutes(start),
    end: timeToMinutes(end),
  };
};

const meetingsOverlap = (first: Meeting, second: Meeting) => {
  const shareDay = first.days.some((day) => second.days.includes(day));
  const shareTime = first.start < second.end && second.start < first.end;

  return shareDay && shareTime;
};

const coursesConflict = (first: CourseMeeting, second: CourseMeeting) => {
  if (first.term !== second.term) return false;

  const firstMeeting = parseMeeting(first.meets);
  const secondMeeting = parseMeeting(second.meets);

  return (
    firstMeeting !== null &&
    secondMeeting !== null &&
    meetingsOverlap(firstMeeting, secondMeeting)
  );
};

export const hasCourseConflict = (
  course: CourseMeeting,
  selectedCourses: CourseMeeting[],
) => selectedCourses.some((selected) => coursesConflict(course, selected));
