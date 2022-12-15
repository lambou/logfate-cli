import { Command, Flags, CliUx } from '@oclif/core';
import axios, { AxiosError } from 'axios';
import { Server } from "socket.io";
import IRequest from '../../interfaces/IRequest';
import ILocalResponse from '../../interfaces/ILocalResponse';

/**
 * Run the request lorequesty
 * @param request request
 */
async function executeRequest(port: number, request: IRequest) {
  // initial time
  const initialTime = new Date().getTime();
  /**
   * Calling the local URL
   */
  return await axios.request({
    method: request.method,
    url: `http://localhost:${port}/${request.url}`,
    params: request.query,
    headers: request.headers,
    data: request.body
  }).then(async (response) => {
    // request duration
    const duration = new Date().getTime() - initialTime;

    return {
      success: true,
      status: response.status,
      statusTest: response.statusText,
      headers: response.headers,
      data: response.data,
      duration
    } as ILocalResponse;
  }).catch(async (err: AxiosError<any>) => {
    // request duration
    const duration = new Date().getTime() - initialTime;

    return {
      success: true,
      status: err.response?.status,
      statusTest: err.response?.statusText,
      headers: err.response?.headers,
      data: err.response?.data,
      duration
    } as ILocalResponse;
  })
}

export default class Start extends Command {
  static description = 'Start listening and executing requests'

  static examples = []

  static flags = {}

  static args = []

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Start)

    const io = new Server(6060, {
      cors: {
        origin: ['https://www.logfate.com', 'http://localhost:3000']
      }
    });

    io.on("connection", async (socket) => {
      console.log("Connection established.");

      // receive a message from the client
      socket.on("request", async (port: number, payload: IRequest, callback: (data: ILocalResponse) => void) => {

        const initialMessage = `- ${payload.method.toUpperCase()}:/${payload.url}`;

        CliUx.ux.action.start(initialMessage);

        // run the request
        const response = await executeRequest(port, payload);

        CliUx.ux.action.stop(` > ${response.status} ${response.statusTest} > ${response.duration}ms`);

        // acknoledgement
        callback(response);
      });

    });

    console.log(`
##::::::::'#######:::'######:::'########::::'###::::'########:'########:
##:::::::'##.... ##:'##... ##:: ##.....::::'## ##:::... ##..:: ##.....::
##::::::: ##:::: ##: ##:::..::: ##::::::::'##:. ##::::: ##:::: ##:::::::
##::::::: ##:::: ##: ##::'####: ######:::'##:::. ##:::: ##:::: ######:::
##::::::: ##:::: ##: ##::: ##:: ##...:::: #########:::: ##:::: ##...::::
##::::::: ##:::: ##: ##::: ##:: ##::::::: ##.... ##:::: ##:::: ##:::::::
########:. #######::. ######::: ##::::::: ##:::: ##:::: ##:::: ########:
........:::.......::::......::::..::::::::..:::::..:::::..:::::........:`);
    console.log("Waiting for requests");
    console.log("=========================");
  }
}
