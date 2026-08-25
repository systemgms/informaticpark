import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ActivateUserDto } from './dto/activate-user.dto';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { TrimStringsPipe } from '../common/pipes/trim-strings.pipe';

@ApiTags('users')
@ApiBearerAuth('JWT')
@Controller('users')
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios (solo ADMIN)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir usuarios inactivos',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );
    const includeInc = includeInactive === 'true';
    const [users, total] = await Promise.all([
      this.usersService.findAll(pageNum, limitNum, includeInc),
      this.usersService.count(includeInc),
    ]);
    return {
      data: users,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id', ParseIdPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario (solo ADMIN)' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  async create(@Body(TrimStringsPipe) dto: CreateUserDto) {
    return this.usersService.createUserAsAdmin(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar usuario (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  async update(
    @Param('id', ParseIdPipe) id: number,
    @Body(TrimStringsPipe) dto: UpdateUserDto,
  ) {
    return this.usersService.updateUserAsAdmin(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activar/desactivar usuario (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  async activate(
    @Param('id', ParseIdPipe) id: number,
    @Body(TrimStringsPipe) dto: ActivateUserDto,
  ) {
    return this.usersService.setActive(id, dto.isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete usuario (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  async remove(@Param('id', ParseIdPipe) id: number) {
    return this.usersService.softDelete(id);
  }
}
