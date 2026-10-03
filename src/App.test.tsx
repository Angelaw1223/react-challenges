import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

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
      },
    },
  },
};

afterEach(() => {
  vi.restoreAllMocks();
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

    render(<App />);

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

    render(<App />);

    await screen.findByText('Computer Science Courses');
    fireEvent.click(screen.getByRole('button', { name: 'Course Plan (0)' }));

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'No courses selected',
    );
  });
});
