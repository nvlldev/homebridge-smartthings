import http, { IncomingMessage, Server, ServerResponse } from "http";
import {
  API,
  APIEvent,
  CharacteristicEventTypes,
  CharacteristicSetCallback,
  CharacteristicValue,
  DynamicPlatformPlugin,
  HAP,
  Logging,
  PlatformAccessory,
  PlatformAccessoryEvent,
  PlatformConfig,
  Service,
  Characteristic,
} from "homebridge";
import { AccessoryService } from "./services/accessory.service";
import {
  BearerTokenAuthenticator,
  SmartThingsClient,
} from "@smartthings/core-sdk";
import { API_KEY } from "./constants";

const PLUGIN_NAME = "homebridge-smartthings";
const PLATFORM_NAME = "SmartThings";

/*
 * IMPORTANT NOTICE
 *
 * One thing you need to take care of is, that you never ever ever import anything directly from the "homebridge" module (or the "hap-nodejs" module).
 * The above import block may seem like, that we do exactly that, but actually those imports are only used for types and interfaces
 * and will disappear once the code is compiled to Javascript.
 * In fact you can check that by running `npm run build` and opening the compiled Javascript file in the `dist` folder.
 * You will notice that the file does not contain a `... = require("homebridge");` statement anywhere in the code.
 *
 * The contents of the above import statement MUST ONLY be used for type annotation or accessing things like CONST ENUMS,
 * which is a special case as they get replaced by the actual value and do not remain as a reference in the compiled code.
 * Meaning normal enums are bad, const enums can be used.
 *
 * You MUST NOT import anything else which remains as a reference in the code, as this will result in
 * a `... = require("homebridge");` to be compiled into the final Javascript code.
 * This typically leads to unexpected behavior at runtime, as in many cases it won't be able to find the module
 * or will import another instance of homebridge causing collisions.
 *
 * To mitigate this the {@link API | Homebridge API} exposes the whole suite of HAP-NodeJS inside the `hap` property
 * of the api object, which can be acquired for example in the initializer function. This reference can be stored
 * like this for example and used to access all exported variables and classes from HAP-NodeJS.
 */

export default class Platform implements DynamicPlatformPlugin {
  public readonly Accessory: typeof PlatformAccessory;
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  public readonly client: SmartThingsClient;

  private readonly hap: HAP;
  private readonly log: Logging;
  private readonly api: API;

  private accessoryService: AccessoryService;
  private requestServer?: Server;

  private readonly accessories: PlatformAccessory[] = [];

  constructor(log: Logging, config: PlatformConfig, api: API) {
    // Setup Variables
    this.hap = api.hap;
    this.log = log;
    this.api = api;

    // Expose Types
    this.Accessory = api.platformAccessory;
    this.Service = this.hap.Service;
    this.Characteristic = this.hap.Characteristic;

    // Setup SmartThings Client
    this.client = new SmartThingsClient(new BearerTokenAuthenticator(API_KEY));

    this.accessoryService = new AccessoryService(this, this.api, this.log);

    this.parseConfig();

    log.info("Finished Initializing!");
  }

  parseConfig() {
    console.log("I got here...");
  }

  /*
   * When this event is fired, homebridge restored all cached accessories from disk and did call their respective
   * `configureAccessory` method for all of them. Dynamic Platform plugins should only register new accessories
   * after this event was fired, in order to ensure they weren't added to homebridge already.
   * This event can also be used to start discovery of new accessories.
   */
  setupListeners() {
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      this.log.info("Example platform 'didFinishLaunching'");

      // The idea of this plugin is that we open a http service which exposes api calls to add or remove accessories
      this.createHttpService();
    });
  }

  createHttpService() {
    this.requestServer = http.createServer(this.handleRequest.bind(this));
    this.requestServer.listen(18081, () =>
      this.log.info("Http server listening on 18081...")
    );
  }

  private handleRequest(request: IncomingMessage, response: ServerResponse) {
    if (request.url === "/add") {
      this.accessoryService.addAccessory(new Date().toISOString());
    } else if (request.url === "/remove") {
      this.accessoryService.removeAccessories();
    }

    response.writeHead(204); // 204 No content
    response.end();
  }

  /*
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log("Configuring accessory %s", accessory.displayName);

    accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
      this.log("%s identified!", accessory.displayName);
    });

    accessory
      .getService(this.hap.Service.Lightbulb)!
      .getCharacteristic(this.hap.Characteristic.On)
      .on(
        CharacteristicEventTypes.SET,
        (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
          this.log.info("%s Light was set to: " + value);
          callback();
        }
      );

    this.accessories.push(accessory);
  }
}
