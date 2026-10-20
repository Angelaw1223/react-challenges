import { useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { db, signInWithGoogle, signOutUser } from './firebase';
import {
  courseResolver,
  courseTerms,
  type Course,
  type Term,
} from './types/course';
import { hasCourseConflict } from './utilities/timeConflicts';
import useAuthState from './utilities/useAuthState';
import useFirestoreDocument from './utilities/useFirestoreDocument';

const terms = ['Fall', 'Winter', 'Spring'] as const;

type Schedule = {
  title: string;
  courses: Record<string, Course>;
};

type CourseCardProps = {
  courseId: string;
  course: Course;
  selected: boolean;
  unavailable: boolean;
  toggleCourse: (courseId: string) => void;
  canEdit: boolean;
};

const CourseCard = ({
  courseId,
  course,
  selected,
  unavailable,
  toggleCourse,
  canEdit,
}: CourseCardProps) => (
  <li
    className={
      selected
        ? 'flex min-h-52 flex-col rounded-lg border-2 border-blue-700 bg-blue-50 shadow-sm'
        : unavailable
          ? 'flex min-h-52 flex-col rounded-lg border border-gray-300 bg-gray-100 opacity-50 shadow-sm'
          : 'flex min-h-52 flex-col rounded-lg border border-gray-300 shadow-sm hover:border-blue-400 hover:bg-gray-50'
    }
  >
    <button
      type="button"
      data-course-id={courseId}
      aria-pressed={selected}
      disabled={unavailable}
      aria-label={
        (unavailable ? 'Unavailable ' : selected ? 'Unselect ' : 'Select ') +
        course.term +
        ' CS ' +
        course.number
      }
      className="flex w-full grow flex-col p-4 text-left disabled:cursor-not-allowed"
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
        {unavailable && (
          <span className="rounded-full bg-gray-700 px-2 py-1 text-xs font-medium text-white">
            Conflict
          </span>
        )}
      </div>
      <p className="mt-2 grow text-base">{course.title}</p>
      <p className="mt-4 w-full border-t border-gray-300 pt-3 text-sm">
        {course.meets}
      </p>
    </button>
    {canEdit && (
      <Link
        to={`/courses/${courseId}/edit`}
        aria-label={`Edit ${course.term} CS ${course.number}`}
        className="m-3 mt-0 rounded-md border border-gray-400 px-3 py-2 text-center text-sm font-medium hover:bg-white"
      >
        Edit
      </Link>
    )}
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
  canEdit: boolean;
};

const CourseList = ({
  courses,
  selectedTerm,
  selectedCourseIds,
  toggleCourse,
  canEdit,
}: CourseListProps) => {
  const selectedCourses = selectedCourseIds.map(
    (courseId) => courses[courseId],
  );

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,_minmax(12rem,_1fr))] items-stretch gap-3">
      {Object.entries(courses)
        .filter(([, course]) => course.term === selectedTerm)
        .map(([courseId, course]) => {
          const selected = selectedCourseIds.includes(courseId);

          return (
            <CourseCard
              key={courseId}
              courseId={courseId}
              course={course}
              selected={selected}
              unavailable={
                !selected && hasCourseConflict(course, selectedCourses)
              }
              toggleCourse={toggleCourse}
              canEdit={canEdit}
            />
          );
        })}
    </ul>
  );
};

type TermPageProps = {
  schedule: Schedule;
  canEdit: boolean;
};

