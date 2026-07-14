import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the ICP filing link', () => {
  render(<App />);
  const linkElement = screen.getByRole('link', { name: '粤ICP备2021009006号' });
  expect(linkElement).toBeInTheDocument();
  expect(linkElement).toHaveAttribute('href', 'https://beian.miit.gov.cn/');
});
