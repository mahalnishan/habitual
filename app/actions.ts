'use server';

import { revalidatePath } from 'next/cache';
import { getPB, persistAuthToCookies } from '@/lib/pb';
import { toISO } from '@/lib/date';

// Create a new habit
export const createHabit = async (name: string, color: string = '#22c55e') => {
  try {
    const pb = getPB();
    
    if (!pb.authStore.isValid) {
      throw new Error('Not authenticated');
    }
    
    const habit = await pb.collection('habits').create({
      name,
      color,
      owner: pb.authStore.model?.id
    });
    
    revalidatePath('/');
    return { success: true, data: habit };
  } catch (error) {
    console.error('Failed to create habit:', error);
    return { success: false, error: 'Failed to create habit' };
  }
};

// Update a habit
export const updateHabit = async (id: string, data: { name?: string; color?: string }) => {
  try {
    const pb = getPB();
    
    if (!pb.authStore.isValid) {
      throw new Error('Not authenticated');
    }
    
    const habit = await pb.collection('habits').update(id, data);
    
    revalidatePath('/');
    return { success: true, data: habit };
  } catch (error) {
    console.error('Failed to update habit:', error);
    return { success: false, error: 'Failed to update habit' };
  }
};

// Delete a habit
export const deleteHabit = async (id: string) => {
  try {
    const pb = getPB();
    
    if (!pb.authStore.isValid) {
      throw new Error('Not authenticated');
    }
    
    // Delete all entries for this habit first
    const entries = await pb.collection('entries').getList(1, 1000, {
      filter: `habit = "${id}"`
    });
    
    for (const entry of entries.items) {
      await pb.collection('entries').delete(entry.id);
    }
    
    // Delete the habit
    await pb.collection('habits').delete(id);
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete habit:', error);
    return { success: false, error: 'Failed to delete habit' };
  }
};

// Toggle entry for a specific date
export const toggleEntry = async (habitId: string, isoDate: string) => {
  try {
    const pb = getPB();
    
    if (!pb.authStore.isValid) {
      throw new Error('Not authenticated');
    }
    
    // Check if entry already exists
    const existingEntries = await pb.collection('entries').getList(1, 1, {
      filter: `habit = "${habitId}" && date = "${isoDate}"`
    });
    
    if (existingEntries.items.length > 0) {
      // Delete existing entry
      await pb.collection('entries').delete(existingEntries.items[0].id);
    } else {
      // Create new entry
      await pb.collection('entries').create({
        habit: habitId,
        date: isoDate,
        value: 1,
        owner: pb.authStore.model?.id
      });
    }
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle entry:', error);
    return { success: false, error: 'Failed to toggle entry' };
  }
};

// Get entries for a date range
export const getRange = async (startISO: string, endISO: string) => {
  try {
    const pb = getPB();
    
    if (!pb.authStore.isValid) {
      throw new Error('Not authenticated');
    }
    
    const entries = await pb.collection('entries').getList(1, 1000, {
      filter: `owner = "${pb.authStore.model?.id}" && date >= "${startISO}" && date <= "${endISO}"`,
      expand: 'habit'
    });
    
    return { success: true, data: entries.items };
  } catch (error) {
    console.error('Failed to get entries:', error);
    return { success: false, error: 'Failed to get entries' };
  }
};

// Get all habits for current user
export const getHabits = async () => {
  try {
    const pb = getPB();
    
    if (!pb.authStore.isValid) {
      throw new Error('Not authenticated');
    }
    
    const habits = await pb.collection('habits').getList(1, 100, {
      filter: `owner = "${pb.authStore.model?.id}"`,
      sort: '-created'
    });
    
    return { success: true, data: habits.items };
  } catch (error) {
    console.error('Failed to get habits:', error);
    return { success: false, error: 'Failed to get habits' };
  }
};

// Get entries for last 370 days (52 weeks)
export const getLast52Weeks = async () => {
  try {
    const pb = getPB();
    
    if (!pb.authStore.isValid) {
      throw new Error('Not authenticated');
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 370);
    
    const startISO = toISO(startDate);
    const endISO = toISO(endDate);
    
    const entries = await pb.collection('entries').getList(1, 1000, {
      filter: `owner = "${pb.authStore.model?.id}" && date >= "${startISO}" && date <= "${endISO}"`,
      expand: 'habit'
    });
    
    // Group entries by date
    const entriesByDate: Record<string, number> = {};
    entries.items.forEach(entry => {
      const date = entry.date;
      entriesByDate[date] = (entriesByDate[date] || 0) + entry.value;
    });
    
    return { success: true, data: entriesByDate };
  } catch (error) {
    console.error('Failed to get last 52 weeks:', error);
    return { success: false, error: 'Failed to get entries' };
  }
};
