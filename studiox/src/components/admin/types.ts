/** One entry in an admin list (grid card or row). */
export type ListItem = {
  id: number;
  title: string;
  kicker?: string;
  meta?: string;
  /** undefined = this content type has no draft state */
  published?: boolean;
  image?: string;
  viewHref?: string;
};

export const searchText = (item: ListItem) => [item.title, item.kicker, item.meta].filter(Boolean).join(' ').toLowerCase();
