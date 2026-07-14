import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./Metronome', () => () => null);

beforeEach(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: jest.fn(() => ({
      beginPath: jest.fn(),
      clearRect: jest.fn(),
      lineTo: jest.fn(),
      moveTo: jest.fn(),
      stroke: jest.fn(),
    })),
  });
});

test('renders the ICP filing link', () => {
  render(<App />);
  const linkElement = screen.getByRole('link', { name: '粤ICP备2021009006号' });
  expect(linkElement).toBeInTheDocument();
  expect(linkElement).toHaveAttribute('href', 'https://beian.miit.gov.cn/');
});
