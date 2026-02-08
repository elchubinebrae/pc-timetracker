import { CreateUserData, ListTasksForUserData, LogTimeData, ListProjectsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;

export function useListTasksForUser(options?: useDataConnectQueryOptions<ListTasksForUserData>): UseDataConnectQueryResult<ListTasksForUserData, undefined>;
export function useListTasksForUser(dc: DataConnect, options?: useDataConnectQueryOptions<ListTasksForUserData>): UseDataConnectQueryResult<ListTasksForUserData, undefined>;

export function useLogTime(options?: useDataConnectMutationOptions<LogTimeData, FirebaseError, void>): UseDataConnectMutationResult<LogTimeData, undefined>;
export function useLogTime(dc: DataConnect, options?: useDataConnectMutationOptions<LogTimeData, FirebaseError, void>): UseDataConnectMutationResult<LogTimeData, undefined>;

export function useListProjects(options?: useDataConnectQueryOptions<ListProjectsData>): UseDataConnectQueryResult<ListProjectsData, undefined>;
export function useListProjects(dc: DataConnect, options?: useDataConnectQueryOptions<ListProjectsData>): UseDataConnectQueryResult<ListProjectsData, undefined>;
