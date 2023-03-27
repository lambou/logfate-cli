import IProject from "./IProject";

export default interface IRequest {
    _id: string;
    __v: number
    project: IProject;
    method: string;
    url: string;
    query: any;
    headers: any;
    body: string;
    createdAt: string;
    updatedAt: string
}