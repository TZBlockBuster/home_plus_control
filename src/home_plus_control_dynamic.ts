import {API, APIEvent, Characteristic, CharacteristicEventTypes, CharacteristicGetCallback, DynamicPlatformPlugin, HAP, Logging, PlatformAccessory, PlatformConfig, Service} from "homebridge";


const PLATFORM_NAME = "homebridge-home_plus_control";
const PLUGIN_NAME = "homebridge-home_plus_control";


let hap: HAP;
let Accessory: typeof PlatformAccessory;

export = (api: API) => {
    hap = api.hap;
    Accessory = api.platformAccessory;

    api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, HomePlusControlPlatform);
}

class HomePlusControlPlatform implements DynamicPlatformPlugin {

    private readonly log: Logging
    private readonly api: API

    private readonly home_id: string = "";

    private readonly accessories: PlatformAccessory[] = [];

    constructor(log: Logging, config: PlatformConfig, api: API) {
        this.log = log;
        this.api = api;

        // probably parse config or something here

        this.home_id = config["home_id"];

        log.info("Home + Control finished initializing!");

        api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
            log.info("Home + Control 'didFinishLaunching'");

            this.requestDeviceList().then((data) => {
                for (const device of data) {
                    const uuid = hap.uuid.generate(device["id"] + device["name"]);
                    if (this.accessories.find(accessory => accessory.UUID === uuid) == undefined) {
                        const accessory = new Accessory(device["name"], uuid);
                        if (device["type"] == "BNLD") {
                            accessory.category = hap.Categories.LIGHTBULB;
                            accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.SerialNumber, device["id"]);
                            accessory.addService(hap.Service.Lightbulb, device["name"]);
                            this.configureAccessory(accessory);

                            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                        } else if (device["type"] == "BNIL") {
                            accessory.category = hap.Categories.SWITCH;
                            accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.SerialNumber, device["id"]);
                            accessory.addService(hap.Service.Switch, device["name"]);
                            this.configureAccessory(accessory);
                        }
                    } else {
                        this.log.info("Accessory already registered: " + device["name"]);
                    }
                }
            });
        });
    }

    configureAccessory(accessory: PlatformAccessory) {
        this.log.info("Home + Control configureAccessory", accessory.displayName);

        if (this.accessories.find(accessory => accessory.displayName === accessory.displayName) != undefined) {
            accessory.displayName = accessory.displayName + " (2)";
        }
        // check which type of accessory it is
        switch (accessory.category) {
            case hap.Categories.LIGHTBULB:
                this.configureLightbulb(accessory)
                break;
            case hap.Categories.SWITCH:
                this.configureSwitch(accessory)
                break;
            case hap.Categories.THERMOSTAT:
                this.configureThermostat(accessory)
                break;
            case hap.Categories.WINDOW_COVERING:
                this.configureWindowCovering(accessory)
                break;
            case hap.Categories.FAN:
                this.configureFan(accessory)
                break;
            default:
                this.log.error("Unknown accessory type: " + accessory.category)
                break;
        }
    }

    async requestDeviceList(): Promise<any> {
        const response = await fetch("http://192.168.1.96:8000/netatmo/" + this.home_id + "/devices/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        return await response.json();
    }


    async requestState(accessory: PlatformAccessory, characteristic: RequestCharacteristic): Promise<any> {
        const serialNumber = accessory.getService(hap.Service.AccessoryInformation)!.getCharacteristic(hap.Characteristic.SerialNumber)!.value;
        const response = await fetch("http://192.168.1.96:8000/netatmo/" + this.home_id + "/state/" + serialNumber + "/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.json();
        let isAvailable = true;
        if (data["message"] != undefined) {
            isAvailable = false;
        }
        switch (characteristic) {
            case RequestCharacteristic.On:
                return isAvailable ? data["on"] : false;
            case RequestCharacteristic.Brightness:
                return isAvailable ? data["brightness"] : 0;
        }
    }

    configureLightbulb(accessory: PlatformAccessory) {
        accessory.getService(hap.Service.Lightbulb)!.getCharacteristic(hap.Characteristic.On)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                this.requestState(accessory, RequestCharacteristic.On).then((value) => {
                    callback(null, value);
                });
            });

        accessory.getService(hap.Service.Lightbulb)!.getCharacteristic(hap.Characteristic.Brightness)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                this.requestState(accessory, RequestCharacteristic.Brightness).then((value) => {
                    callback(null, value);
                });
            });

        accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios")
        accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.Model, "Netatmo")

        this.accessories.push(accessory)
    }

    configureSwitch(accessory: PlatformAccessory) {
        accessory.getService(hap.Service.Switch)!.getCharacteristic(hap.Characteristic.On)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                this.requestState(accessory, RequestCharacteristic.On).then((value) => {
                    callback(null, value);
                });
            });

        accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios")
        accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.Model, "Netatmo")

        this.accessories.push(accessory)
    }

    configureThermostat(accessory: PlatformAccessory) {
        // do something
        this.accessories.push(accessory)
    }

    configureWindowCovering(accessory: PlatformAccessory) {
        // do something
        this.accessories.push(accessory)
    }

    configureFan(accessory: PlatformAccessory) {
        // do something
        this.accessories.push(accessory)
    }


}

enum RequestCharacteristic {
    On = "On",
    Brightness = "Brightness",
}