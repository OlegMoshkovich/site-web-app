import React from 'react';

import { Observation } from './supabase';

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

export interface UserState {
  user: any | null;
  setUser: (user: any) => void;
  clearUser: () => void;
}

export interface UIState {
  selectedDate: string | null;
  setSelectedDate: (selectedDate: string | null) => void;
  primaryColor: string;
  setPrimaryColor: (primaryColor: string) => void;
  borderRadius: number;
  setBorderRadius: (borderRadius: number) => void;
}

export interface ObservationState {
  observationDates: string[] | null;
  observations: Observation[] | null;
  setObservationDates: (observationDates: string[]) => void;
  setObservations: (observations: Observation[]) => void;
  clearObservationDates: () => void;
  photos: Observation[] | null;
  setPhotos: (photos: Observation[]) => void;
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'outlined' | 'default' | 'text';
}

export interface IconButtonProps {
  iconName: string;
  variant: 'filled' | 'outlined';
  onPress: () => void;
  size?: number;
}

export interface CircleButtonProps {
  onPress: () => void;
  color?: string;
  size?: number;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface TextInputProps {
  label?: string;
  value: string;
  multiline?: boolean;
  onChangeText: (text: string) => void;
  placeholder?: string;
  password?: boolean;
}

export interface CheckboxProps {
  label?: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  height?: number | `${number}%`;
  showCloseButton?: boolean;
  headerProps?: DialogHeaderProps;
  enableCloseOnBackgroundPress?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
}

export interface DialogHeaderProps {
  title: string | React.ReactNode;
  backAction?: boolean;
  onBackAction?: () => void;
  titleButtonComponent?: React.ReactNode;
  rightActionElement?: string | React.ReactNode;
  onRightAction?: () => void;
  headerAsButton?: boolean;
  onHeaderPress?: () => void;
  bottomBorder?: boolean;
  titleFontSize?: number;
  rightActionFontSize?: number;
}

// ============================================================================
// FEATURE COMPONENT TYPES
// ============================================================================

export interface PhotoItemProps {
  id: string;
  dataUrl: string;
  title?: string;
  note?: string;
  checked: boolean;
  latitude?: number;
  longitude?: number;
  onCheck: (checked: boolean) => void;
  timestamp?: string;
  anchor?: { x: number; y: number } | null;
  labels?: string[];
  takenAt?: string | null;
  onDelete?: (id: string) => void;
}

export interface PlanWidgetProps {
  onAnchorChange?: (anchor: { x: number; y: number } | null) => void;
  selectedPlan?: string;
  onPlanChange?: (plan: string) => void;
  anchors?: Array<{ x: number; y: number; observationId: string; note?: string }>;
  isReportMode?: boolean;
}

export interface CreateObservationWidgetProps {
  visible: boolean;
  imageUri: string | null;
  note: string;
  uploading: boolean;
  onNoteChange: (text: string) => void;
  onUpload: (data: { anchor: { x: number; y: number } | null; labels: string[]; plan: string }) => void;
  onClose: () => void;
}

export interface StepNavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  backDisabled?: boolean;
  nextDisabled?: boolean;
  showBack?: boolean;
  showNext?: boolean;
  nextLabel?: string;
  backLabel?: string;
  nextLoading?: boolean;
  style?: any;
}

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface AnchorPoint {
  x: number;
  y: number;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface PhotoData {
  id: string;
  dataUrl: string;
  title?: string;
  note?: string;
  checked: boolean;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  anchor?: AnchorPoint | null;
  labels?: string[];
  takenAt?: string | null;
}

export interface ObservationData {
  anchor: AnchorPoint | null;
  labels: string[];
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export interface TabNavigatorProps {
  session: any | null;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Re-export Supabase database types
export type { Database, Observation, ObservationInsert, ObservationUpdate, Profile, ProfileInsert, ProfileUpdate } from './supabase';

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type AnimationType = 'slide' | 'fade' | 'none';
export type ButtonVariant = 'outlined' | 'default' | 'text';
export type IconButtonVariant = 'filled' | 'outlined';
