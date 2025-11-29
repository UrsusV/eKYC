import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SettingsPage', () => {
  it('renders the page title', () => {
    renderWithRouter(<SettingsPage />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('displays notifications section', () => {
    renderWithRouter(<SettingsPage />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('Push Notifications')).toBeInTheDocument();
    expect(screen.getByText('SMS Notifications')).toBeInTheDocument();
  });

  it('displays privacy section', () => {
    renderWithRouter(<SettingsPage />);
    expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
    expect(screen.getByText('Public Profile')).toBeInTheDocument();
    expect(screen.getByText('Show Email')).toBeInTheDocument();
    expect(screen.getByText('Share Analytics')).toBeInTheDocument();
  });

  it('displays appearance section', () => {
    renderWithRouter(<SettingsPage />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('displays danger zone section', () => {
    renderWithRouter(<SettingsPage />);
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });

  it('shows save button when changes are made', () => {
    renderWithRouter(<SettingsPage />);
    
    // Initially no save button
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();

    // Toggle a setting
    const toggleButtons = screen.getAllByRole('button');
    const emailToggle = toggleButtons.find(btn => 
      btn.parentElement?.textContent?.includes('Email Notifications')
    );
    
    if (emailToggle) {
      fireEvent.click(emailToggle);
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    }
  });

  it('displays theme options', () => {
    renderWithRouter(<SettingsPage />);
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('displays language dropdown', () => {
    renderWithRouter(<SettingsPage />);
    const languageSelect = screen.getByRole('combobox');
    expect(languageSelect).toBeInTheDocument();
  });

  it('changes theme when theme button is clicked', () => {
    renderWithRouter(<SettingsPage />);
    
    const darkButton = screen.getByText('Dark');
    fireEvent.click(darkButton);

    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('saves settings when save button is clicked', () => {
    renderWithRouter(<SettingsPage />);
    
    // Make a change
    const toggleButtons = screen.getAllByRole('button');
    const firstToggle = toggleButtons[0];
    if (firstToggle) {
      fireEvent.click(firstToggle);
    }

    // Save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Save button should disappear
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
  });

  it('resets settings when reset button is clicked', () => {
    renderWithRouter(<SettingsPage />);
    
    // Make a change
    const toggleButtons = screen.getAllByRole('button');
    const firstToggle = toggleButtons[0];
    if (firstToggle) {
      fireEvent.click(firstToggle);
    }

    // Reset
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    // Save button should disappear
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
  });

  it('has warning message for delete account', () => {
    renderWithRouter(<SettingsPage />);
    expect(
      screen.getByText(/once you delete your account, there is no going back/i)
    ).toBeInTheDocument();
  });
});
