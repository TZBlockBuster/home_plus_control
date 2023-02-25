"use strict";
const PLATFORM_NAME = "homebridge-home_plus_control";
const PLUGIN_NAME = "homebridge-home_plus_control";
let hap;
let Accessory;
class HomePlusControlPlatform {
    constructor(log, config, api) {
        this.home_id = "";
        this.accessories = [];
        this.log = log;
        this.api = api;
        // probably parse config or something here
        this.home_id = config["home_id"];
        log.info("Home + Control finished initializing!");
        api.on("didFinishLaunching" /* APIEvent.DID_FINISH_LAUNCHING */, () => {
            log.info("Home + Control 'didFinishLaunching'");
            this.requestDeviceList().then((data) => {
                for (const device of data) {
                    const uuid = device["id"];
                    if (this.accessories.find(accessory => accessory.UUID === uuid) == undefined) {
                        const accessory = new Accessory(device["name"], uuid);
                        if (device["type"] == "BNLD") {
                            accessory.category = 5 /* hap.Categories.LIGHTBULB */;
                            accessory.addService(hap.Service.Lightbulb, device["name"]);
                            this.configureAccessory(accessory);
                            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                        }
                    }
                }
            });
        });
    }
    configureAccessory(accessory) {
        this.log.info("Home + Control configureAccessory", accessory.displayName);
        // check which type of accessory it is
        switch (accessory.category) {
            case 5 /* hap.Categories.LIGHTBULB */:
                this.configureLightbulb(accessory);
                break;
            case 8 /* hap.Categories.SWITCH */:
                this.configureSwitch(accessory);
                break;
            case 9 /* hap.Categories.THERMOSTAT */:
                this.configureThermostat(accessory);
                break;
            case 14 /* hap.Categories.WINDOW_COVERING */:
                this.configureWindowCovering(accessory);
                break;
            case 3 /* hap.Categories.FAN */:
                this.configureFan(accessory);
                break;
            default:
                this.log.error("Unknown accessory type: " + accessory.category);
                break;
        }
    }
    async requestDeviceList() {
        const response = await fetch("http://192.168.1.96:8000/netatmo/" + this.home_id + "/devices/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        return await response.json();
    }
    async requestState(accessory, characteristic) {
        const response = await fetch("http://192.168.1.96:8000/netatmo/" + this.home_id + "/state/" + accessory.UUID + "/", {
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
    configureLightbulb(accessory) {
        accessory.getService(hap.Service.Lightbulb).getCharacteristic(hap.Characteristic.On)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.On).then((value) => {
                callback(null, value);
            });
        });
        accessory.getService(hap.Service.Lightbulb).getCharacteristic(hap.Characteristic.Brightness)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.Brightness).then((value) => {
                callback(null, value);
            });
        });
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios");
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Model, "Netatmo");
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.SerialNumber, accessory.UUID);
        this.accessories.push(accessory);
    }
    configureSwitch(accessory) {
        accessory.getService(hap.Service.Switch).getCharacteristic(hap.Characteristic.On)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.On).then((value) => {
                callback(null, value);
            });
        });
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios");
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Model, "Netatmo");
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.SerialNumber, accessory.UUID);
        this.accessories.push(accessory);
    }
    configureThermostat(accessory) {
        // do something
        this.accessories.push(accessory);
    }
    configureWindowCovering(accessory) {
        // do something
        this.accessories.push(accessory);
    }
    configureFan(accessory) {
        // do something
        this.accessories.push(accessory);
    }
}
var RequestCharacteristic;
(function (RequestCharacteristic) {
    RequestCharacteristic["On"] = "On";
    RequestCharacteristic["Brightness"] = "Brightness";
})(RequestCharacteristic || (RequestCharacteristic = {}));
module.exports = (api) => {
    hap = api.hap;
    Accessory = api.platformAccessory;
    api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, HomePlusControlPlatform);
};
//# sourceMappingURL=home_plus_control_dynamic.js.map