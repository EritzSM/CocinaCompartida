import { Comment } from './comment';

export interface Recipe {
  id: string;
  name: string;
  descripcion: string;
  ingredients: string[];
  steps: string[];
  images: string[];
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  category: string;  // Nueva propiedad para la categoría
  likes?: number;
  likedBy?: string[]; // Array de IDs de usuarios a los que les gusta
  comments?: Comment[];
  createdAt?: string | Date;
}
