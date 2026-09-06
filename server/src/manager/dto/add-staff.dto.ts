export class AddStaffDto {
  email!: string;
  role?: 'staff' | 'manager';
  permissions?: string[];
}
