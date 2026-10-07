// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './dialog';

describe('DialogContent', () => {
  it('labels the close button in Spanish', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Titulo</DialogTitle>
          <DialogDescription>Descripcion</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('Cerrar')).toBeDefined();
    expect(screen.queryByText('Close')).toBeNull();
  });
});
