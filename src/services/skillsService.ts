import { apiRequest } from "@/lib/apiClient";

export interface SkillItem {
  id?: number;
  name: string;
  category: string;
}

let inMemorySkills: SkillItem[] = [];

/**
 * Fetch all skills or search by query
 */
export async function getSkills(query?: string): Promise<SkillItem[]> {
  try {
    const endpoint = query ? `/api/v1/skills/search?query=${encodeURIComponent(query)}` : "/api/v1/skills";
    const res = await apiRequest(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (error) {
    console.debug("Skills API unavailable, using local skills fallback:", error);
  }

  if (query) {
    const q = query.toLowerCase();
    return inMemorySkills.filter((s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
  }
  return [...inMemorySkills];
}

/**
 * Create a new skill item
 */
export async function createSkill(skill: { name: string; category?: string }): Promise<SkillItem> {
  const newSkill: SkillItem = {
    id: Date.now(),
    name: skill.name.trim(),
    category: skill.category || "General",
  };

  try {
    const res = await apiRequest("/api/v1/skills", {
      method: "POST",
      body: JSON.stringify(skill),
    });

    if (res.ok) {
      const created = (await res.json()) as SkillItem;
      inMemorySkills.unshift(created);
      return created;
    }
  } catch (error) {
    console.debug("POST /api/v1/skills unavailable, saving locally:", error);
  }

  inMemorySkills.unshift(newSkill);
  return newSkill;
}
