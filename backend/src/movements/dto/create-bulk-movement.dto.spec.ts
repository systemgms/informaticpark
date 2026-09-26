import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBulkMovementDto } from './create-bulk-movement.dto';

describe('CreateBulkMovementDto', () => {
  it('should reject an empty assetIds array', async () => {
    const dto = plainToInstance(CreateBulkMovementDto, {
      assetIds: [],
      toCustodianId: 2,
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'assetIds')).toBe(true);
  });

  it('should accept a non-empty assetIds array', async () => {
    const dto = plainToInstance(CreateBulkMovementDto, {
      assetIds: [1, 2],
      toCustodianId: 2,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
