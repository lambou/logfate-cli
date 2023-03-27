export default interface ILocalResponse {
    success: boolean;
    status: number;
    statusText: string,
    body: any,
    headers: any,
    responseTime: number
    contentIgnored: boolean
}