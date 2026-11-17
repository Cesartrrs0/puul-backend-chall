import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskStatus } from './entities/task.entity';

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

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    const { assignedUserIds, ...data } = dto;

    Object.assign(task, data);

    if (assignedUserIds) {
      task.assignedUsers = await this.findUsers(assignedUserIds);
    }

    return this.tasksRepository.save(task);
  }

  async remove(id: number): Promise<{ message: string }> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
    return { message: `Tarea ${id} eliminada` };
  }

  async getAnalytics() {
    const today = new Date().toISOString().slice(0, 10);

    // Estadística 1: avance del equipo
    const summary = {
      activeTasks: await this.tasksRepository.countBy({ status: TaskStatus.ACTIVE }),
      finishedTasks: await this.tasksRepository.countBy({ status: TaskStatus.FINISHED }),
      overdueTasks: await this.tasksRepository.countBy({
        status: TaskStatus.ACTIVE,
        dueDate: LessThan(today),
      }),
    };

    // Estadística 2: carga de trabajo pendiente por usuario
    const rows = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.tasks', 'task', 'task.status = :active', {
        active: TaskStatus.ACTIVE,
      })
      .select(['user.id AS "userId"', 'user.name AS name'])
      .addSelect('COUNT(task.id)', 'activeTasks')
      .addSelect('COALESCE(SUM(task.estimatedHours), 0)', 'pendingHours')
      .groupBy('user.id')
      .orderBy('"pendingHours"', 'DESC')
      .addOrderBy('user.id', 'ASC')
      .getRawMany();

    const workloadByUser = rows.map((row) => ({
      ...row,
      activeTasks: Number(row.activeTasks),
      pendingHours: Number(row.pendingHours),
    }));

    return { summary, workloadByUser };
  }

  private async findOne(id: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: { assignedUsers: true },
    });
    if (!task) {
      throw new NotFoundException(`La tarea ${id} no existe`);
    }
    return task;
  }

  private async findUsers(ids: number[]): Promise<User[]> {
    const users = await this.usersRepository.findBy({ id: In(ids) });
    if (users.length !== ids.length) {
      throw new BadRequestException('Uno o más usuarios asignados no existen');
    }
    return users;
  }
}