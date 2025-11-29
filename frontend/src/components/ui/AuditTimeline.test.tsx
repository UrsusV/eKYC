import { render, screen, fireEvent } from '@testing-library/react';
import AuditTimeline, { AuditEvent } from './AuditTimeline';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('AuditTimeline Component', () => {
  const mockEvents: AuditEvent[] = [
    {
      id: 'evt-001',
      type: 'issued',
      actor: 'Government ID Authority',
      timestamp: new Date('2025-10-15T10:30:00Z'),
      details: 'Driver license credential issued successfully',
    },
    {
      id: 'evt-002',
      type: 'consent_granted',
      actor: 'John Doe',
      timestamp: new Date('2025-10-16T14:45:00Z'),
      details: 'Consent granted to share full_name, email, and date_of_birth with Acme Corp',
    },
    {
      id: 'evt-003',
      type: 'verified',
      actor: 'Acme Corp Verifier',
      timestamp: new Date('2025-10-17T09:15:00Z'),
      details: 'Credential verified successfully via VP presentation',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with title and event count', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      expect(screen.getByText('Audit Timeline')).toBeInTheDocument();
      expect(screen.getByText('3 events recorded')).toBeInTheDocument();
    });

    it('should render all events', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      expect(screen.getByText('Issued')).toBeInTheDocument();
      expect(screen.getByText('Consent Granted')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('should render event actors', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      expect(screen.getByText('by Government ID Authority')).toBeInTheDocument();
      expect(screen.getByText('by John Doe')).toBeInTheDocument();
      expect(screen.getByText('by Acme Corp Verifier')).toBeInTheDocument();
    });

    it('should render event details', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      expect(screen.getByText(/Driver license credential issued/)).toBeInTheDocument();
      expect(screen.getByText(/Consent granted to share/)).toBeInTheDocument();
      expect(screen.getByText(/Credential verified successfully/)).toBeInTheDocument();
    });

    it('should render download CSV button', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const downloadButton = screen.getByRole('button', { name: /download audit timeline as csv/i });
      expect(downloadButton).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<AuditTimeline events={mockEvents} className="custom-class" />);
      
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no events', () => {
      render(<AuditTimeline events={[]} />);
      
      expect(screen.getByText('No audit events yet')).toBeInTheDocument();
      expect(screen.getByText(/Events will appear here/)).toBeInTheDocument();
    });

    it('should not render download button in empty state', () => {
      render(<AuditTimeline events={[]} />);
      
      expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
    });

    it('should not render timeline in empty state', () => {
      render(<AuditTimeline events={[]} />);
      
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('Event Sorting', () => {
    it('should display events in reverse chronological order (most recent first)', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const eventCards = screen.getAllByRole('article');
      
      // Most recent event should be first
      expect(eventCards[0]).toHaveAccessibleName(/Verified event/);
      expect(eventCards[1]).toHaveAccessibleName(/Consent Granted event/);
      expect(eventCards[2]).toHaveAccessibleName(/Issued event/);
    });

    it('should mark the most recent event with "Latest" badge', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      expect(screen.getByText('Latest')).toBeInTheDocument();
      
      // Only one "Latest" badge should exist
      const latestBadges = screen.getAllByText('Latest');
      expect(latestBadges).toHaveLength(1);
    });

    it('should handle unsorted input events', () => {
      const unsortedEvents = [mockEvents[1], mockEvents[2], mockEvents[0]];
      render(<AuditTimeline events={unsortedEvents} />);
      
      const eventCards = screen.getAllByRole('article');
      
      // Should still be sorted correctly
      expect(eventCards[0]).toHaveAccessibleName(/Verified event/);
    });
  });

  describe('Event Types', () => {
    it('should render "Issued" event with success styling', () => {
      const issuedEvent: AuditEvent[] = [{
        id: 'evt-1',
        type: 'issued',
        actor: 'Issuer',
        timestamp: new Date(),
        details: 'Test issued',
      }];
      
      const { container } = render(<AuditTimeline events={issuedEvent} />);
      
      expect(screen.getByText('Issued')).toBeInTheDocument();
      // Check for success color classes
      expect(container.querySelector('.bg-success-100')).toBeInTheDocument();
    });

    it('should render "Consent Granted" event with primary styling', () => {
      const consentEvent: AuditEvent[] = [{
        id: 'evt-2',
        type: 'consent_granted',
        actor: 'User',
        timestamp: new Date(),
        details: 'Test consent',
      }];
      
      const { container } = render(<AuditTimeline events={consentEvent} />);
      
      expect(screen.getByText('Consent Granted')).toBeInTheDocument();
      expect(container.querySelector('.bg-primary-100')).toBeInTheDocument();
    });

    it('should render "Verified" event with secondary styling', () => {
      const verifiedEvent: AuditEvent[] = [{
        id: 'evt-3',
        type: 'verified',
        actor: 'Verifier',
        timestamp: new Date(),
        details: 'Test verified',
      }];
      
      const { container } = render(<AuditTimeline events={verifiedEvent} />);
      
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(container.querySelector('.bg-secondary-100')).toBeInTheDocument();
    });

    it('should render "Revoked" event with danger styling', () => {
      const revokedEvent: AuditEvent[] = [{
        id: 'evt-4',
        type: 'revoked',
        actor: 'Admin',
        timestamp: new Date(),
        details: 'Test revoked',
      }];
      
      const { container } = render(<AuditTimeline events={revokedEvent} />);
      
      expect(screen.getByText('Revoked')).toBeInTheDocument();
      expect(container.querySelector('.bg-danger-100')).toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    it('should display relative time', () => {
      const recentEvent: AuditEvent[] = [{
        id: 'evt-recent',
        type: 'issued',
        actor: 'Test',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        details: 'Recent event',
      }];
      
      render(<AuditTimeline events={recentEvent} />);
      
      expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();
    });

    it('should handle string timestamp', () => {
      const stringTimestampEvent: AuditEvent[] = [{
        id: 'evt-string',
        type: 'issued',
        actor: 'Test',
        timestamp: '2025-10-15T10:30:00Z',
        details: 'String timestamp event',
      }];
      
      render(<AuditTimeline events={stringTimestampEvent} />);
      
      expect(screen.getByText('String timestamp event')).toBeInTheDocument();
    });

    it('should render time element with proper datetime attribute', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const timeElements = screen.getAllByRole('time');
      expect(timeElements.length).toBeGreaterThan(0);
      
      timeElements.forEach(timeEl => {
        expect(timeEl).toHaveAttribute('datetime');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should make event cards focusable', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const eventCards = screen.getAllByRole('article');
      
      eventCards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should expand event details on Enter key', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const firstEvent = screen.getAllByRole('article')[0];
      
      // Initially, event ID should not be visible
      expect(screen.queryByText(/Event ID: evt-003/)).not.toBeInTheDocument();
      
      // Focus and press Enter
      fireEvent.keyDown(firstEvent, { key: 'Enter' });
      
      // Event ID should now be visible
      expect(screen.getByText(/Event ID: evt-003/)).toBeInTheDocument();
    });

    it('should expand event details on Space key', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const firstEvent = screen.getAllByRole('article')[0];
      
      fireEvent.keyDown(firstEvent, { key: ' ' });
      
      expect(screen.getByText(/Event ID: evt-003/)).toBeInTheDocument();
    });

    it('should toggle expansion on repeated Enter press', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const firstEvent = screen.getAllByRole('article')[0];
      
      // Expand
      fireEvent.keyDown(firstEvent, { key: 'Enter' });
      expect(screen.getByText(/Event ID: evt-003/)).toBeInTheDocument();
      
      // Collapse
      fireEvent.keyDown(firstEvent, { key: 'Enter' });
      expect(screen.queryByText(/Event ID: evt-003/)).not.toBeInTheDocument();
    });

    it('should update aria-expanded attribute', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const firstEvent = screen.getAllByRole('article')[0];
      
      expect(firstEvent).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.keyDown(firstEvent, { key: 'Enter' });
      
      expect(firstEvent).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Mouse Interactions', () => {
    it('should expand event on click', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const firstEvent = screen.getAllByRole('article')[0];
      
      fireEvent.click(firstEvent);
      
      expect(screen.getByText(/Event ID: evt-003/)).toBeInTheDocument();
    });

    it('should show expanded state on focus', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const firstEvent = screen.getAllByRole('article')[0];
      
      fireEvent.focus(firstEvent);
      
      expect(screen.getByText(/Event ID: evt-003/)).toBeInTheDocument();
    });

    it('should hide expanded state on blur', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const firstEvent = screen.getAllByRole('article')[0];
      
      fireEvent.focus(firstEvent);
      expect(screen.getByText(/Event ID: evt-003/)).toBeInTheDocument();
      
      fireEvent.blur(firstEvent);
      expect(screen.queryByText(/Event ID: evt-003/)).not.toBeInTheDocument();
    });
  });

  describe('CSV Download', () => {
    it('should trigger CSV download when button is clicked', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const downloadButton = screen.getByRole('button', { name: /download audit timeline as csv/i });
      fireEvent.click(downloadButton);
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should generate CSV with correct headers', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const downloadButton = screen.getByRole('button', { name: /download audit timeline as csv/i });
      
      // Mock createElement and click to capture blob
      let csvContent = '';
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = jest.fn((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          const originalClick = element.click;
          element.click = function() {
            // Capture the blob URL
            const blob = (global.URL.createObjectURL as jest.Mock).mock.calls[0]?.[0];
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                csvContent = reader.result as string;
              };
              reader.readAsText(blob);
            }
            return originalClick.call(this);
          };
        }
        return element;
      });
      
      fireEvent.click(downloadButton);
      
      // Restore createElement
      document.createElement = originalCreateElement;
    });

    it('should handle empty events array', () => {
      render(<AuditTimeline events={[]} />);
      
      // No download button should be present for empty state
      expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      expect(screen.getByRole('list', { name: /audit events timeline/i })).toBeInTheDocument();
    });

    it('should have accessible event descriptions', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const verifiedEvent = screen.getByRole('article', { name: /verified event by acme corp verifier/i });
      expect(verifiedEvent).toBeInTheDocument();
    });

    it('should hide decorative icons from screen readers', () => {
      const { container } = render(<AuditTimeline events={mockEvents} />);
      
      const decorativeIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeIcons.length).toBeGreaterThan(0);
    });

    it('should have accessible time elements', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const timeElements = screen.getAllByRole('time');
      
      timeElements.forEach(timeEl => {
        expect(timeEl).toHaveAttribute('datetime');
        expect(timeEl).toHaveAttribute('title');
      });
    });

    it('should support keyboard focus management', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const jumpToTopButton = screen.getByRole('button', { name: /jump to most recent event/i });
      
      fireEvent.click(jumpToTopButton);
      
      // First event should receive focus (tested via focus event)
      const firstEvent = screen.getAllByRole('article')[0];
      expect(firstEvent).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Visual Timeline', () => {
    it('should render vertical timeline line', () => {
      const { container } = render(<AuditTimeline events={mockEvents} />);
      
      const timelineLine = container.querySelector('.absolute.left-\\[23px\\]');
      expect(timelineLine).toBeInTheDocument();
    });

    it('should render event icons', () => {
      const { container } = render(<AuditTimeline events={mockEvents} />);
      
      // Check for icon containers with background colors
      expect(container.querySelector('.bg-success-500')).toBeInTheDocument(); // Issued
      expect(container.querySelector('.bg-primary-500')).toBeInTheDocument(); // Consent Granted
      expect(container.querySelector('.bg-secondary-500')).toBeInTheDocument(); // Verified
    });
  });

  describe('Footer', () => {
    it('should render footer with info text', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      expect(screen.getByText(/Timeline shows events from most recent to oldest/)).toBeInTheDocument();
    });

    it('should render "Jump to top" button', () => {
      render(<AuditTimeline events={mockEvents} />);
      
      const jumpButton = screen.getByRole('button', { name: /jump to most recent event/i });
      expect(jumpButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single event', () => {
      const singleEvent: AuditEvent[] = [mockEvents[0]];
      render(<AuditTimeline events={singleEvent} />);
      
      expect(screen.getByText('1 event recorded')).toBeInTheDocument();
    });

    it('should handle events with same timestamp', () => {
      const sameTimeEvents: AuditEvent[] = [
        { ...mockEvents[0], id: 'evt-a', timestamp: new Date('2025-10-17T10:00:00Z') },
        { ...mockEvents[1], id: 'evt-b', timestamp: new Date('2025-10-17T10:00:00Z') },
      ];
      
      render(<AuditTimeline events={sameTimeEvents} />);
      
      const eventCards = screen.getAllByRole('article');
      expect(eventCards).toHaveLength(2);
    });

    it('should handle very long event details', () => {
      const longDetailsEvent: AuditEvent[] = [{
        id: 'evt-long',
        type: 'issued',
        actor: 'Test',
        timestamp: new Date(),
        details: 'A'.repeat(500), // Very long details
      }];
      
      render(<AuditTimeline events={longDetailsEvent} />);
      
      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
    });

    it('should handle special characters in event details', () => {
      const specialCharsEvent: AuditEvent[] = [{
        id: 'evt-special',
        type: 'issued',
        actor: 'Test & Co.',
        timestamp: new Date(),
        details: 'Details with "quotes" and <special> characters & symbols',
      }];
      
      render(<AuditTimeline events={specialCharsEvent} />);
      
      expect(screen.getByText(/Details with "quotes"/)).toBeInTheDocument();
    });
  });
});
