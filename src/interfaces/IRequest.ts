export default interface IRequest {
    id: string;
    project_id: string;
    method: string;
    url: string;
    query: any;
    headers: any;
    body: string;
    request_responses: any[];
    created_at: string;
}