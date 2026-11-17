import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  estimatedHours: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  assignedUserIds: number[];
}