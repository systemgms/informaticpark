import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { AssetsService } from '../assets/assets.service';
import { CustodiansService } from '../custodians/custodians.service';
import { PublicController } from './public.controller';

describe('PublicController', () => {
  let controller: PublicController;
  let assetsService: { findPublic: jest.Mock };
  let custodiansService: { findPublic: jest.Mock };

  beforeEach(async () => {
    assetsService = { findPublic: jest.fn() };
    custodiansService = { findPublic: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicController],
      providers: [
        { provide: AssetsService, useValue: assetsService },
        { provide: CustodiansService, useValue: custodiansService },
      ],
    }).compile();

    controller = module.get<PublicController>(PublicController);
  });

  it('is reachable without authentication', () => {
    const isPublic = new Reflector().get<boolean>(
      IS_PUBLIC_KEY,
      PublicController,
    );

    expect(isPublic).toBe(true);
  });

  describe('findAssets', () => {
    it('delegates to assetsService.findPublic with parsed and clamped pagination', async () => {
      assetsService.findPublic.mockResolvedValue({ data: [], meta: {} });

      await controller.findAssets('2', '10', 'laptop');

      expect(assetsService.findPublic).toHaveBeenCalledWith(2, 10, 'laptop');
    });

    it('defaults and clamps page and limit', async () => {
      assetsService.findPublic.mockResolvedValue({ data: [], meta: {} });

      await controller.findAssets(undefined, '9999', undefined);

      expect(assetsService.findPublic).toHaveBeenCalledWith(1, 100, undefined);
    });
  });

  describe('findCustodians', () => {
    it('delegates to custodiansService.findPublic with parsed pagination', async () => {
      custodiansService.findPublic.mockResolvedValue({ data: [], meta: {} });

      await controller.findCustodians('1', '20', 'juan');

      expect(custodiansService.findPublic).toHaveBeenCalledWith(1, 20, 'juan');
    });
  });
});
