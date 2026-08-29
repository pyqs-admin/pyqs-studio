export interface StudioSession {
  profileId: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export interface StudioProfileRecord {
  id: string;
  email: string;
  displayName: string;
  status: string;
}
