import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { QuoteStatus } from '@prisma/client';

interface RequestWithUser extends Request {
  user: { userId: string; role: string };
}

@Controller('quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotesController {
  constructor(private quotes: QuotesService) {}

  // ==================== List quotes (admin) ====================

  @Get()
  @Roles('ADMIN')
  list(
    @Query()
    query: {
      status?: QuoteStatus;
      jobId?: string;
      scaffolderId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return this.quotes.listQuotes(query);
  }

  // ==================== Get quote by ID ====================

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  get(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.quotes.getQuote(id, req.user.userId, req.user.role as any);
  }

  // ==================== Get quotes for a job ====================

  @Get('job/:jobId')
  @UseGuards(JwtAuthGuard)
  getJobQuotes(@Param('jobId') jobId: string, @Req() req: RequestWithUser) {
    return this.quotes.getJobQuotes(jobId, req.user.userId, req.user.role as any);
  }

  // ==================== Submit quote (scaffolder) ====================

  @Post('job/:jobId')
  @Roles('SCAFFOLDER')
  @HttpCode(HttpStatus.CREATED)
  submitQuote(
    @Param('jobId') jobId: string,
    @CurrentUser() user: { userId: string },
    @Body()
    body: {
      amount: number;
      notes?: string;
      proposedDate?: string;
    },
  ) {
    return this.quotes.submitQuote(jobId, user.userId, {
      amount: body.amount,
      notes: body.notes,
      proposedDate: body.proposedDate ? new Date(body.proposedDate) : undefined,
    });
  }

  // ==================== Submit quote revision (scaffolder) ====================

  @Post(':id/revision')
  @Roles('SCAFFOLDER')
  @HttpCode(HttpStatus.OK)
  submitRevision(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body()
    body: {
      amount: number;
      notes?: string;
      proposedDate?: string;
    },
  ) {
    return this.quotes.submitRevision(id, user.userId, {
      amount: body.amount,
      notes: body.notes,
      proposedDate: body.proposedDate ? new Date(body.proposedDate) : undefined,
    });
  }

  // ==================== Review quote (admin) ====================

  @Patch(':id/review')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  reviewQuote(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() body: { decision: 'approve' | 'reject' | 'revision'; note?: string },
  ) {
    return this.quotes.reviewQuote(id, user.userId, body.decision, body.note);
  }
}
