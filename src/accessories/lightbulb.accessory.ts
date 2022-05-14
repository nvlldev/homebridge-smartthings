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

    if (this.hasCapability("colorControl")) {
      this.service
        .getCharacteristic(this.Characteristic.Hue)
        .onSet(this.setHue.bind(this))
        .onGet(this.getHue.bind(this));

      this.service
        .getCharacteristic(this.Characteristic.Saturation)
        .onSet(this.setSaturation.bind(this))
        .onGet(this.getSaturation.bind(this));
    }

    if (this.hasCapability("colorTemperature"))
      this.service
        .getCharacteristic(this.Characteristic.ColorTemperature)
        .onSet(this.setColorTemperature.bind(this))
        .onGet(this.getColorTemperature.bind(this));
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    this.log.debug(`Received setOn(${value}) Event for ${this.name}`);

    return new Promise<void>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .executeCommand(this.id, {
          capability: "switch",
          command: value ? "on" : "off",
        })
        .then((response) => {
          this.log.debug(`setOn(${value}) Successful for ${this.name}`);
          resolve();
        })
        .catch((error) => {
          this.log.error(
            `setOn Failed for ${this.name}. [Communication Error]`,
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
    this.log.debug(`Received getOn() Event for ${this.name}`);

    return new Promise<CharacteristicValue>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .getStatus(this.id)
        .then((status) => {
          if (status.components!.main.switch.switch.value) {
            const value = status.components!.main.switch.switch.value;

            this.log.debug(
              `getOn() Successful for ${this.name}. Value: '${value}'`
            );

            onStatus = value === "on" ? 1 : 0;

            resolve(onStatus);
          } else {
            this.log.debug(
              `getOn() Failed for ${this.name}. [Undefined Value]`
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
            `getOn() Failed for ${this.name}. [Communication Error]`,
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
    this.log.debug(`Received setLevel(${value}) Event for ${this.name}`);

    return new Promise<void>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .executeCommand(this.id, {
          capability: "switchLevel",
          command: "setLevel",
          arguments: [value as number],
        })
        .then((response) => {
          this.log.debug(`setLevel(${value}) Successful for ${this.name}`);
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
    this.log.debug(`Received getLevel() Event for ${this.name}`);

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

  private async setHue(value: CharacteristicValue): Promise<void> {
    this.log.debug(`Received setHue(${value}) Event for ${this.name}`);

    return new Promise<void>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .executeCommand(this.id, {
          capability: "colorControl",
          command: "setHue",
          arguments: [((value as number) / 360) * 100],
        })
        .then((response) => {
          this.log.debug(`setHue(${value}) Successful for ${this.name}`);
          resolve();
        })
        .catch((error) => {
          this.log.error(
            `setHue Failed for ${this.name}. [Communication Error]`,
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

  private async getHue(): Promise<CharacteristicValue> {
    let hue = 0;
    this.log.debug(`Received getHue() Event for ${this.name}`);

    return new Promise<CharacteristicValue>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .getStatus(this.id)
        .then((status) => {
          if (status.components!.main.switch.switch.value) {
            hue =
              ((status.components!.main.colorControl.hue.value as number) /
                100) *
              360;

            this.log.debug(
              `getHue() Successful for ${this.name}. Value: '${hue}'`
            );

            resolve(hue);
          } else {
            this.log.debug(
              `getHue() Failed for ${this.name}. [Undefined Value]`
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
            `getHue() Failed for ${this.name}. [Communication Error]`,
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

  private async setSaturation(value: CharacteristicValue): Promise<void> {
    this.log.debug(`Received setSaturation(${value}) Event for ${this.name}`);

    return new Promise<void>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .executeCommand(this.id, {
          capability: "colorControl",
          command: "setSaturation",
          arguments: [value as number],
        })
        .then((response) => {
          this.log.debug(
            `setSaturation(${value}) Successful for ${this.name}`
          );
          resolve();
        })
        .catch((error) => {
          this.log.error(
            `setSaturation Failed for ${this.name}. [Communication Error]`,
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

  private async getSaturation(): Promise<CharacteristicValue> {
    let saturation = 0;
    this.log.debug(`Received getSaturation() Event for ${this.name}`);

    return new Promise<CharacteristicValue>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .getStatus(this.id)
        .then((status) => {
          if (status.components!.main.switch.switch.value) {
            saturation = status.components!.main.colorControl.saturation
              .value as number;

            this.log.debug(
              `getSaturation() Successful for ${this.name}. Value: '${saturation}'`
            );

            resolve(saturation);
          } else {
            this.log.debug(
              `getSaturation() Failed for ${this.name}. [Undefined Value]`
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
            `getSaturation() Failed for ${this.name}. [Communication Error]`,
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

  private async setColorTemperature(value: CharacteristicValue): Promise<void> {
    this.log.debug(`Received setColorTemperature(${value}) Event for ${this.name}`);

    return new Promise<void>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .executeCommand(this.id, {
          capability: "colorTemperature",
          command: "setColorTemperature",
          arguments: [Math.floor(1000000 / (value as number))],
        })
        .then((response) => {
          this.log.debug(
            `setColorTemperature(${value}) Successful for ${this.name}`
          );
          resolve();
        })
        .catch((error) => {
          this.log.error(
            `setColorTemperature Failed for ${this.name}. [Communication Error]`,
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

  private async getColorTemperature(): Promise<CharacteristicValue> {
    let colorTemperature = 0;
    this.log.debug(`Received getColorTemperature() Event for ${this.name}`);

    return new Promise<CharacteristicValue>((resolve, reject) => {
      if (!this.isOnline()) this.rejectPromiseDeviceOffline(reject);

      this.client.devices
        .getStatus(this.id)
        .then((status) => {
          if (status.components!.main.switch.switch.value) {
            colorTemperature =
              Math.floor(1000000 /
              (status.components!.main.colorTemperature.colorTemperature
                .value as number));

            this.log.debug(
              `getColorTemperature() Successful for ${this.name}. Value: '${colorTemperature}'`
            );

            resolve(colorTemperature);
          } else {
            this.log.debug(
              `getColorTemperature() Failed for ${this.name}. [Undefined Value]`
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
            `getColorTemperature() Failed for ${this.name}. [Communication Error]`,
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
