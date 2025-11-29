import { render, screen, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

// Test component that uses the toast hook
const TestComponent = () => {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success('Success message')}>Show Success</button>
      <button onClick={() => toast.error('Error message')}>Show Error</button>
      <button onClick={() => toast.warning('Warning message')}>Show Warning</button>
      <button onClick={() => toast.info('Info message')}>Show Info</button>
    </div>
  );
};

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders ToastProvider without errors', () => {
    render(
      <ToastProvider>
        <div>Test</div>
      </ToastProvider>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('displays success toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });
  });

  it('displays error toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Error');
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  it('displays warning toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Warning');
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  it('displays info toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Info');
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });
  });

  it('auto-dismisses toast after duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    // Fast-forward time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  it('displays multiple toasts simultaneously', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
      screen.getByText('Show Error').click();
    });

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  it('removes toast when close button is clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    act(() => {
      closeButton.click();
    });

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });
});
