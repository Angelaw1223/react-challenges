import useJsonQuery from './utilities/useJsonQuery';

type Course = {
  term: string;
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

  return (
    <main className="mx-auto max-w-7xl p-4 font-sans">
      <h1 className="mb-5 text-3xl font-bold">{schedule.title}</h1>
      <ul className="grid grid-cols-[repeat(auto-fill,_minmax(12rem,_1fr))] items-stretch gap-3">
        {Object.entries(schedule.courses).map(([courseId, course]) => (
          <CourseCard key={courseId} course={course} />
        ))}
      </ul>
    </main>
  );
};

export default App;
