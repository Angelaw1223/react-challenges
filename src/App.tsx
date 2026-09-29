const schedules = {
  'CS-2018-2019': {
    title: 'CS Courses for 2018-2019',
    courses: {
      F101: {
        term: 'Fall',
        number: '101',
        meets: 'MWF 11:00-11:50',
        title: 'Computer Science: Concepts, Philosophy, and Connections',
      },
      F110: {
        term: 'Fall',
        number: '110',
        meets: 'MWF 10:00-10:50',
        title: 'Intro Programming for non-majors',
      },
      S313: {
        term: 'Spring',
        number: '313',
        meets: 'TuTh 15:30-16:50',
        title: 'Tangible Interaction Design and Learning',
      },
      S314: {
        term: 'Spring',
        number: '314',
        meets: 'TuTh 9:30-10:50',
        title: 'Tech & Human Interaction',
      },
    },
  },
};

const schedule = schedules['CS-2018-2019'];

type Course = (typeof schedule.courses)[keyof typeof schedule.courses];

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

const App = () => (
  <main className="mx-auto max-w-7xl p-4 font-sans">
    <h1 className="mb-5 text-3xl font-bold">{schedule.title}</h1>
    <ul className="grid grid-cols-[repeat(auto-fill,_minmax(12rem,_1fr))] items-stretch gap-3">
      {Object.entries(schedule.courses).map(([courseId, course]) => (
        <CourseCard key={courseId} course={course} />
      ))}
    </ul>
  </main>
);

export default App;
