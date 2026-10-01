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

const CourseCard = ({ course }: { course: Course }) => (
  <li className="flex min-h-52 flex-col rounded-lg border border-gray-300 p-4 shadow-sm">
    <h2 className="text-xl font-medium">
      {course.term} CS {course.number}
    </h2>
    <p className="mt-2 grow text-base">{course.title}</p>
    <p className="mt-4 border-t border-gray-300 pt-3 text-sm">
      {course.meets}
    </p>
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

type CourseListProps = {
  courses: Record<string, Course>;
  selectedTerm: Term;
};

const CourseList = ({ courses, selectedTerm }: CourseListProps) => (
  <ul className="grid grid-cols-[repeat(auto-fill,_minmax(12rem,_1fr))] items-stretch gap-3">
    {Object.entries(courses)
      .filter(([, course]) => course.term === selectedTerm)
      .map(([courseId, course]) => (
        <CourseCard key={courseId} course={course} />
      ))}
  </ul>
);

const TermPage = ({ schedule }: { schedule: Schedule }) => {
  const [selectedTerm, setSelectedTerm] = useState<Term>('Fall');

  return (
    <main className="mx-auto max-w-7xl p-4 font-sans">
      <h1 className="mb-5 text-3xl font-bold">{schedule.title}</h1>
      <TermSelector
        selectedTerm={selectedTerm}
        setSelectedTerm={setSelectedTerm}
      />
      <CourseList
        courses={schedule.courses}
        selectedTerm={selectedTerm}
      />
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
