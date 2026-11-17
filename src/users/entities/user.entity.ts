import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}