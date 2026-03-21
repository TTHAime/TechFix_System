import { create } from 'zustand';
import type { RepairRequest } from '@/types';
import { mockRepairRequests, mockStatuses, mockUsers, mockEquipment } from '@/lib/mock-data';

interface RepairRequestState {
  requests: RepairRequest[];
  addRequest: (data: { requesterId: number; description: string; equipmentId: number; issueDetail: string }) => void;
  claimRequest: (requestId: number, technicianId: number) => void;
  assignRequest: (requestId: number, technicianId: number, actorId: number) => void;
  updateStatus: (requestId: number, newStatusName: 'in_progress' | 'resolved' | 'closed', actorId: number) => void;
}

let nextRequestId = mockRepairRequests.length + 1;
let nextEquipId = 100;
let nextLogId = 100;

export const useRepairRequestStore = create<RepairRequestState>((set) => ({
  requests: [...mockRepairRequests],

  addRequest: ({ requesterId, description, equipmentId, issueDetail }) => {
    const requester = mockUsers.find((u) => u.id === requesterId);
    const equipment = mockEquipment.find((e) => e.id === equipmentId);
    if (!requester || !equipment) return;

    const newRequest: RepairRequest = {
      id: nextRequestId++,
      requesterId,
      statusId: 1,
      description,
      partsUsed: null,
      repairSummary: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requester,
      status: mockStatuses[0],
      requestEquipment: [{
        id: nextEquipId++,
        requestId: nextRequestId - 1,
        equipmentId,
        issueDetail,
        equipment,
      }],
      assignmentLogs: [],
    };

    set((state) => ({ requests: [newRequest, ...state.requests] }));
  },

  claimRequest: (requestId, technicianId) => {
    const technician = mockUsers.find((u) => u.id === technicianId);
    if (!technician) return;

    set((state) => ({
      requests: state.requests.map((r) => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          statusId: 2,
          status: mockStatuses[1],
          updatedAt: new Date().toISOString(),
          assignmentLogs: [
            ...r.assignmentLogs,
            {
              id: nextLogId++,
              requestId,
              actorId: technicianId,
              technicianId,
              action: 'assigned' as const,
              loggedAt: new Date().toISOString(),
              actor: technician,
              technician,
            },
          ],
        };
      }),
    }));
  },

  assignRequest: (requestId, technicianId, actorId) => {
    const technician = mockUsers.find((u) => u.id === technicianId);
    const actor = mockUsers.find((u) => u.id === actorId);
    if (!technician || !actor) return;

    set((state) => ({
      requests: state.requests.map((r) => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          statusId: 2,
          status: mockStatuses[1],
          updatedAt: new Date().toISOString(),
          assignmentLogs: [
            ...r.assignmentLogs,
            {
              id: nextLogId++,
              requestId,
              actorId,
              technicianId,
              action: 'assigned' as const,
              loggedAt: new Date().toISOString(),
              actor,
              technician,
            },
          ],
        };
      }),
    }));
  },

  updateStatus: (requestId, newStatusName, actorId) => {
    const newStatus = mockStatuses.find((s) => s.name === newStatusName);
    if (!newStatus) return;

    set((state) => ({
      requests: state.requests.map((r) => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          statusId: newStatus.id,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          completedAt: newStatusName === 'resolved' ? new Date().toISOString() : r.completedAt,
        };
      }),
    }));
  },
}));
