import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateUserData {
  user_insert: User_Key;
}

export interface ListProjectsData {
  projects: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    dueDate?: DateString | null;
  } & Project_Key)[];
}

export interface ListTasksForUserData {
  tasks: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    dueDate?: DateString | null;
    priority?: string | null;
    status: string;
  } & Task_Key)[];
}

export interface LogTimeData {
  timeEntry_insert: TimeEntry_Key;
}

export interface Project_Key {
  id: UUIDString;
  __typename?: 'Project_Key';
}

export interface Task_Key {
  id: UUIDString;
  __typename?: 'Task_Key';
}

export interface TimeEntry_Key {
  id: UUIDString;
  __typename?: 'TimeEntry_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface ListTasksForUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListTasksForUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListTasksForUserData, undefined>;
  operationName: string;
}
export const listTasksForUserRef: ListTasksForUserRef;

export function listTasksForUser(): QueryPromise<ListTasksForUserData, undefined>;
export function listTasksForUser(dc: DataConnect): QueryPromise<ListTasksForUserData, undefined>;

interface LogTimeRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<LogTimeData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<LogTimeData, undefined>;
  operationName: string;
}
export const logTimeRef: LogTimeRef;

export function logTime(): MutationPromise<LogTimeData, undefined>;
export function logTime(dc: DataConnect): MutationPromise<LogTimeData, undefined>;

interface ListProjectsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProjectsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListProjectsData, undefined>;
  operationName: string;
}
export const listProjectsRef: ListProjectsRef;

export function listProjects(): QueryPromise<ListProjectsData, undefined>;
export function listProjects(dc: DataConnect): QueryPromise<ListProjectsData, undefined>;

