import { Comment } from './comment';

export interface Recipe {
  id: string; 
  name: string;
  descripcion: string;
  ingredients: string[];
  steps: string[];
  images: string[];
  author: string;
  avatar: string;
  likes?: number;
  likedBy?: string[]; // Array de IDs de usuarios a los que les gusta
  comments?: Comment[];
}