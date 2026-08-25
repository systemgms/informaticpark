import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class MaxLengthPipe implements PipeTransform<string | undefined, string | undefined> {
  constructor(private readonly maxLength: number) {}

  transform(value: string | undefined, metadata: ArgumentMetadata) {
    if (value !== undefined && value.length > this.maxLength) {
      throw new BadRequestException(
        `Parámetro '${metadata.data}' no puede superar los ${this.maxLength} caracteres`,
      );
    }

    return value;
  }
}
