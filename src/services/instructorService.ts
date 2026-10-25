import { apiRequest } from "@/lib/apiClient";

export interface Instructor {
  id: string;
  name: string;
  bio: string;
  imageUrl?: string | null;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendInstructorPayload {
  id: string;
  name: string;
  bio?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  createdBy?: string;
  created_by?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface CreateInstructorInput {
  name: string;
  bio?: string | null;
  imageUrl?: string | null;
}

export interface UpdateInstructorInput {
  name?: string;
  bio?: string | null;
  imageUrl?: string | null;
}

export const DEFAULT_INSTRUCTORS: Instructor[] = [
  {
    id: "instr-1",
    name: "Alex Rivera",
    bio: "Principal System Architect & Tech Lead with 10+ years experience in distributed cloud systems.",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "instr-2",
    name: "Sarah Chen",
    bio: "Staff Frontend Architect specializing in React, Next.js, and web performance optimization.",
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  },
];

let inMemoryInstructors: Instructor[] = [...DEFAULT_INSTRUCTORS];

function mapBackendInstructor(raw: BackendInstructorPayload): Instructor {
  return {
    id: raw.id,
    name: raw.name,
    bio: raw.bio || "",
    imageUrl: raw.imageUrl || raw.image_url || null,
    createdBy: raw.createdBy || raw.created_by,
    createdAt: raw.createdAt || raw.created_at,
    updatedAt: raw.updatedAt || raw.updated_at,
  };
}

/**
 * Fetch all instructors from GET /api/v1/instructors (with fallback to local memory)
 */
export async function getInstructors(): Promise<Instructor[]> {
  try {
    const res = await apiRequest("/api/v1/instructors");
    if (res.ok) {
      const data = (await res.json()) as BackendInstructorPayload[];
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapBackendInstructor);
        inMemoryInstructors = mapped;
        return mapped;
      }
    }
  } catch (error) {
    console.debug("GET /api/v1/instructors error, using fallback:", error);
  }
  return inMemoryInstructors;
}

/**
 * Create a new instructor via POST /api/v1/instructors
 */
export async function createInstructor(input: CreateInstructorInput): Promise<Instructor> {
  const localInstructor: Instructor = {
    id: `instr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim(),
    bio: input.bio?.trim() || "",
    imageUrl: input.imageUrl || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const res = await apiRequest("/api/v1/instructors", {
      method: "POST",
      body: JSON.stringify({
        name: input.name.trim(),
        bio: input.bio?.trim() || null,
        imageUrl: input.imageUrl || null,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as BackendInstructorPayload;
      const created = mapBackendInstructor(data);
      inMemoryInstructors = [created, ...inMemoryInstructors.filter((i) => i.id !== created.id)];
      return created;
    } else {
      const errData = await res.json().catch(() => null);
      if (errData?.message) {
        throw new Error(errData.message);
      }
    }
  } catch (error) {
    console.warn("POST /api/v1/instructors error:", error);
    if (error instanceof Error && !error.message.includes("Failed to fetch") && !error.message.includes("NetworkError")) {
      throw error;
    }
  }

  inMemoryInstructors = [localInstructor, ...inMemoryInstructors];
  return localInstructor;
}

/**
 * Update an existing instructor via PUT /api/v1/instructors/:id
 */
export async function updateInstructor(id: string, input: UpdateInstructorInput): Promise<Instructor> {
  try {
    const res = await apiRequest(`/api/v1/instructors/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: input.name?.trim(),
        bio: input.bio !== undefined ? input.bio?.trim() || null : undefined,
        imageUrl: input.imageUrl !== undefined ? input.imageUrl || null : undefined,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as BackendInstructorPayload;
      const updated = mapBackendInstructor(data);
      inMemoryInstructors = inMemoryInstructors.map((i) => (i.id === id ? updated : i));
      return updated;
    } else {
      const errData = await res.json().catch(() => null);
      if (errData?.message) {
        throw new Error(errData.message);
      }
    }
  } catch (error) {
    console.warn("PUT /api/v1/instructors/:id error:", error);
    if (error instanceof Error && !error.message.includes("Failed to fetch") && !error.message.includes("NetworkError")) {
      throw error;
    }
  }

  let updatedLocal: Instructor | null = null;
  inMemoryInstructors = inMemoryInstructors.map((i) => {
    if (i.id === id) {
      updatedLocal = {
        ...i,
        name: input.name !== undefined ? input.name.trim() : i.name,
        bio: input.bio !== undefined ? input.bio?.trim() || "" : i.bio,
        imageUrl: input.imageUrl !== undefined ? input.imageUrl : i.imageUrl,
        updatedAt: new Date().toISOString(),
      };
      return updatedLocal;
    }
    return i;
  });

  return updatedLocal || { id, name: input.name || "", bio: input.bio || "", imageUrl: input.imageUrl };
}

/**
 * Delete an instructor via DELETE /api/v1/instructors/:id
 */
export async function deleteInstructor(id: string): Promise<boolean> {
  try {
    const res = await apiRequest(`/api/v1/instructors/${id}`, {
      method: "DELETE",
    });

    if (res.ok || res.status === 204) {
      inMemoryInstructors = inMemoryInstructors.filter((i) => i.id !== id);
      return true;
    }
  } catch (error) {
    console.warn("DELETE /api/v1/instructors/:id error:", error);
  }

  inMemoryInstructors = inMemoryInstructors.filter((i) => i.id !== id);
  return true;
}
