import { render, screen } from '@testing-library/react';
import Home from './Home';

describe('Home', () => {
  it('renders the welcome message', () => {
    render(<Home />);
    
    const heading = screen.getByRole('heading', { name: /welcome to e-kyc system/i });
    expect(heading).toBeInTheDocument();
  });

  it('displays feature cards', () => {
    render(<Home />);
    
    expect(screen.getByText(/Fast Development/i)).toBeInTheDocument();
    expect(screen.getByText(/Storybook Ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Testing Setup/i)).toBeInTheDocument();
    expect(screen.getByText(/API Mocking/i)).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<Home />);
    
    const getStartedButton = screen.getByRole('button', { name: /get started/i });
    const learnMoreButton = screen.getByRole('button', { name: /learn more/i });
    
    expect(getStartedButton).toBeInTheDocument();
    expect(learnMoreButton).toBeInTheDocument();
  });
});
