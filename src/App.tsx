import { useState } from 'react';
import useJsonQuery from './utilities/useJsonQuery';

const terms = ['Fall', 'Winter', 'Spring'] as const;
type Term = (typeof terms)[number];

type Course = {
  term: Term;
  number: string;
  meets: string;
  title: string;
};

type Schedule = {
  title: string;
  courses: Record<string, Course>;
};

type ScheduleData = {
  schedules: Record<string, Schedule>;
};

const dataUrl =
  'https://courses.cs.northwestern.edu/394/guides/data/cs-courses-firestore.php';

type CourseCardProps = {
  courseId: string;
  course: Course;
  selected: boolean;
  toggleCourse: (courseId: string) => void;
};

const CourseCard = ({
  courseId,
  course,
  selected,
  toggleCourse,
}: CourseCardProps) => (
  <li className="min-h-52">
    <button
      type="button"
      data-course-id={courseId}
      aria-pressed={selected}
      aria-label={
        (selected ? 'Unselect ' : 'Select ') +
        course.term +
        ' CS ' +
        course.number
      }
      className={
        selected
          ? 'flex h-full w-full flex-col rounded-lg border-2 border-blue-700 bg-blue-50 p-4 text-left shadow-sm'
          : 'flex h-full w-full flex-col rounded-lg border border-gray-300 p-4 text-left shadow-sm hover:border-blue-400 hover:bg-gray-50'
      }
      onClick={() => toggleCourse(courseId)}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <h2 className="text-xl font-medium">
          {course.term} CS {course.number}
        </h2>
        {selected && (
          <span className="rounded-full bg-blue-700 px-2 py-1 text-xs font-medium text-white">
            Selected
          </span>
        )}
      </div>
      <p className="mt-2 grow text-base">{course.title}</p>
      <p className="mt-4 w-full border-t border-gray-300 pt-3 text-sm">
        {course.meets}
      </p>
    </button>
  </li>
);

type TermSelectorProps = {
  selectedTerm: Term;
  setSelectedTerm: (term: Term) => void;
};

const TermSelector = ({
  selectedTerm,
  setSelectedTerm,
}: TermSelectorProps) => (
  <div
    className="mb-5 flex flex-wrap gap-2"
    role="group"
    aria-label="Select a term"
  >
    {terms.map((term) => (
      <button
        key={term}
        type="button"
        aria-pressed={term === selectedTerm}
        className={
          term === selectedTerm
            ? 'rounded-md bg-blue-700 px-4 py-2 font-medium text-white'
            : 'rounded-md border border-gray-300 px-4 py-2 font-medium hover:bg-gray-100'
        }
        onClick={() => setSelectedTerm(term)}
      >
        {term}
      </button>
    ))}
  </div>
);

type CoursePlanProps = {
  courses: Record<string, Course>;
  selectedCourseIds: string[];
  close: () => void;
};

const CoursePlan = ({
  courses,
  selectedCourseIds,
  close,
}: CoursePlanProps) => {
  const selectedCourses = selectedCourseIds
    .map((courseId) => courses[courseId])
    .filter((course) => course !== undefined);

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-4"
      onClick={close}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-plan-title"
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="course-plan-title" className="text-2xl font-bold">
            Course Plan
          </h2>
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-1 font-medium hover:bg-gray-100"
            onClick={close}
          >
            Close
          </button>
        </div>

        {selectedCourses.length === 0 ? (
          <p className="mt-5">
            No courses selected. Close this window and click a course card to
            add it to your plan.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {selectedCourses.map((course) => (
              <li
                key={`${course.term}-${course.number}`}
                className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
              >
                <h3 className="font-semibold">
                  {course.term} CS {course.number}: {course.title}
                </h3>
                <p className="mt-1 text-sm text-gray-700">{course.meets}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

type CourseListProps = {
  courses: Record<string, Course>;
  selectedTerm: Term;
  selectedCourseIds: string[];
  toggleCourse: (courseId: string) => void;
};

const CourseList = ({
  courses,
  selectedTerm,
  selectedCourseIds,
  toggleCourse,
}: CourseListProps) => (
  <ul className="grid grid-cols-[repeat(auto-fill,_minmax(12rem,_1fr))] items-stretch gap-3">
    {Object.entries(courses)
      .filter(([, course]) => course.term === selectedTerm)
      .map(([courseId, course]) => (
        <CourseCard
          key={courseId}
          courseId={courseId}
          course={course}
          selected={selectedCourseIds.includes(courseId)}
          toggleCourse={toggleCourse}
        />
      ))}
  </ul>
);

const TermPage = ({ schedule }: { schedule: Schedule }) => {
  const [selectedTerm, setSelectedTerm] = useState<Term>('Fall');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [planOpen, setPlanOpen] = useState(false);

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((currentIds) =>
      currentIds.includes(courseId)
        ? currentIds.filter((id) => id !== courseId)
        : [...currentIds, courseId],
    );
  };

  return (
    <main className="mx-auto max-w-7xl p-4 font-sans">
      <h1 className="mb-5 text-3xl font-bold">{schedule.title}</h1>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <TermSelector
          selectedTerm={selectedTerm}
          setSelectedTerm={setSelectedTerm}
        />
        <button
          type="button"
          className="rounded-md bg-gray-800 px-4 py-2 font-medium text-white hover:bg-gray-700"
          onClick={() => setPlanOpen(true)}
        >
          Course Plan ({selectedCourseIds.length})
        </button>
      </div>
      <CourseList
        courses={schedule.courses}
        selectedTerm={selectedTerm}
        selectedCourseIds={selectedCourseIds}
        toggleCourse={toggleCourse}
      />
      {planOpen && (
        <CoursePlan
          courses={schedule.courses}
          selectedCourseIds={selectedCourseIds}
          close={() => setPlanOpen(false)}
        />
      )}
    </main>
  );
};

const App = () => {
  const { data, loading, error } = useJsonQuery<ScheduleData>(dataUrl);

  if (loading) {
    return <main className="p-4 font-sans">Loading courses...</main>;
  }

  if (error) {
    return (
      <main className="p-4 font-sans">
        Unable to load courses: {error.message}
      </main>
    );
  }

  const schedule = data?.schedules['CS-2018-2019'];

  if (!schedule) {
    return <main className="p-4 font-sans">Course schedule not found.</main>;
  }

  return <TermPage schedule={schedule} />;
};

export default App;
