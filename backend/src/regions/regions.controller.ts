import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RegionsService } from './regions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('regions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegionsController {
  constructor(private regions: RegionsService) {}

  // ==================== Create region (admin) ====================

  @Post()
  @Roles('ADMIN')
  create(
    @Body()
    body: {
      name: string;
      code: string;
      description?: string;
    },
  ) {
    return this.regions.create(body);
  }

  // ==================== List regions ====================

  @Get()
  list(
    @Query()
    query: {
      isActive?: boolean;
      page?: number;
      limit?: number;
      search?: string;
    },
  ) {
    return this.regions.list(query);
  }

  // ==================== Get region by ID ====================

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.regions.getById(id);
  }

  // ==================== Update region (admin) ====================

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      code?: string;
      description?: string;
      isActive?: boolean;
    },
  ) {
    return this.regions.update(id, body);
  }

  // ==================== Delete region (admin) ====================

  @Delete(':id')
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.regions.delete(id);
  }

  // ==================== Get scaffolders in region ====================

  @Get(':id/scaffolders')
  getScaffolders(
    @Param('id') id: string,
    @Query()
    query: {
      isActive?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    return this.regions.getScaffolders(id, query);
  }
}
