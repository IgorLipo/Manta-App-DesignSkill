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
import { ScaffoldersService } from './scaffolders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('scaffolders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScaffoldersController {
  constructor(private scaffolders: ScaffoldersService) {}

  // ==================== Create scaffolder (admin) ====================

  @Post()
  @Roles('ADMIN')
  create(
    @Body()
    body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      companyName?: string;
      regionIds?: string[];
    },
  ) {
    return this.scaffolders.create(body);
  }

  // ==================== List scaffolders ====================

  @Get()
  list(
    @Query()
    query: {
      regionId?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
      search?: string;
    },
  ) {
    return this.scaffolders.list(query);
  }

  // ==================== Get scaffolder by ID ====================

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.scaffolders.getById(id);
  }

  // ==================== Get current scaffolder profile ====================

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: { userId: string }) {
    return this.scaffolders.getByUserId(user.userId);
  }

  // ==================== Get assigned jobs ====================

  @Get(':id/jobs')
  getAssignedJobs(
    @Param('id') id: string,
    @Query()
    query: {
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return this.scaffolders.getAssignedJobs(id, query);
  }

  // ==================== Update scaffolder (admin) ====================

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      companyName?: string;
      isActive?: boolean;
      regionIds?: string[];
    },
  ) {
    return this.scaffolders.update(id, body);
  }

  // ==================== Deactivate scaffolder (admin) ====================

  @Post(':id/deactivate')
  @Roles('ADMIN')
  deactivate(@Param('id') id: string) {
    return this.scaffolders.deactivate(id);
  }

  // ==================== Reactivate scaffolder (admin) ====================

  @Post(':id/reactivate')
  @Roles('ADMIN')
  reactivate(@Param('id') id: string) {
    return this.scaffolders.reactivate(id);
  }
}
