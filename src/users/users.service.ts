import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepository.findOneBy({ email: dto.email });
    if (exists) {
      throw new ConflictException(`Ya existe un usuario con el correo ${dto.email}`);
    }

    const user = this.usersRepository.create(dto);
    return this.usersRepository.save(user);
  }

  async findAll(filters: FilterUsersDto): Promise<User[]> {
    const query = this.usersRepository.createQueryBuilder('user');

    if (filters.name) {
      query.andWhere('user.name ILIKE :name', { name: `%${filters.name}%` });
    }
    if (filters.email) {
      query.andWhere('user.email ILIKE :email', { email: `%${filters.email}%` });
    }
    if (filters.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }

    query.orderBy('user.id', 'ASC');
    return query.getMany();
  }
}