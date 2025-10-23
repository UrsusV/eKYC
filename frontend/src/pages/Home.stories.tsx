import type { Meta, StoryObj } from '@storybook/react';
import Home from './Home';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof Home> = {
  title: 'Pages/Home',
  component: Home,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Home>;

export const Default: Story = {};
