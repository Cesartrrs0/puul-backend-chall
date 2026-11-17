import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class FilterUsersDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}