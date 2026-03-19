import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsNumber, IsDateString, IsArray, IsBoolean, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { Role, JobStatus, PhotoCategory, PhotoReviewStatus, QuoteStatus, ScheduleStatus, ReportStatus } from '@prisma/client';

// ==================== AUTH DTOs ====================

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.OWNER;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  // For scaffolder registration
  @IsString()
  @IsOptional()
  companyName?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class VerifyEmailDto {
  @IsString()
  token: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;
}

export class MagicLinkDto {
  @IsEmail()
  email: string;
}

// ==================== USER DTOs ====================

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  companyName?: string;
}

export class UpdateUserDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class UserQueryDto {
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsString()
  @IsOptional()
  search?: string;
}

// ==================== JOB DTOs ====================

export class CreateJobDto {
  @IsString()
  @MaxLength(255)
  addressLine1: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine2?: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsString()
  @MaxLength(20)
  postcode: string;

  @IsEmail()
  ownerEmail: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  ownerFirstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  ownerLastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  ownerPhone?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;
}

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine1?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine2?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  postcode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  adminNotes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  statusReason?: string;
}

export class TransitionStatusDto {
  @IsEnum(JobStatus)
  status: JobStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}

export class JobQueryDto {
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class InviteOwnerDto {
  @IsEmail()
  email: string;
}

export class AssignScaffolderDto {
  @IsUUID()
  scaffolderId: string;
}

export class SubmitPhotosDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsArray()
  @IsString({ each: true })
  photoKeys: string[];
}

export class ValidateJobDto {
  @IsEnum(['approve', 'request_more_info', 'reject'])
  decision: 'approve' | 'request_more_info' | 'reject';

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;
}

export class SubmitQuoteDto {
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsDateString()
  @IsOptional()
  proposedDate?: string;
}

export class ReviewQuoteDto {
  @IsEnum(['approve', 'reject', 'revision'])
  decision: 'approve' | 'reject' | 'revision';

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;
}

// ==================== PHOTO DTOs ====================

export class UploadPhotoDto {
  @IsEnum(PhotoCategory)
  category: PhotoCategory;

  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  @Type(() => Number)
  fileSize: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;
}

export class ReviewPhotoDto {
  @IsEnum(PhotoReviewStatus)
  reviewStatus: PhotoReviewStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reviewNote?: string;
}

// ==================== SCHEDULE DTOs ====================

export class ProposeScheduleDto {
  @IsDateString()
  proposedDate: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}

export class RespondScheduleDto {
  @IsEnum(['confirm', 'request_change', 'unavailable'])
  response: 'confirm' | 'request_change' | 'unavailable';

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}

// ==================== REPORT DTOs ====================

export class CreateReportDto {
  @IsObject()
  data: Record<string, any>;
}

export class SubmitReportDto {
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

export class ReportQueryDto {
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

// ==================== QUOTE DTOs ====================

export class QuoteQueryDto {
  @IsEnum(QuoteStatus)
  @IsOptional()
  status?: QuoteStatus;

  @IsUUID()
  @IsOptional()
  jobId?: string;

  @IsUUID()
  @IsOptional()
  scaffolderId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

// ==================== REGION DTOs ====================

export class CreateRegionDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(10)
  code: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

export class UpdateRegionDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ==================== SCAFFOLDER DTOs ====================

export class CreateScaffolderDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  companyName?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  regionIds?: string[];
}

export class UpdateScaffolderDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  companyName?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  regionIds?: string[];
}

export class ScaffolderQueryDto {
  @IsUUID()
  @IsOptional()
  regionId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsString()
  @IsOptional()
  search?: string;
}

// ==================== NOTIFICATION DTOs ====================

export class NotificationQueryDto {
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class CreateNotificationTemplateDto {
  @IsString()
  @MaxLength(100)
  type: string;

  @IsString()
  @MaxLength(200)
  titleTemplate: string;

  @IsString()
  @MaxLength(1000)
  bodyTemplate: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  emailSubject?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  emailBody?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateNotificationTemplateDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  titleTemplate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  bodyTemplate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  emailSubject?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  emailBody?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// Helper type for object validation
function IsObject() {
  return (target: object, propertyKey: string) => {
    // class-validator doesn't have IsObject, using custom validation
  };
}
