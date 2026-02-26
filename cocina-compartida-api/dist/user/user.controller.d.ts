import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UserController {
    private readonly usersService;
    constructor(usersService: UserService);
    create(createUserDto: CreateUserDto): Promise<{
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
    update(updateUserDto: UpdateUserDto, req: any): Promise<{
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
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
