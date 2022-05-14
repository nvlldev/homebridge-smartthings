import {
  Capability,
  Device,
  DeviceHealth,
  DeviceStatus,
  SmartThingsClient,
} from "@smartthings/core-sdk";
import {
  API,
  Characteristic,
  HAP,
  Logging,
  PlatformAccessory,
} from "homebridge";
import Platform from "../platform";

export enum AccessoryCategory {
  SWITCH = "Switch",
  LIGHT = "Light",
  PLUG = "SmartPlug",
  FAN = "Fan",
  GARAGE_DOOR = "GarageDoor",
}

export abstract class BaseAccessory {
  protected readonly Characteristic: typeof Characteristic;

  protected platform: Platform;
  protected accessory: PlatformAccessory;
  protected client: SmartThingsClient;

  protected hap: HAP;
  protected log: Logging;
  protected api: API;

  protected device?: Device;
  protected health?: DeviceHealth;
  protected status?: DeviceStatus;

  protected id: string;
  protected name: string;

  constructor(platform: Platform, accessory: PlatformAccessory) {
    this.Characteristic = platform.Characteristic;

    this.platform = platform;
    this.accessory = accessory;
    this.client = platform.client;

    this.hap = platform.hap;
    this.log = platform.log;
    this.api = platform.api;

    this.id = accessory.context.device.deviceId;
    this.name = accessory.context.device.label;

    this.initAccessory();
  }

  private async initAccessory() {
    this.device = await this.getDevice();
    this.health = await this.getHealth();
    this.status = await this.getStatus();

    this.setCharacteristics();
  }

  private setCharacteristics() {
    const service = this.accessory.getService(
      this.platform.Service.AccessoryInformation
    )!;
    service.setCharacteristic(
      this.Characteristic.Manufacturer,
      this.device!.manufacturerName
    );
    service.setCharacteristic(this.Characteristic.Model, "Default-Model");
    service.setCharacteristic(
      this.Characteristic.SerialNumber,
      "Default-Serial"
    );
  }

  protected async getDevice() {
    return await this.client.devices.get(
      this.accessory.context.device.deviceId
    );
  }

  protected async getHealth() {
    return await this.client.devices.getHealth(
      this.accessory.context.device.deviceId
    );
  }

  protected async getStatus() {
    return await this.client.devices.getStatus(
      this.accessory.context.device.deviceId
    );
  }

  public async isOnline(): Promise<boolean> {
    var { state } = await this.getHealth();
    return state === "ONLINE";
  }

  protected rejectPromiseDeviceOffline(reject: (reason?: any) => void) {
    this.log.debug(`${this.name} is Offline`);
    return reject(
      new this.hap.HapStatusError(
        this.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
      )
    );
  }

  protected hasCapability(name: string): boolean {
    return this.accessory.context.device.components[0].capabilities.find(
      (c: Capability) => c.id === name
    );
  }

  protected abstract registerHandlers(): void;
}
