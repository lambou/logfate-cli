import { CliUx, Command, Flags } from '@oclif/core';
import axios, { AxiosError } from 'axios';
import { Server } from "socket.io";
import { connect } from 'socket.io-client';
import ILocalResponse from '../../interfaces/ILocalResponse';
import IRequest from '../../interfaces/IRequest';

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
    url: `http://127.0.0.1:${port}${request.url}`,
    params: request.query,
    headers: request.headers,
    data: request.body
  }).then(async (response) => {
    // request duration
    const duration = new Date().getTime() - initialTime;
    const contentIgnored = !response.headers['content-type']?.split(';').map(item => item.trim()).includes("application/json")

    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      body: contentIgnored ? 'only body with `content-type: application/json` are saved' : response.data,
      responseTime: duration,
      contentIgnored
    } as ILocalResponse;
  }).catch(async (err: AxiosError<any>) => {
    // request duration
    const duration = new Date().getTime() - initialTime;

    return {
      success: false,
      status: err.response?.status ?? 503,
      statusText: err.response?.statusText ?? 'Service unavailable',
      headers: err.response?.headers ?? {},
      body: err.response?.data,
      responseTime: duration,
      contentIgnored: false
    } as ILocalResponse;
  })
}

export default class Start extends Command {
  static description = 'Start listening and executing requests'

  static examples = []

  static flags = {
    subdomain: Flags.string({
      required: true
    }),
    secret: Flags.string({
      required: true
    }),
  }

  static args = []

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Start)

    const io = new Server(6060, {
      cors: {
        origin: ['https://www.logfate.com', 'http://localhost:3000', 'http://127.0.0.1:3000']
      }
    });

    io.on("connection", async (socket) => {
      console.log("Web app connection established.");

      // receive a message from the client
      socket.on("request", async (port: number, payload: IRequest, callback: (data: ILocalResponse) => void) => {

        const initialMessage = `- ${payload.method.toUpperCase()}:http://127.0.0.1:${port}/${payload.url}`;

        CliUx.ux.action.start(initialMessage);

        // run the request
        const response = await executeRequest(port, payload);

        CliUx.ux.action.stop(` > ${response.status} ${response.statusText} > ${response.responseTime}ms${response.contentIgnored ? ' > body ignored' : ''}`);

        // acknoledgement
        callback(response);
      });

    });

    function initializeSocket() {
      // connect to socket io server (public namespace)
      let socket = connect(
        `http://localhost:8080/tunnel`,
        {
          transports: ["websocket"],
          autoConnect: true,
        }
      );

      // listen connect
      socket.on("connect", () => {
        console.log("Tunnel socket ID: ", socket.id);
        socket.emit("subscribe", {
          subdomain: flags.subdomain,
          secret: flags.secret
        })
        // new request
        socket.on("new-request", async (request: IRequest, callback) => {
          const initialMessage = `- ${request.method.toUpperCase()}:http://127.0.0.1:${request.project.port}${request.url}`;

          CliUx.ux.action.start(initialMessage);

          // run the request
          const response = await executeRequest(request.project.port, request);

          CliUx.ux.action.stop(` > ${response.status} ${response.statusText} > ${response.responseTime}ms${response.contentIgnored ? ' > body ignored' : ''}`);

          // submit callback
          callback({ ...response })
        })
      });

      // Error occur
      socket.on("error", (err: any) => {
        console.log("An error occur while communicating with the realtime server.")
      });
    };

    console.log(`
##::::::::'#######:::'######:::'########::::'###::::'########:'########:
##:::::::'##.... ##:'##... ##:: ##.....::::'## ##:::... ##..:: ##.....::
##::::::: ##:::: ##: ##:::..::: ##::::::::'##:. ##::::: ##:::: ##:::::::
##::::::: ##:::: ##: ##::'####: ######:::'##:::. ##:::: ##:::: ######:::
##::::::: ##:::: ##: ##::: ##:: ##...:::: #########:::: ##:::: ##...::::
##::::::: ##:::: ##: ##::: ##:: ##::::::: ##.... ##:::: ##:::: ##:::::::
########:. #######::. ######::: ##::::::: ##:::: ##:::: ##:::: ########:
........:::.......::::......::::..::::::::..:::::..:::::..:::::........:`);

    initializeSocket()
  }
}
