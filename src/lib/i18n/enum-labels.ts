import type { Database } from '../supabase/database.types';
import type { TranslationKey } from './types';

export type CohortStatus = Database['public']['Enums']['cohort_status'];
export type MembershipStatus = Database['public']['Enums']['membership_status'];
export type AccountStatus = Database['public']['Enums']['account_status'];
export type AppRole = Database['public']['Enums']['app_role'];
export type ResourceStatus = Database['public']['Enums']['resource_status'];
export type ResourceType = Database['public']['Enums']['resource_type'];
export type ResourceAudience = Database['public']['Enums']['resource_audience'];
export type ResourceLanguage = Database['public']['Enums']['resource_language'];

export const cohortStatusTranslationKeys: Record<CohortStatus, TranslationKey> = {
  draft: 'cohortStatus.draft',
  scheduled: 'cohortStatus.scheduled',
  active: 'cohortStatus.active',
  completed: 'cohortStatus.completed',
  cancelled: 'cohortStatus.cancelled',
  archived: 'cohortStatus.archived',
};

export function cohortStatusKey(status: CohortStatus): TranslationKey {
  return cohortStatusTranslationKeys[status] ?? 'cohortStatus.scheduled';
}

export const membershipStatusTranslationKeys: Record<MembershipStatus, TranslationKey> = {
  active: 'membershipStatus.active',
  completed: 'membershipStatus.completed',
  removed: 'membershipStatus.removed',
};

export function membershipStatusKey(status: MembershipStatus): TranslationKey {
  return membershipStatusTranslationKeys[status] ?? 'membershipStatus.active';
}

export const accountStatusTranslationKeys: Record<AccountStatus, TranslationKey> = {
  active: 'accountStatus.active',
  suspended: 'accountStatus.suspended',
  expired: 'accountStatus.expired',
  archived: 'accountStatus.archived',
  pending_verification: 'accountStatus.pending_verification',
  pending_approval: 'accountStatus.pending_approval',
  pending_registration: 'accountStatus.pending_registration',
};

export function accountStatusKey(status: AccountStatus): TranslationKey {
  return accountStatusTranslationKeys[status] ?? 'accountStatus.active';
}

export const appRoleTranslationKeys: Record<AppRole, TranslationKey> = {
  learner: 'role.learner',
  instructor: 'role.instructor',
  admin: 'role.admin',
  super_admin: 'role.super_admin',
};

export function appRoleKey(role: AppRole): TranslationKey {
  return appRoleTranslationKeys[role] ?? 'role.learner';
}

export const resourceStatusTranslationKeys: Record<ResourceStatus, TranslationKey> = {
  draft: 'resourceStatus.draft',
  under_review: 'resourceStatus.under_review',
  approved: 'resourceStatus.approved',
  published: 'resourceStatus.published',
  retired: 'resourceStatus.retired',
  archived: 'resourceStatus.archived',
};

export function resourceStatusKey(status: ResourceStatus): TranslationKey {
  return resourceStatusTranslationKeys[status] ?? 'resourceStatus.draft';
}

export const resourceTypeTranslationKeys: Record<ResourceType, TranslationKey> = {
  guide: 'resourceType.guide',
  checklist: 'resourceType.checklist',
  pdf: 'resourceType.pdf',
  youtube_video: 'resourceType.youtube_video',
};

export function resourceTypeKey(type: ResourceType): TranslationKey {
  return resourceTypeTranslationKeys[type] ?? 'resourceType.guide';
}

export const resourceAudienceTranslationKeys: Record<ResourceAudience, TranslationKey> = {
  learner: 'resourceAudience.learner',
  instructor: 'resourceAudience.instructor',
};

export function resourceAudienceKey(audience: ResourceAudience): TranslationKey {
  return resourceAudienceTranslationKeys[audience] ?? 'resourceAudience.learner';
}

export const resourceLanguageTranslationKeys: Record<ResourceLanguage | 'all', TranslationKey> = {
  all: 'resourceLanguage.all',
  en: 'resourceLanguage.en',
  ms: 'resourceLanguage.ms',
  bilingual: 'resourceLanguage.bilingual',
  language_independent: 'resourceLanguage.languageIndependent',
};

export function resourceLanguageKey(lang: ResourceLanguage | 'all'): TranslationKey {
  return resourceLanguageTranslationKeys[lang] ?? 'resourceLanguage.en';
}
