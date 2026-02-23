const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('access_token');
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const token = this.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('access_token');
                window.location.href = '/login';
            }
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    // Auth
    async login(username: string, password: string) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${this.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Login failed' }));
            throw new Error(error.detail);
        }

        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        return data;
    }

    async getMe() {
        return this.request<User>('/api/auth/me');
    }

    logout() {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
    }

    // Users
    async getUsers(params?: QueryParams) {
        const query = buildQuery(params);
        return this.request<UserListResponse>(`/api/users/${query}`);
    }

    async getUser(id: string) {
        return this.request<User>(`/api/users/${id}`);
    }

    async createUser(data: CreateUserPayload) {
        return this.request<User>('/api/users/', { method: 'POST', body: data });
    }

    async updateUser(id: string, data: Partial<CreateUserPayload>) {
        return this.request<User>(`/api/users/${id}`, { method: 'PUT', body: data });
    }

    async deleteUser(id: string) {
        return this.request(`/api/users/${id}`, { method: 'DELETE' });
    }

    // Roles
    async getRoles() {
        return this.request<RoleListResponse>('/api/roles/');
    }

    async createRole(data: CreateRolePayload) {
        return this.request<Role>('/api/roles/', { method: 'POST', body: data });
    }

    async updateRole(id: string, data: Partial<CreateRolePayload>) {
        return this.request<Role>(`/api/roles/${id}`, { method: 'PUT', body: data });
    }

    async deleteRole(id: string) {
        return this.request(`/api/roles/${id}`, { method: 'DELETE' });
    }

    async getPermissions() {
        return this.request<Permission[]>('/api/roles/permissions');
    }

    // Assets
    async getAssets(params?: QueryParams) {
        const query = buildQuery(params);
        return this.request<AssetListResponse>(`/api/assets/${query}`);
    }

    async getAsset(id: string) {
        return this.request<Asset>(`/api/assets/${id}`);
    }

    async createAsset(data: CreateAssetPayload) {
        return this.request<Asset>('/api/assets/', { method: 'POST', body: data });
    }

    async updateAsset(id: string, data: UpdateAssetPayload) {
        return this.request<Asset>(`/api/assets/${id}`, { method: 'PUT', body: data });
    }

    async deleteAsset(id: string) {
        return this.request(`/api/assets/${id}`, { method: 'DELETE' });
    }

    async assignAsset(id: string, userId: string | null) {
        return this.request<Asset>(`/api/assets/${id}/assign`, {
            method: 'POST',
            body: { user_id: userId },
        });
    }

    async getAssetStats() {
        return this.request<AssetStats>('/api/assets/stats');
    }

    // Asset Types
    async getAssetTypes() {
        return this.request<AssetTypeListResponse>('/api/asset-types/');
    }

    async createAssetType(data: CreateAssetTypePayload) {
        return this.request<AssetType>('/api/asset-types/', { method: 'POST', body: data });
    }

    async updateAssetType(id: string, data: Partial<CreateAssetTypePayload>) {
        return this.request<AssetType>(`/api/asset-types/${id}`, { method: 'PUT', body: data });
    }

    async deleteAssetType(id: string) {
        return this.request(`/api/asset-types/${id}`, { method: 'DELETE' });
    }

    // Tickets
    async getTickets(params?: QueryParams) {
        const query = buildQuery(params);
        return this.request<TicketListResponse>(`/api/tickets/${query}`);
    }

    async getTicket(id: string) {
        return this.request<Ticket>(`/api/tickets/${id}`);
    }

    async createTicket(data: CreateTicketPayload) {
        return this.request<Ticket>('/api/tickets/', { method: 'POST', body: data });
    }

    async updateTicket(id: string, data: UpdateTicketPayload) {
        return this.request<Ticket>(`/api/tickets/${id}`, { method: 'PUT', body: data });
    }

    async deleteTicket(id: string) {
        return this.request(`/api/tickets/${id}`, { method: 'DELETE' });
    }

    async getTicketStats() {
        return this.request<TicketStats>('/api/tickets/stats');
    }

    // Health
    async healthCheck() {
        return this.request<{ status: string }>('/api/health');
    }
}

