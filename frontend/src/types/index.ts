// Shared client-side types for the SAZU Study Hub.

export type ID = string;

export type Level = string;

export type Semester = 'First' | 'Second';

export type ResourceType = string;

export interface Faculty {
  id: ID;
  institutionId: ID;
  name: string;
}

export interface Department {
  id: ID;
  facultyId: ID;
  name: string;
}

export interface Course {
  id: ID;
  departmentId: ID;
  code: string;
  title: string;
  level: Level;
  semester: Semester;
  creditUnits: number;
  description: string;
}

export interface Resource {
  id: ID;
  courseId: ID;
  title: string;
  type: ResourceType;
  level: Level;
  semester: Semester;
  authorTag?: string; // e.g. "Compiled by a SAZU contributor" — never claims official authorship
  description: string;
  previewAvailable: boolean;
  previewContent: string;
  accessPolicy?: string;
  pages?: number;
  fileSizeBytes?: number;
  uploadedAt: string;
  tags: string[];
}

export interface AcademicProfile {
  institutionId: ID;
  facultyId: ID | null;
  departmentId: ID | null;
  programmeId: ID | null;
  level: Level | null;
  semester: Semester | null;
}

export interface StudentProfile {
  id: ID;
  fullName: string;
  email: string;
  createdAt: string;
  academic: AcademicProfile;
  hasSubscription: boolean;
  subscriptionExpiresAt: string | null;
}

export interface AcademicCatalogue {
  institutions: Array<{ id: number; code: string; name: string; location: string | null }>;
  faculties: Array<{ id: number; code: string; name: string; institution_id: number }>;
  programmes: Array<{
    id: number;
    code: string;
    name: string;
    faculty_id: number | null;
    award: string | null;
    study_level: string;
    status: string;
    commencement_session_id: number | null;
    source_note: string | null;
    departments: Array<{ id: number; code: string; name: string; programme_id: number | null; faculty_id: number | null; status: string }>;
  }>;
  departments: Array<{ id: number; code: string; name: string; programme_id: number | null; faculty_id: number | null; status: string; source_note: string | null }>;
  levels: Array<{ id: number; code: string; name: string; sort_order: number }>;
  sessions: Array<{ id: number; name: string; starts_on: string; ends_on: string; is_active: boolean }>;
  courses: Array<{
    id: number;
    code: string;
    title: string;
    programme_id: number | null;
    department_id: number | null;
    academic_level_id: number | null;
    verification_status: string;
    source_note: string | null;
    offerings: Array<{
      id: number;
      curriculum_version_id: number;
      curriculum_version: string;
      academic_session_id: number;
      academic_session: string | null;
      academic_level_id: number;
      level: string | null;
      semester_id: number;
      semester: number | null;
      credit_units: number | null;
      course_type: string | null;
      verification_status: string;
      source_note: string | null;
    }>;
  }>;
  semesters: Array<{ id: number; number: number; academic_session_id: number }>;
  resource_types: Array<{ id: number; name: string }>;
}
