import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
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

  async findAll(filters: FilterTasksDto): Promise<Task[]> {
    const query = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedUsers', 'user')
      .orderBy('task.createdAt', 'DESC');

    if (filters.dueDate) {
      query.andWhere('task.dueDate = :dueDate', { dueDate: filters.dueDate });
    }
    if (filters.title) {
      query.andWhere('task.title ILIKE :title', { title: `%${filters.title}%` });
    }

    if (filters.userId || filters.userName || filters.userEmail) {
      query.innerJoin('task.assignedUsers', 'filterUser');

      if (filters.userId) {
        query.andWhere('filterUser.id = :userId', { userId: filters.userId });
      }
      if (filters.userName) {
        query.andWhere('filterUser.name ILIKE :userName', { userName: `%${filters.userName}%` });
      }
      if (filters.userEmail) {
        query.andWhere('filterUser.email ILIKE :userEmail', { userEmail: `%${filters.userEmail}%` });
      }
    }

    return query.getMany();
  }

  private async findUsers(ids: number[]): Promise<User[]> {
    const users = await this.usersRepository.findBy({ id: In(ids) });
    if (users.length !== ids.length) {
      throw new BadRequestException('Uno o más usuarios asignados no existen');
    }
    return users;
  }
}