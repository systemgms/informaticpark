// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

describe('SelectTrigger', () => {
  it('uses a touch-target-sized height (at least 44px)', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una opción" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Opción A</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('h-11');
  });

  it('floats the content with the float shadow', () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una opción" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Opción A</SelectItem>
        </SelectContent>
      </Select>,
    );
    const content = screen.getByRole('listbox');
    expect(content.className).toContain('shadow-float');
    expect(content.className).not.toContain('shadow-md');
  });
});
