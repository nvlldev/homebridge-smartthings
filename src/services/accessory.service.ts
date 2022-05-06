import {
  API,
  Characteristic,
  HAP,
  Logging,
  PlatformAccessory,
  Service,
} from "homebridge";
import { PLATFORM_NAME, PLUGIN_NAME } from "../constants";
import Platform from "../platform";

export class AccessoryService {
  private readonly Accessory: typeof PlatformAccessory;
  private readonly Service: typeof Service;
  private readonly Characteristic: typeof Characteristic;

  private readonly platform: Platform;
  private readonly hap: HAP;
  private readonly log: Logging;
  private readonly api: API;

  private readonly accessories: PlatformAccessory[] = [];

  constructor(platform: Platform, api: API, log: Logging) {
    this.platform = platform;
    this.api = api;
    this.hap = api.hap;
    this.log = log;

    this.Accessory = api.platformAccessory;
    this.Service = this.hap.Service;
    this.Characteristic = this.hap.Characteristic;
  }

  addAccessory(name: string) {
    this.log.info("Adding new accessory with name %s", name);

    // uuid must be generated from a unique but not changing data source, name should not be used in the most cases. But works in this specific example.
    const uuid = this.hap.uuid.generate(name);
    const accessory = new this.Accessory(name, uuid);

    accessory.addService(this.hap.Service.Lightbulb, "Test Light");

    this.platform.configureAccessory(accessory); // abusing the configureAccessory here

    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
      accessory,
    ]);
  }

  removeAccessories() {
    // we don't have any special identifiers, we just remove all our accessories

    this.log.info("Removing all accessories");

    this.api.unregisterPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      this.accessories
    );
    this.accessories.splice(0, this.accessories.length); // clear out the array
  }
}
