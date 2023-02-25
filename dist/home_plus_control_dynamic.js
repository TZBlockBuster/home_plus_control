"use strict";
const PLATFORM_NAME = "homebridge-home_plus_control";
const PLUGIN_NAME = "homebridge-home_plus_control";
let hap;
let Accessory;
class HomePlusControlPlatform {
    constructor(log, config, api) {
        this.home_id = "";
        this.accessories = [];
        this.alreadyRegistered = [];
        this.log = log;
        this.api = api;
        // probably parse config or something here
        this.home_id = config["home_id"];
        log.info("Home + Control finished initializing!");
        api.on("didFinishLaunching" /* APIEvent.DID_FINISH_LAUNCHING */, () => {
            log.info("Home + Control 'didFinishLaunching'");
            this.requestDeviceList().then((data) => {
                for (const device of data) {
                    const uuid = hap.uuid.generate(device["id"] + device["name"]);
                    if (this.alreadyRegistered.find(id => id == device["id"]) == undefined) {
                        const accessory = new Accessory(device["name"], uuid);
                        if (device["type"] == "BNLD") {
                            accessory.category = 5 /* hap.Categories.LIGHTBULB */;
                            accessory.getService(hap.Service.AccessoryInformation)
                                .setCharacteristic(hap.Characteristic.SerialNumber, device["id"])
                                .setCharacteristic(hap.Characteristic.Model, "Netatmo " + device["type"]);
                            accessory.addService(hap.Service.Lightbulb, device["name"])
                                .setPrimaryService(true);
                            this.configureAccessory(accessory);
                            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                        }
                        else if (device["type"] == "BNIL") {
                            accessory.category = 8 /* hap.Categories.SWITCH */;
                            accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.SerialNumber, device["id"]);
                            accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Model, "Netatmo " + device["type"]);
                            accessory.addService(hap.Service.Switch, device["name"]);
                            this.configureAccessory(accessory);
                            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                        }
                    }
                    else {
                        this.log.info("Accessory already registered: " + device["name"]);
                    }
                }
            });
        });
    }
    configureAccessory(accessory) {
        this.log.info("Home + Control configureAccessory", accessory.displayName);
        let serialNumber = accessory.getService(hap.Service.AccessoryInformation).getCharacteristic(hap.Characteristic.SerialNumber).value;
        let model = accessory.getService(hap.Service.AccessoryInformation).getCharacteristic(hap.Characteristic.Model).value;
        if (this.alreadyRegistered.find(id => id == serialNumber) == undefined) {
            if (typeof serialNumber === "string") {
                switch (model) {
                    case "Netatmo BNLD":
                        this.configureLightbulb(accessory);
                        break;
                    case "Netatmo BNIL":
                        this.configureSwitch(accessory);
                        break;
                    default:
                        this.log.error("Unknown accessory type: " + accessory.category);
                        break;
                }
                this.alreadyRegistered.push(serialNumber);
            }
        }
        else {
            this.log.info("Accessory already registered: " + accessory.displayName);
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
        const serialNumber = accessory.getService(hap.Service.AccessoryInformation).getCharacteristic(hap.Characteristic.SerialNumber).value;
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
    async setState(accessory, characteristic, value) {
        const serialNumber = accessory.getService(hap.Service.AccessoryInformation).getCharacteristic(hap.Characteristic.SerialNumber).value;
        const response = await fetch("http://192.168.1.96:8000/netatmo/" + this.home_id + "/setstate/" + serialNumber + "/" + characteristic.toString() + "/" + value.toString() + "/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        return (await response.json())["status"] == "ok";
    }
    configureLightbulb(accessory) {
        accessory.getService(hap.Service.Lightbulb).getCharacteristic(hap.Characteristic.On)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.On).then((value) => {
                callback(null, value);
            });
        })
            .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
            this.setState(accessory, RequestCharacteristic.On, value).then((success) => {
                callback(null);
            });
        });
        accessory.getService(hap.Service.Lightbulb).getCharacteristic(hap.Characteristic.Brightness)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.Brightness).then((value) => {
                callback(null, value);
            });
        })
            .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
            this.setState(accessory, RequestCharacteristic.Brightness, value).then((success) => {
                callback(null);
            });
        });
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios");
        this.accessories.push(accessory);
    }
    configureSwitch(accessory) {
        accessory.getService(hap.Service.Switch).getCharacteristic(hap.Characteristic.On)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.On).then((value) => {
                callback(null, value);
            });
        })
            .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
            this.setState(accessory, RequestCharacteristic.On, value).then((success) => {
                callback(null);
            });
        });
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios");
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