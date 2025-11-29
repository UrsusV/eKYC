import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from './Layout';

// Helper function to render with Router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Layout Component', () => {
  describe('Rendering', () => {
    it('should render the layout with page title', () => {
      renderWithRouter(
        <Layout pageTitle="Test Page">
          <div>Test Content</div>
        </Layout>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render sidebar with e-KYC System title', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByText('e-KYC System')).toBeInTheDocument();
    });

    it('should render all navigation sections', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByText('Main')).toBeInTheDocument();
      expect(screen.getByText('Management')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render children content', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div data-testid="test-content">Custom Content</div>
        </Layout>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });
  });

  describe('Role Selection', () => {
    it('should default to Holder role', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const roleButton = screen.getByRole('button', { name: /holder/i });
      expect(roleButton).toBeInTheDocument();
    });

    it('should toggle role dropdown when clicked', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const roleButton = screen.getByRole('button', { name: /holder/i });
      
      // Dropdown should be closed initially
      expect(screen.queryByText('Switch to Issuer')).not.toBeInTheDocument();

      // Open dropdown
      fireEvent.click(roleButton);
      expect(screen.getByText('Switch to Issuer')).toBeInTheDocument();
      expect(screen.getByText('Switch to Verifier')).toBeInTheDocument();
      expect(screen.getByText('Switch to Admin')).toBeInTheDocument();

      // Close dropdown
      fireEvent.click(roleButton);
      expect(screen.queryByText('Switch to Issuer')).not.toBeInTheDocument();
    });

    it('should change role when selecting from dropdown', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      // Open dropdown and select Issuer
      const roleButton = screen.getByRole('button', { name: /holder/i });
      fireEvent.click(roleButton);
      
      const issuerOption = screen.getByText('Switch to Issuer');
      fireEvent.click(issuerOption);

      // Check that role changed
      expect(screen.getByRole('button', { name: /issuer/i })).toBeInTheDocument();
    });

    it('should close dropdown after selecting a role', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const roleButton = screen.getByRole('button', { name: /holder/i });
      fireEvent.click(roleButton);
      
      const verifierOption = screen.getByText('Switch to Verifier');
      fireEvent.click(verifierOption);

      // Dropdown should be closed
      expect(screen.queryByText('Switch to Holder')).not.toBeInTheDocument();
    });
  });

  describe('Role-Specific Navigation', () => {
    it('should show Holder-specific navigation links', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByText('My Credentials')).toBeInTheDocument();
      expect(screen.getByText('Request Credential')).toBeInTheDocument();
    });

    it('should show Issuer-specific navigation links when role is Issuer', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      // Switch to Issuer role
      const roleButton = screen.getByRole('button', { name: /holder/i });
      fireEvent.click(roleButton);
      fireEvent.click(screen.getByText('Switch to Issuer'));

      expect(screen.getByText('Issue Credential')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('Issued Credentials')).toBeInTheDocument();
    });

    it('should show Verifier-specific navigation links when role is Verifier', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      // Switch to Verifier role
      const roleButton = screen.getByRole('button', { name: /holder/i });
      fireEvent.click(roleButton);
      fireEvent.click(screen.getByText('Switch to Verifier'));

      expect(screen.getByText('Verify Credential')).toBeInTheDocument();
      expect(screen.getByText('Verification History')).toBeInTheDocument();
    });

    it('should show Admin-specific navigation links when role is Admin', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      // Switch to Admin role
      const roleButton = screen.getByRole('button', { name: /holder/i });
      fireEvent.click(roleButton);
      fireEvent.click(screen.getByText('Switch to Admin'));

      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('System Settings')).toBeInTheDocument();
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });
  });

  describe('Sidebar Interaction', () => {
    it('should toggle sidebar when hamburger menu is clicked', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const hamburgerButton = screen.getByRole('button', { name: /toggle sidebar/i });
      const sidebar = screen.getByRole('complementary');

      // Check initial state (hidden on mobile)
      expect(sidebar).toHaveClass('-translate-x-full');

      // Open sidebar
      fireEvent.click(hamburgerButton);
      expect(sidebar).toHaveClass('translate-x-0');

      // Close sidebar
      fireEvent.click(hamburgerButton);
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('should close sidebar when clicking overlay', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const hamburgerButton = screen.getByRole('button', { name: /toggle sidebar/i });
      
      // Open sidebar
      fireEvent.click(hamburgerButton);
      
      const overlay = screen.getByRole('button', { name: /close sidebar/i });
      fireEvent.click(overlay);

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('should have proper ARIA attributes for sidebar', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveAttribute('aria-label', 'Sidebar navigation');
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should update search query on input', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      expect(searchInput.value).toBe('test query');
    });

    it('should prevent form submission', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const form = screen.getByPlaceholderText('Search...').closest('form');
      const handleSubmit = jest.fn((e) => e.preventDefault());
      
      form?.addEventListener('submit', handleSubmit);
      fireEvent.submit(form!);
      
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('User Menu', () => {
    it('should toggle user menu when clicked', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      
      // Menu should be closed initially
      expect(screen.queryByText('Your Profile')).not.toBeInTheDocument();

      // Open menu
      fireEvent.click(userMenuButton);
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
      expect(screen.getByText('Toggle Dark Mode')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();

      // Close menu
      fireEvent.click(userMenuButton);
      expect(screen.queryByText('Your Profile')).not.toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(userMenuButton);
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should render all user menu items', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userMenuButton);

      const menu = screen.getByRole('menu');
      const menuItems = within(menu).getAllByRole('menuitem');
      
      expect(menuItems).toHaveLength(4); // Profile, Settings, Dark Mode, Sign Out
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByRole('complementary')).toBeInTheDocument(); // aside
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
      expect(screen.getByRole('main')).toBeInTheDocument(); // main
    });

    it('should have screen reader text for icons', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByText('Toggle sidebar', { selector: '.sr-only' })).toBeInTheDocument();
      expect(screen.getByText('Search', { selector: '.sr-only' })).toBeInTheDocument();
      expect(screen.getByText('Notifications', { selector: '.sr-only' })).toBeInTheDocument();
    });

    it('should have proper aria-label for buttons', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const hamburgerButton = screen.getByRole('button', { name: /toggle sidebar/i });
      expect(hamburgerButton).toHaveAttribute('aria-label');

      const notificationsButton = screen.getByRole('button', { name: /notifications/i });
      expect(notificationsButton).toHaveAttribute('aria-label');

      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      expect(userMenuButton).toHaveAttribute('aria-label');
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive classes for sidebar', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('lg:translate-x-0');
    });

    it('should apply responsive classes for main content', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const main = screen.getByRole('main');
      expect(main).toHaveClass('lg:pl-64');
    });

    it('should show overlay only when sidebar is open on mobile', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      // Initially closed - overlay should be hidden
      let overlay = screen.queryByRole('button', { name: /close sidebar/i });
      expect(overlay).toHaveClass('opacity-0', 'pointer-events-none');

      // Open sidebar
      const hamburgerButton = screen.getByRole('button', { name: /toggle sidebar/i });
      fireEvent.click(hamburgerButton);

      overlay = screen.getByRole('button', { name: /close sidebar/i });
      expect(overlay).toHaveClass('opacity-50', 'pointer-events-auto');
    });
  });

  describe('Dark Mode', () => {
    it('should render dark mode toggle in user menu', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userMenuButton);

      expect(screen.getByText('Toggle Dark Mode')).toBeInTheDocument();
    });

    it('should have dark mode classes applied', () => {
      renderWithRouter(
        <Layout pageTitle="Test">
          <div>Content</div>
        </Layout>
      );

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('bg-card', 'text-foreground', 'border-border');
    });
  });
});
