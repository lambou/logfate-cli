export default interface IProject {
    _id: string;
    __v: number;
    user: any,
    subdomain: string;
    tunnelSocketId: string;
    tunnelSecret: string;
    port: number;
    description?: string;
    open: boolean;
    responseAutoDelivery: boolean;
    created_at: string;
    updated_at: string;
}

export interface IProjectFilter { page: number, limit: number, total: number, term?: string; }