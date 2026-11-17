import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const { assignedUserIds, ...data } = dto;

    const task = this.tasksRepository.create(data);
    task.assignedUsers = await this.findUsers(assignedUserIds);

    return this.tasksRepository.save(task);
  }

  private async findUsers(ids: number[]): Promise<User[]> {
    const users = await this.usersRepository.findBy({ id: In(ids) });
    if (users.length !== ids.length) {
      throw new BadRequestException('Uno o más usuarios asignados no existen');
    }
    return users;
  }
}