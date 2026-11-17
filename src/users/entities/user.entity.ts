import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
export enum UserRole {
    MEMBER = 'member',
    ADMIN = 'admin',
}

@Entity('users')
export class User{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({unique: true})
    email: string;

    @Column({type: 'enum', enum: UserRole, default: UserRole.MEMBER})
    role: UserRole;

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;

    @ManyToMany(() => Task, (task) => task.assignedUsers)
    tasks: Task[];
}