
export interface Comment {
  id: string;
  message: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
