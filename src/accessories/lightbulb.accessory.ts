import { rejects } from "assert";
import {
  Characteristic,
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from "homebridge";
import Platform from "../platform";
import { BaseAccessory } from "./base.accessory";

export class LightbulbAccessory extends BaseAccessory {
  private service: Service;

  constructor(platform: Platform, accessory: PlatformAccessory) {
    super(platform, accessory);

    this.service =
      accessory.getService(platform.Service.Lightbulb) ||
      accessory.addService(platform.Service.Lightbulb);

    this.service.setCharacteristic(
      this.Characteristic.Name,
      accessory.context.device.label
    );
  }

  protected registerHandlers() {
    this.service.getCharacteristic(this.Characteristic.On);
    // .onSet()
  }

  private async setOn(value: CharacteristicValue) {
    // TODO: Log Action

    return new Promise<void>((resolve, reject) => {
      if (!this.isOnline()) {
        // TODO: Log Error
        //   return reject(this.hap)
      }
    });
  }
}
