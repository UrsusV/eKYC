import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Accessibility Tests for Dashboard/Home Route
 * 
 * These tests use axe-core to scan for accessibility violations.
 * Tests will fail if major violations are found (critical or serious).
 */
describe('Dashboard/Home Accessibility Tests', () => {
  it('should have no major accessibility violations on the main Dashboard route', async () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Run axe accessibility checks
    const results = await axe(container, {
      rules: {
        // Enable all rules
        region: { enabled: true },
        'landmark-one-main': { enabled: true },
        'page-has-heading-one': { enabled: true },
      },
    });

    // Check for violations - this will fail the test if any are found
    expect(results).toHaveNoViolations();
  });

  it('should have no critical violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const results = await axe(container);
    
    // Filter for critical violations
    const criticalViolations = results.violations.filter(
      (violation) => violation.impact === 'critical'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  it('should have no serious violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const results = await axe(container);
    
    // Filter for serious violations
    const seriousViolations = results.violations.filter(
      (violation) => violation.impact === 'serious'
    );

    expect(seriousViolations).toHaveLength(0);
  });

  it('should have proper heading hierarchy', async () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'heading-order': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have proper color contrast', async () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have accessible buttons with proper labels', async () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'button-name': { enabled: true },
        'link-name': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA attributes', async () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'aria-allowed-attr': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have accessible images with alt text', async () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'image-alt': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have proper form labels', async () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        label: { enabled: true },
        'label-content-name-mismatch': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have keyboard accessible interactive elements', async () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'focus-order-semantics': { enabled: true },
        'tabindex': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  describe('Detailed Violation Reporting', () => {
    it('should provide detailed information if violations are found', async () => {
      const { container } = render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      const results = await axe(container);

      if (results.violations.length > 0) {
        console.error('Accessibility Violations Found:');
        results.violations.forEach((violation) => {
          console.error(`\n${violation.impact?.toUpperCase()} - ${violation.id}`);
          console.error(`Description: ${violation.description}`);
          console.error(`Help: ${violation.help}`);
          console.error(`Help URL: ${violation.helpUrl}`);
          console.error(`Affected elements: ${violation.nodes.length}`);
          violation.nodes.forEach((node, index) => {
            console.error(`  ${index + 1}. ${node.html}`);
            console.error(`     ${node.failureSummary}`);
          });
        });
      }

      expect(results.violations).toHaveLength(0);
    });
  });

  describe('CI-Specific Tests', () => {
    it('should fail CI if major violations are found', async () => {
      const { container } = render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      const results = await axe(container);

      // Count major violations (critical + serious)
      const majorViolations = results.violations.filter(
        (violation) => 
          violation.impact === 'critical' || 
          violation.impact === 'serious'
      );

      // This will fail the CI pipeline if major violations exist
      if (majorViolations.length > 0) {
        const violationSummary = majorViolations.map(v => 
          `${v.impact}: ${v.id} (${v.nodes.length} occurrences)`
        ).join('\n');
        
        throw new Error(
          `Found ${majorViolations.length} major accessibility violation(s):\n${violationSummary}\n\n` +
          'Run tests locally for detailed information.'
        );
      }

      expect(majorViolations).toHaveLength(0);
    });

    it('should log all violations in CI for review', async () => {
      const { container } = render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      const results = await axe(container);

      if (process.env.CI && results.violations.length > 0) {
        console.log('\n=== ACCESSIBILITY VIOLATIONS ===');
        console.log(JSON.stringify(results.violations, null, 2));
      }

      expect(results).toHaveNoViolations();
    });
  });
});
