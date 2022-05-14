import { CharacteristicValue, PlatformAccessory, Service } from "homebridge";
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

    this.registerHandlers();
  }

  protected registerHandlers() {
    this.service
      .getCharacteristic(this.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    if (this.hasCapability("switchLevel"))
      this.service
        .getCharacteristic(this.Characteristic.Brightness)
        .onSet(this.setLevel.bind(this))
        .onGet(this.getLevel.bind(this));
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    this.log.debug(`Received onSet('${value}') Event for ${this.name}`);

    return new Promise<void>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .executeCommand(this.id, {
          capability: "switch",
          command: value ? "on" : "off",
        })
        .then((response) => {
          this.log.debug(`onSet('${value}') Successful for ${this.name}`);
          resolve();
        })
        .catch((error) => {
          this.log.error(
            `onSet Failed for ${this.name}. [Communication Error]`,
            error
          );
          reject(
            new this.hap.HapStatusError(
              this.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
            )
          );
        });
    });
  }

  private async getOn(): Promise<CharacteristicValue> {
    let onStatus = 0;
    this.log.debug(`Received onGet() Event for ${this.name}`);

    return new Promise<CharacteristicValue>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .getStatus(this.id)
        .then((status) => {
          if (status.components!.main.switch.switch.value) {
            const value = status.components!.main.switch.switch.value;

            this.log.debug(
              `onGet() Successful for ${this.name}. Value: '${value}'`
            );

            onStatus = value === "on" ? 1 : 0;

            resolve(onStatus);
          } else {
            this.log.debug(
              `onGet() Failed for ${this.name}. [Undefined Value]`
            );
            reject(
              new this.hap.HapStatusError(
                this.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
              )
            );
          }
        })
        .catch((error) => {
          this.log.debug(
            `onGet() Failed for ${this.name}. [Communication Error]`,
            error
          );
          reject(
            new this.hap.HapStatusError(
              this.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
            )
          );
        });
    });
  }

  private async setLevel(value: CharacteristicValue): Promise<void> {
    this.log.debug(`Received setLevel() Event for ${this.name}`);

    return new Promise<void>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .executeCommand(this.id, {
          capability: "switchLevel",
          command: "setLevel",
          arguments: [value as number],
        })
        .then((response) => {
          this.log.debug(`setLevel('${value}') Successful for ${this.name}`);
          resolve();
        })
        .catch((error) => {
          this.log.error(
            `setLevel Failed for ${this.name}. [Communication Error]`,
            error
          );
          reject(
            new this.hap.HapStatusError(
              this.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
            )
          );
        });
    });
  }

  private async getLevel(): Promise<CharacteristicValue> {
    let level = 0;
    this.log.debug(`Received onGet() Event for ${this.name}`);

    return new Promise<CharacteristicValue>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .getStatus(this.id)
        .then((status) => {
          if (status.components!.main.switch.switch.value) {
            level = status.components!.main.switchLevel.level.value as number;

            this.log.debug(
              `getLevel() Successful for ${this.name}. Value: '${level}'`
            );

            resolve(level);
          } else {
            this.log.debug(
              `getLevel() Failed for ${this.name}. [Undefined Value]`
            );
            reject(
              new this.hap.HapStatusError(
                this.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
              )
            );
          }
        })
        .catch((error) => {
          this.log.debug(
            `getLevel() Failed for ${this.name}. [Communication Error]`,
            error
          );
          reject(
            new this.hap.HapStatusError(
              this.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
            )
          );
        });
    });
  }
}
