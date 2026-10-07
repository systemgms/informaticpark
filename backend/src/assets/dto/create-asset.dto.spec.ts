import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AssetCondition } from '@prisma/client';
import { CreateAssetDto } from './create-asset.dto';

describe('CreateAssetDto', () => {
  it('should accept a valid condition', async () => {
    const dto = plainToInstance(CreateAssetDto, {
      assetName: 'Laptop Dell',
      condition: AssetCondition.MALO,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should accept the REGULAR condition', async () => {
    const dto = plainToInstance(CreateAssetDto, {
      assetName: 'Laptop Dell',
      condition: 'REGULAR',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should accept a missing condition (optional)', async () => {
    const dto = plainToInstance(CreateAssetDto, {
      assetName: 'Laptop Dell',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject an invalid condition value', async () => {
    const dto = plainToInstance(CreateAssetDto, {
      assetName: 'Laptop Dell',
      condition: 'ROTO',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'condition')).toBe(true);
  });
});
