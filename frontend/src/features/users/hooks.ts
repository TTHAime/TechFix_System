import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, onboardUser, updateUser, hrUpdateUser, deleteUser } from './api';

export function useUsersQuery(page = 1, limit = 20, includeInactive = false, enabled = true) {
  return useQuery({
    queryKey: ['users', page, limit, includeInactive],
    queryFn: () => getUsers(page, limit, includeInactive),
    enabled,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      password: string;
      roleId: number;
      deptId: number;
    }) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { name?: string; email?: string; roleId?: number; deptId?: number; isActive?: boolean; password?: string };
    }) => updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useOnboardUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      deptId: number;
      password?: string;
    }) => onboardUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useHrUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { name?: string; deptId?: number; isActive?: boolean; password?: string };
    }) => hrUpdateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
