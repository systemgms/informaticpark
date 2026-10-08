// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { Table, TableBody, TableCell, TableRow } from './table';

describe('TableCell', () => {
  it('uses compact vertical padding (about 10px) instead of p-4', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>dato</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cell = screen.getByText('dato');
    expect(cell.className).toContain('py-2.5');
    expect(cell.className).not.toMatch(/(^|\s)p-4(\s|$)/);
  });
});
