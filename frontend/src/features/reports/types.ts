// ─── Dashboard response types ─────────────────────────────────────

export interface StatusCount {
  status: string;
  count: number;
}

export interface DepartmentCount {
  department: string;
  count: number;
}

export interface EquipmentCount {
  name: string;
  serialNo: string;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface RecentRequest {
  id: number;
  description: string;
  status: string;
  equipment: string[];
  createdAt: string;
}

// Admin dashboard
export interface AdminDashboard {
  totalRequests: number;
  avgResolutionHours: number;
  byStatus: StatusCount[];
  byDepartment: DepartmentCount[];
  topEquipment: EquipmentCount[];
  monthlyTrend: MonthlyTrend[];
}

// Technician dashboard
export interface ActiveRequest {
  id: number;
  description: string;
  status: string;
  requester: string;
  department: string;
  equipment: string[];
  createdAt: string;
}

export interface TechnicianDashboard {
  totalAssigned: number;
  completedThisMonth: number;
  byStatus: StatusCount[];
  activeRequests: ActiveRequest[];
}

// HR dashboard
export interface HrDashboard {
  usersByDepartment: DepartmentCount[];
  requestsByDepartment: DepartmentCount[];
}

// User dashboard
export interface UserDashboard {
  totalRequests: number;
  byStatus: StatusCount[];
  recentRequests: RecentRequest[];
}

// Filter params
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  deptId?: number;
  statusId?: number;
}
