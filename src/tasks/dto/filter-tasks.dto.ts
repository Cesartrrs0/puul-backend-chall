import { IsDateString, IsNumberString, IsOptional, IsString } from 'class-validator';

export class FilterTasksDto {
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumberString()
  userId?: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;
}