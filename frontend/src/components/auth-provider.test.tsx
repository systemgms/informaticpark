// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'

describe('Test setup', () => {
  it('renders basic element', () => {
    render(
      <div data-testid="test-container">Hello World</div>
    )
    
    const element = screen.getByTestId('test-container')
    expect(element).toBeDefined()
    expect(element.textContent).toBe('Hello World')
  })
})