import {
  Device,
  DeviceHealth,
  DeviceStatus,
  SmartThingsClient,
} from "@smartthings/core-sdk";
import { Characteristic, PlatformAccessory } from "homebridge";
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

  protected device?: Device;
  protected health?: DeviceHealth;
  protected status?: DeviceStatus;

  constructor(platform: Platform, accessory: PlatformAccessory) {
    this.Characteristic = platform.Characteristic;

    this.platform = platform;
    this.accessory = accessory;
    this.client = platform.client;

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

  protected abstract registerHandlers(): void;
}
