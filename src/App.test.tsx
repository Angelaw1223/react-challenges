import '@testing-library/jest-dom/vitest';
import type { User } from 'firebase/auth';
import { updateDoc } from 'firebase/firestore';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { signInWithGoogle, signOutUser } from './firebase';
import useAuthState from './utilities/useAuthState';
import useFirestoreDocument from './utilities/useFirestoreDocument';

vi.mock('./firebase', () => ({
  db: {},
  signInWithGoogle: vi.fn(() => Promise.resolve()),
  signOutUser: vi.fn(() => Promise.resolve()),
}));
vi.mock('./utilities/useAuthState', () => ({ default: vi.fn() }));
vi.mock('./utilities/useFirestoreDocument', () => ({ default: vi.fn() }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ path: 'schedules/CS-2018-2019' })),
  updateDoc: vi.fn(() => Promise.resolve()),
}));

const renderApp = (initialEntries = ['/']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>,
  );

const signedInUser = {
  displayName: 'Angela Wan',
  email: 'angela.wan1223@gmail.com',
} as User;

const scheduleData = {
  schedules: {
    'CS-2018-2019': {
      title: 'Computer Science Courses',
      courses: {
        F101: {
          term: 'Fall',
          number: '101',
          meets: 'MWF 11:00-11:50',
          title: 'Introduction to Computer Science',
        },
        F110: {
          term: 'Fall',
          number: '110',
          meets: 'MWF 11:30-12:20',
          title: 'Introduction to Programming',
        },
      },
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuthState).mockReturnValue({
    user: signedInUser,
    loading: false,
  });
  vi.mocked(useFirestoreDocument).mockReturnValue({
    data: scheduleData.schedules['CS-2018-2019'],
    loading: false,
    error: null,
  });
});

describe('authentication', () => {
  it('lets a guest sign in but does not show course editing', async () => {
    vi.mocked(useAuthState).mockReturnValue({ user: null, loading: false });
    renderApp();

    await screen.findByText('Computer Science Courses');
    expect(screen.getByText('Welcome, guest')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Edit Fall CS 101' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledOnce());
  });

  it('shows editing and sign out to an authenticated user', async () => {
    renderApp();

    expect(await screen.findByText('Welcome, Angela Wan')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Edit Fall CS 101' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(signOutUser).toHaveBeenCalledOnce());
  });

  it('redirects a guest away from an edit URL', async () => {
    vi.mocked(useAuthState).mockReturnValue({ user: null, loading: false });
    renderApp(['/courses/F101/edit']);

    expect(
      await screen.findByText('Computer Science Courses'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Course title' }),
    ).not.toBeInTheDocument();
  });
});

describe('course plan', () => {
  it('shows selected courses and handles inside and outside clicks', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(scheduleData),
      }),
    );

    renderApp();

    const course = await screen.findByRole('button', {
      name: 'Select Fall CS 101',
    });
    fireEvent.click(course);
    fireEvent.click(screen.getByRole('button', { name: 'Course Plan (1)' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(
      'Fall CS 101: Introduction to Computer Science',
    );
    expect(dialog).toHaveTextContent('MWF 11:00-11:50');

    fireEvent.click(dialog);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(dialog.parentElement!);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('explains how to add a course when the plan is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(scheduleData),
      }),
    );

    renderApp();

    await screen.findByText('Computer Science Courses');
    fireEvent.click(screen.getByRole('button', { name: 'Course Plan (0)' }));

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'No courses selected',
    );
  });
});

describe('time conflicts', () => {
  it('blocks a conflicting course until the selected course is removed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(scheduleData),
      }),
    );

    renderApp();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Select Fall CS 101' }),
    );

    const conflictingCourse = screen.getByRole('button', {
      name: 'Unavailable Fall CS 110',
    });
    expect(conflictingCourse).toBeDisabled();
    expect(conflictingCourse).toHaveTextContent('Conflict');

    fireEvent.click(
      screen.getByRole('button', { name: 'Unselect Fall CS 101' }),
    );

    expect(
      screen.getByRole('button', { name: 'Select Fall CS 110' }),
    ).toBeEnabled();
  });
});

describe('course form', () => {
  it('loads a course into the form and cancels without changing it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(scheduleData),
      }),
    );

    renderApp();

    fireEvent.click(
      await screen.findByRole('link', { name: 'Edit Fall CS 101' }),
    );

    const title = screen.getByRole('textbox', { name: 'Course title' });
    const meeting = screen.getByRole('textbox', { name: 'Meeting time' });
    expect(title).toHaveValue('Introduction to Computer Science');
    expect(meeting).toHaveValue('MWF 11:00-11:50');

    fireEvent.change(title, { target: { value: 'Changed title' } });
    expect(title).toHaveValue('Changed title');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.getByText('Introduction to Computer Science'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Changed title')).not.toBeInTheDocument();
  });

  it('shows helpful messages when fields are invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(scheduleData),
      }),
    );

    renderApp();
    fireEvent.click(
      await screen.findByRole('link', { name: 'Edit Fall CS 101' }),
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Course title' }), {
      target: { value: 'X' },
    });
    expect(
      await screen.findByText('Title must be at least 2 characters'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Course number' }), {
      target: { value: 'CS 101' },
    });
    expect(
      await screen.findByText(
        'Use a number with an optional section, e.g. 213-2',
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Meeting time' }), {
      target: { value: 'MWF 12:00-11:00' },
    });
    expect(
      await screen.findByText(
        'Use days and start-end, e.g. MWF 12:00-13:20',
      ),
    ).toBeInTheDocument();
  });

  it('saves only a valid changed course', async () => {
    renderApp();
    fireEvent.click(
      await screen.findByRole('link', { name: 'Edit Fall CS 101' }),
    );

    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Course title' }), {
      target: { value: 'Computing Fundamentals' },
    });

    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          'courses.F101': {
            term: 'Fall',
            number: '101',
            meets: 'MWF 11:00-11:50',
            title: 'Computing Fundamentals',
          },
        },
      );
    });
    expect(
      await screen.findByText('Computer Science Courses'),
    ).toBeInTheDocument();
  });
});