const TermPage = ({ schedule, canEdit }: TermPageProps) => {
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
        canEdit={canEdit}
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

type CourseEditorProps = {
  courseId: string;
  course: Course;
};

const CourseEditor = ({ courseId, course }: CourseEditorProps) => {
  const navigate = useNavigate();
  const [saveError, setSaveError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<Course>({
    defaultValues: course,
    mode: 'onChange',
    resolver: courseResolver,
  });

  const saveCourse = async (changedCourse: Course) => {
    setSaveError(null);

    try {
      await updateDoc(doc(db, 'schedules', 'CS-2018-2019'), {
        [`courses.${courseId}`]: changedCourse,
      });
      navigate('/');
    } catch (reason) {
      setSaveError(
        reason instanceof Error ? reason.message : 'The course could not be saved',
      );
    }
  };

  const inputClass = (hasError: boolean) =>
    `mt-2 block w-full rounded-md border px-3 py-2 font-normal ${
      hasError ? 'border-red-600' : 'border-gray-400'
    }`;

  return (
    <main className="mx-auto max-w-xl p-4 font-sans">
      <h1 className="mb-5 text-3xl font-bold">
        Edit {course.term} CS {course.number}
      </h1>
      <form
        className="space-y-5 rounded-lg border border-gray-300 p-5 shadow-sm"
        onSubmit={handleSubmit(saveCourse)}
      >
        <div>
          <label htmlFor="course-title" className="block font-medium">
            Course title
          </label>
          <input
            id="course-title"
            type="text"
            className={inputClass(Boolean(errors.title))}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'course-title-error' : undefined}
            {...register('title')}
          />
          {errors.title && (
            <p id="course-title-error" role="alert" className="mt-1 text-sm text-red-700">
              {errors.title.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="course-term" className="block font-medium">
            Term
          </label>
          <select
            id="course-term"
            className={inputClass(Boolean(errors.term))}
            aria-invalid={Boolean(errors.term)}
            aria-describedby={errors.term ? 'course-term-error' : undefined}
            {...register('term')}
          >
            {courseTerms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
          {errors.term && (
            <p id="course-term-error" role="alert" className="mt-1 text-sm text-red-700">
              {errors.term.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="course-number" className="block font-medium">
            Course number
          </label>
          <input
            id="course-number"
            type="text"
            className={inputClass(Boolean(errors.number))}
            aria-invalid={Boolean(errors.number)}
            aria-describedby={
              errors.number ? 'course-number-error' : undefined
            }
            {...register('number')}
          />
          {errors.number && (
            <p id="course-number-error" role="alert" className="mt-1 text-sm text-red-700">
              {errors.number.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="course-meets" className="block font-medium">
            Meeting time
          </label>
          <input
            id="course-meets"
            type="text"
            className={inputClass(Boolean(errors.meets))}
            aria-invalid={Boolean(errors.meets)}
            aria-describedby={errors.meets ? 'course-meets-error' : undefined}
            {...register('meets')}
          />
          {errors.meets && (
            <p id="course-meets-error" role="alert" className="mt-1 text-sm text-red-700">
              {errors.meets.message}
            </p>
          )}
        </div>
        {saveError && (
          <p role="alert" className="text-sm text-red-700">
            Unable to save course: {saveError}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!isDirty || !isValid || isSubmitting}
            className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className="rounded-md border border-gray-400 px-4 py-2 font-medium hover:bg-gray-100"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
};

type CourseFormProps = {
  courses: Record<string, Course>;
  user: User | null;
  authLoading: boolean;
};

const CourseForm = ({ courses, user, authLoading }: CourseFormProps) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = courseId === undefined ? undefined : courses[courseId];

  if (authLoading) {
    return <main className="p-4 font-sans">Checking sign-in...</main>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (courseId === undefined || !course) {
    return (
      <main className="mx-auto max-w-xl p-4 font-sans">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <button
          type="button"
          className="mt-4 rounded-md border border-gray-400 px-4 py-2 font-medium"
          onClick={() => navigate('/')}
        >
          Return to course list
        </button>
      </main>
    );
  }

  return <CourseEditor courseId={courseId} course={course} />;
};

type BannerProps = {
  user: User | null;
  loading: boolean;
};

const Banner = ({ user, loading }: BannerProps) => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const changeAuthentication = async () => {
    setAuthError(null);
    setWorking(true);

    try {
      if (user) {
        await signOutUser();
      } else {
        await signInWithGoogle();
      }
    } catch (reason) {
      setAuthError(
        reason instanceof Error ? reason.message : 'Authentication failed',
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <header className="border-b border-gray-300 bg-gray-50 px-4 py-3 font-sans">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p>
          {loading
            ? 'Checking sign-in...'
            : user
              ? `Welcome, ${user.displayName ?? user.email ?? 'user'}`
              : 'Welcome, guest'}
        </p>
        <button
          type="button"
          disabled={loading || working}
          className="rounded-md bg-gray-800 px-4 py-2 font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          onClick={changeAuthentication}
        >
          {working ? 'Please wait...' : user ? 'Sign out' : 'Sign in'}
        </button>
      </div>
      {authError && (
        <p role="alert" className="mx-auto mt-2 max-w-7xl text-sm text-red-700">
          Unable to change sign-in: {authError}
        </p>
      )}
    </header>
  );
};

const App = () => {
  const { user, loading: authLoading } = useAuthState();
  const { data: schedule, loading, error } =
    useFirestoreDocument<Schedule>('schedules/CS-2018-2019');

  if (loading) {
    return (
      <>
        <Banner user={user} loading={authLoading} />
        <main className="p-4 font-sans">Loading courses...</main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Banner user={user} loading={authLoading} />
        <main className="p-4 font-sans">
          Unable to load courses: {error.message}
        </main>
      </>
    );
  }

  if (!schedule) {
    return (
      <>
        <Banner user={user} loading={authLoading} />
        <main className="p-4 font-sans">Course schedule not found.</main>
      </>
    );
  }

  return (
    <>
      <Banner user={user} loading={authLoading} />
      <Routes>
        <Route
          path="/"
          element={<TermPage schedule={schedule} canEdit={Boolean(user)} />}
        />
        <Route
          path="/courses/:courseId/edit"
          element={
            <CourseForm
              courses={schedule.courses}
              user={user}
              authLoading={authLoading}
            />
          }
        />
      </Routes>
    </>
  );
};

export default App;
