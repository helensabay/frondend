import { useQuery } from '@tanstack/react-query';
import { fetchMenuCategories, fetchMenuItems, getCurrentUser } from './api';
import { useMutation } from '@tanstack/react-query';
import { uploadAvatarApi } from './api';
function useApiQuery(queryKey, queryFn, options = {}) {
  return useQuery({
    queryKey,
    queryFn: async () => await queryFn(),
    ...options,
  });
}export function useUploadAvatar() {
  return useMutation(async (file) => {
    const formData = new FormData();
    formData.append('avatar', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    });

    const response = await uploadAvatarApi(formData);
    return response.data;
  });
}

export const queryKeys = {
  me: ['auth', 'me'],
  menu: {
    categories: ['menu', 'categories'],
    items: (params) => ['menu', 'items', JSON.stringify(params)],
  },
};

export function useMenuCategories(options = {}) {
  return useApiQuery(queryKeys.menu.categories, fetchMenuCategories, { staleTime: 15000, ...options });
}

export function useMenuItems(params = {}, options = {}) {
  return useApiQuery(queryKeys.menu.items(params), () => fetchMenuItems(params), options);
}

export function useCurrentUser(options = {}) {
  return useApiQuery(queryKeys.me, getCurrentUser, options);
}
