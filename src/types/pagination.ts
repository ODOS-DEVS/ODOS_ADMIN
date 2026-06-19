export type AdminPage<T> = {
  items: T[];
  has_more: boolean;
};

export type AdminListParams = {
  limit?: number;
  offset?: number;
  q?: string;
  status?: string;
  category?: string;
  type?: string;
};
