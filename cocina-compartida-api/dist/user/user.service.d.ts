import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UserService {
    private userRepo;
    constructor(userRepo: Repository<User>);
    private omitPassword;
    create(dto: CreateUserDto): Promise<{
        id: string;
        username: string;
        email?: string;
        avatar?: string;
        bio?: string;
        recipes?: import("../recipes/entities/recipe.entity").Recipe[];
        comments?: import("../recipes/entities/comment.entity").Comment[];
        isActive?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
        role: string;
    } | null>;
    findAll(): Promise<({
        id: string;
        username: string;
        email?: string;
        avatar?: string;
        bio?: string;
        recipes?: import("../recipes/entities/recipe.entity").Recipe[];
        comments?: import("../recipes/entities/comment.entity").Comment[];
        isActive?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
        role: string;
    } | null)[]>;
    findOne(id: string): Promise<{
        id: string;
        username: string;
        email?: string;
        avatar?: string;
        bio?: string;
        recipes?: import("../recipes/entities/recipe.entity").Recipe[];
        comments?: import("../recipes/entities/comment.entity").Comment[];
        isActive?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
        role: string;
    } | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        username: string;
        email?: string;
        avatar?: string;
        bio?: string;
        recipes?: import("../recipes/entities/recipe.entity").Recipe[];
        comments?: import("../recipes/entities/comment.entity").Comment[];
        isActive?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
        role: string;
    } | null>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
