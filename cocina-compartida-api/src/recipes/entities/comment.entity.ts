import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Recipe } from "./recipe.entity";
import { User } from "src/user/entities/user.entity";

@Entity('comments')
export class Comment{

    @PrimaryGeneratedColumn('uuid')
    id:string;

    @ManyToOne(()=>User, user => user.comments)
    user:User;
    
    @ManyToOne(()=>Recipe, recipe => recipe.comments)
    recipe:Recipe;
    
    @Column({type:'varchar'})
    message:string;

    @CreateDateColumn({name:'created_at'})
    createdAt:Date;
}