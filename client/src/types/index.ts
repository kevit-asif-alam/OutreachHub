export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  workspaces?: Array<{
    workspaceId: string;
    name?: string;
    role: 'editor' | 'viewer';
    joinedAt: string;
  }>;
}

export interface Workspace {
  workspaceId: string;
  name?: string;
  role: 'editor' | 'viewer';
  joinedAt: string;
}

export interface AuthContextType {
  user: User | null;
  currentWorkspace: Workspace | null;
  login: (
    email: string,
    password: string,
    isAdmin: boolean,
    workspaceId?: string
  ) => Promise<{ requiresWorkspaceSelection: boolean } | void>;
  logout: () => void;
  selectWorkspace: (workspace: Workspace) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  tags: string[];
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplate {
  _id: string;
  name: string;
  content: string;
  type: 'text' | 'text_and_image';
  imageUrl?: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  _id: string;
  name: string;
  description?: string;
  targetTags: string[];
  status: 'draft' | 'running' | 'completed' | 'failed';
  templateId: string;
  template?: {
    _id: string;
    name: string;
    type: string;
  };
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  launchedAt?: string;
  completedAt?: string;
  totalContacts: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
}


