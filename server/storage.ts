// No database needed for this dashboard — all data comes from RF API + tracking files on disk.
// Keeping this file minimal as required by the template.

export interface IStorage {}

export class DashboardStorage implements IStorage {}

export const storage = new DashboardStorage();
