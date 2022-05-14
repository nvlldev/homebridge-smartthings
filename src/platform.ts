import {
  BearerTokenAuthenticator,
  Device,
  SmartThingsClient,
} from "@smartthings/core-sdk";
import {
  API,
  APIEvent,
  Characteristic,
  DynamicPlatformPlugin,
  HAP,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from "homebridge";
import { AccessoryCategory, BaseAccessory } from "./accessories/base.accessory";
import { LightbulbAccessory } from "./accessories/lightbulb.accessory";

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

  public readonly hap: HAP;
  public readonly log: Logging;
  public readonly api: API;
  public readonly config: PlatformConfig;

  private readonly accessories: PlatformAccessory[] = [];

  private categories = ["Switch", "Light", "SmartPlug", "Fan", "GarageDoor"];

  constructor(log: Logging, config: PlatformConfig, api: API) {
    // Setup Variables
    this.hap = api.hap;
    this.log = log;
    this.api = api;
    this.config = config;

    // Expose Types
    this.Accessory = api.platformAccessory;
    this.Service = this.hap.Service;
    this.Characteristic = this.hap.Characteristic;

    // Setup SmartThings Client
    this.client = new SmartThingsClient(
      new BearerTokenAuthenticator(this.config.apiKey)
    );

    this.setupListeners();

    log.info("Finished Initializing!");
  }

  /*
   * When this event is fired, homebridge restored all cached accessories from disk and did call their respective
   * `configureAccessory` method for all of them. Dynamic Platform plugins should only register new accessories
   * after this event was fired, in order to ensure they weren't added to homebridge already.
   * This event can also be used to start discovery of new accessories.
   */
  setupListeners() {
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      this.log.info("Listener for Event 'didFinishLaunching' Executed.");

      this.getOnlineDevices().then((devices) => {
        this.syncDevices(devices);
      });
    });
  }

  /*
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log("Configuring accessory %s", accessory.displayName);

    this.accessories.push(accessory);
  }

  getOnlineDevices(): Promise<Array<Device>> {
    this.log.debug("Discovering Devices...");

    return new Promise<Array<Device>>((resolve, reject) => {
      this.client.devices
        .list()
        .then((devices) => {
          this.log.debug(`Discovered ${devices.length} Devices`);
          resolve(devices);
        })
        .catch((error) => {
          this.log.error(
            `Error Retrieving Devices from SmartThings (${error})`
          );
          reject();
        });
    });
  }

  syncDevices(devices: Device[]) {
    const accessoriesToAdd: PlatformAccessory[] = [];
    const accessoriesToRemove: PlatformAccessory[] = [];

    devices.forEach((device) => {
      if (
        device.components![0].categories.find((category) =>
          this.categories.find((a) => a === category.name)
        )
      ) {
        const existingAccessory = this.accessories.find(
          (accessory) => accessory.UUID === device.deviceId
        );

        if (existingAccessory) {
          this.log.info(
            `Restoring Accessory from Cache: ${existingAccessory.displayName}`
          );

          this.createAccessoryObject(device, existingAccessory);
        } else {
          this.log.info(`Registering New Accessory: ${device.label}`);
          const accessory = new this.api.platformAccessory(
            device.label ?? "Default Label",
            device.deviceId
          );

          accessory.context.device = device;
          this.createAccessoryObject(device, accessory);

          accessoriesToAdd.push(accessory);
        }
      }
    });

    this.accessories.forEach((accessory) => {
      if (!devices.find((device) => device.deviceId === accessory.UUID)) {
        this.log.info(`Will Unregister ${accessory.context.device.label}`);
        accessoriesToRemove.push(accessory);
      }
    });

    if (accessoriesToAdd.length > 0)
      this.api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        accessoriesToAdd
      );

    if (accessoriesToRemove.length > 0)
      this.api.unregisterPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        accessoriesToRemove
      );
  }

  createAccessoryObject(
    device: Device,
    accessory: PlatformAccessory
  ): BaseAccessory {
    const category = Object.values(AccessoryCategory).find((c) =>
      device.components![0].categories.find((cat) => cat.name === c)
    );

    switch (category) {
      case AccessoryCategory.LIGHT: {
        this.log.debug(`Creating Light Accessory for Device '${device.name}'`);
        return new LightbulbAccessory(this, accessory);
      }
      default: {
        this.log.debug(
          `Incompatible Category '${category}' for Device '${device.name}'`
        );
        throw new TypeError();
      }
    }
  }
}
