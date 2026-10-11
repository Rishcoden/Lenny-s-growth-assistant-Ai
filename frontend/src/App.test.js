import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Lenny Growth Assistant home headline', () => {
  render(<App />);
  const headline = screen.getByText(/Build products people come back to/i);
  expect(headline).toBeInTheDocument();
});

