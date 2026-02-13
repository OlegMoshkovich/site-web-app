import { createClient } from "@/lib/supabase/client";

export interface Label {
  id: string;
  name: string;
  description?: string | null;
  category: 'location' | 'gewerk' | 'type';
  parent_id?: string | null;
  order_index: number;
}

export interface LabelHierarchy {
  [category: string]: {
    [parentLabel: string]: string[];
  };
}

/**
 * Get all labels for a specific site (all collaborators' labels)
 */
export async function getLabelsForSite(siteId: string, userId?: string): Promise<Label[]> {
  const supabase = createClient();

  const { data: labels, error } = await supabase
    .from('labels')
    .select('id, name, description, category, parent_id, order_index')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('category')
    .order('order_index')
    .order('name');
  
  if (error) {
    console.error('Error fetching labels:', error);
    return [];
  }
  
  return labels || [];
}

/**
 * Transform flat labels array into hierarchical structure for React Native component
 */
export function transformLabelsToHierarchy(labels: Label[]): LabelHierarchy {
  const hierarchy: LabelHierarchy = {
    location: {},
    gewerk: {},
    type: {}
  };
  
  // Group labels by category
  const labelsByCategory = labels.reduce((acc, label) => {
    if (!acc[label.category]) {
      acc[label.category] = [];
    }
    acc[label.category].push(label);
    return acc;
  }, {} as Record<string, Label[]>);
  
  // Build hierarchy for each category
  Object.keys(labelsByCategory).forEach(category => {
    const categoryLabels = labelsByCategory[category];
    const topLevel = categoryLabels.filter(label => !label.parent_id);
    
    topLevel.forEach(parentLabel => {
      const children = categoryLabels
        .filter(label => label.parent_id === parentLabel.id)
        .map(label => label.name);
      
      hierarchy[category][parentLabel.name] = children;
    });
  });
  
  return hierarchy;
}

/**
 * Get labels in the format expected by your React Native LabelSelector
 */
export async function getLabelsForReactNative(siteId: string, userId: string) {
  const labels = await getLabelsForSite(siteId, userId);
  const hierarchy = transformLabelsToHierarchy(labels);
  
  // Transform to the format your React Native component expects
  const locationLabels = ['Location', ...Object.keys(hierarchy.location)];
  const locationSubLabels = hierarchy.location;
  const gewerkLabels = ['Gewerk', ...Object.keys(hierarchy.gewerk)];
  const typeLabels = ['Type', ...Object.keys(hierarchy.type)];
  
  return {
    locationLabels,
    locationSubLabels,
    gewerkLabels,
    typeLabels,
    // You can also return the raw hierarchy if needed
    hierarchy
  };
}

/**
 * Create a new label
 */
export async function createLabel(
  userId: string,
  siteId: string,
  name: string,
  category: 'location' | 'gewerk' | 'type',
  parentId?: string,
  description?: string
): Promise<Label | null> {
  const supabase = createClient();
  
  // Get the next order index for this category/parent
  const { data: existingLabels } = await supabase
    .from('labels')
    .select('order_index')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .eq('category', category)
    .eq('parent_id', parentId || null)
    .order('order_index', { ascending: false })
    .limit(1);
  
  const nextOrderIndex = existingLabels && existingLabels.length > 0 
    ? existingLabels[0].order_index + 1 
    : 0;
  
  const { data: newLabel, error } = await supabase
    .from('labels')
    .insert({
      user_id: userId,
      site_id: siteId,
      name,
      description,
      category,
      parent_id: parentId || null,
      order_index: nextOrderIndex
    })
    .select('id, name, description, category, parent_id, order_index')
    .single();
  
  if (error) {
    console.error('Error creating label:', error);
    return null;
  }
  
  return newLabel;
}

/**
 * Delete a label and all its children
 */
export async function deleteLabel(labelId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  
  // First delete all children (cascade should handle this, but being explicit)
  const { error: childrenError } = await supabase
    .from('labels')
    .delete()
    .eq('parent_id', labelId)
    .eq('user_id', userId);
  
  if (childrenError) {
    console.error('Error deleting child labels:', childrenError);
    return false;
  }
  
  // Then delete the parent
  const { error } = await supabase
    .from('labels')
    .delete()
    .eq('id', labelId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error deleting label:', error);
    return false;
  }
  
  return true;
}