function buildQuery(params?: QueryParams): string {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });
    const query = searchParams.toString();
    return query ? `?${query}` : '';
}

// Types
export interface User {
    id: string;
    email: string;
    username: string;
    full_name: string;
    is_active: boolean;
    is_superadmin: boolean;
    role_id: string | null;
    role_name: string | null;
    sso_provider: string | null;
    created_at: string;
    last_login: string | null;
}

export interface UserListResponse {
    users: User[];
    total: number;
}

export interface CreateUserPayload {
    email: string;
    username: string;
    full_name: string;
    password: string;
    role_id?: string;
    is_superadmin?: boolean;
}

export interface Role {
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
    permissions: Permission[];
    created_at: string;
}

export interface RoleListResponse {
    roles: Role[];
    total: number;
}

export interface CreateRolePayload {
    name: string;
    description?: string;
    permission_ids?: string[];
}

export interface Permission {
    id: string;
    codename: string;
    name: string;
    description: string | null;
    module: string;
}

export interface Asset {
    id: string;
    name: string;
    asset_tag: string;
    asset_type_id: string;
    asset_type_name: string | null;
    serial_number: string | null;
    notes: string | null;
    metadata_fields: Record<string, unknown>;
    status: string;
    assigned_to: string | null;
    assigned_to_name: string | null;
    assigned_at: string | null;
    purchase_date: string | null;
    purchase_cost: string | null;
    warranty_expiry: string | null;
    created_at: string;
    updated_at: string;
}

export interface AssetListResponse {
    assets: Asset[];
    total: number;
}

export interface CreateAssetPayload {
    name: string;
    asset_tag: string;
    asset_type_id: string;
    serial_number?: string;
    notes?: string;
    metadata_fields?: Record<string, unknown>;
    assigned_to?: string;
    purchase_date?: string;
    purchase_cost?: string;
    warranty_expiry?: string;
}

export interface UpdateAssetPayload {
    name?: string;
    serial_number?: string;
    notes?: string;
    status?: string;
    metadata_fields?: Record<string, unknown>;
    assigned_to?: string;
    purchase_date?: string;
    purchase_cost?: string;
    warranty_expiry?: string;
}

export interface AssetStats {
    total: number;
    available: number;
    assigned: number;
    maintenance: number;
    retired: number;
}

export interface AssetType {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    is_active: boolean;
    field_definitions: FieldDefinition[];
    created_at: string;
}

export interface AssetTypeListResponse {
    asset_types: AssetType[];
    total: number;
}

export interface FieldDefinition {
    id: string;
    name: string;
    slug: string;
    field_type: string;
    is_required: boolean;
    order: number;
    options: Record<string, unknown> | null;
    default_value: string | null;
    placeholder: string | null;
}

export interface CreateAssetTypePayload {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    field_definitions?: Omit<FieldDefinition, 'id'>[];
}

export interface Ticket {
    id: string;
    ticket_number: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    category: string | null;
    created_by: string;
    created_by_name: string | null;
    assigned_to: string | null;
    assigned_to_name: string | null;
    sla_due_at: string | null;
    resolved_at: string | null;
    asset_ids: string[];
    created_at: string;
    updated_at: string;
}

export interface TicketListResponse {
    tickets: Ticket[];
    total: number;
}

export interface CreateTicketPayload {
    title: string;
    description?: string;
    priority?: string;
    category?: string;
    assigned_to?: string;
    asset_ids?: string[];
}

export interface UpdateTicketPayload {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    category?: string;
    assigned_to?: string;
}

export interface TicketStats {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    overdue: number;
}

export interface QueryParams {
    skip?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    asset_type_id?: string;
    assigned_to?: string;
    is_active?: boolean;
    [key: string]: unknown;
}

export const api = new ApiClient(API_BASE);
export default api;
