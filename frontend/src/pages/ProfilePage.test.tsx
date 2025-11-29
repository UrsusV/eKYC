import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProfilePage', () => {
  it('renders the page title', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Your Profile')).toBeInTheDocument();
  });

  it('displays user information', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Ahmed Rahman')).toBeInTheDocument();
    expect(screen.getByText('ahmed.rahman@example.com')).toBeInTheDocument();
  });

  it('shows edit button in view mode', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('switches to edit mode when edit button is clicked', () => {
    renderWithRouter(<ProfilePage />);
    
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('displays input fields in edit mode', () => {
    renderWithRouter(<ProfilePage />);
    
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Check for input fields (should find multiple inputs)
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('cancels edit mode when cancel is clicked', () => {
    renderWithRouter(<ProfilePage />);
    
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('saves changes when save button is clicked', () => {
    renderWithRouter(<ProfilePage />);
    
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('displays user avatar with initials', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('AR')).toBeInTheDocument();
  });

  it('displays security section', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByText('Enable Two-Factor Authentication')).toBeInTheDocument();
  });

  it('displays recent activity section', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('shows NID as non-editable field', () => {
    renderWithRouter(<ProfilePage />);
    
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    expect(screen.getByText('Cannot be changed')).toBeInTheDocument();
  });

  it('displays user role badge', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Credential Holder')).toBeInTheDocument();
  });
});
