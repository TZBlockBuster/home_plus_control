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
        this.alreadyRegisteredNames = [];
        this.log = log;
        this.api = api;
        // probably parse config or something here
        this.home_id = config["home_id"];
        log.info("Home + Control finished initializing!");
        api.on("didFinishLaunching" /* APIEvent.DID_FINISH_LAUNCHING */, () => {
            log.info("Home + Control 'didFinishLaunching'");
            this.requestDeviceList().then((data) => {
                for (const device of data) {
                    let name = device["name"];
                    if (this.alreadyRegisteredNames.find(n => n == name) != undefined) {
                        name = name + " (2)";
                    }
                    this.alreadyRegisteredNames.push(name);
                    const uuid = hap.uuid.generate(device["id"] + name);
                    if (this.alreadyRegistered.find(id => id == device["id"]) == undefined) {
                        const accessory = new Accessory(name, uuid);
                        if (device["type"] == "BNLD") {
                            accessory.category = 5 /* hap.Categories.LIGHTBULB */;
                            accessory.getService(hap.Service.AccessoryInformation)
                                .setCharacteristic(hap.Characteristic.SerialNumber, device["id"])
                                .setCharacteristic(hap.Characteristic.Model, "Netatmo " + device["type"]);
                            accessory.addService(hap.Service.Lightbulb, name)
                                .setPrimaryService(true);
                            this.configureAccessory(accessory);
                            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                        }
                        else if (device["type"] == "BNIL") {
                            accessory.category = 8 /* hap.Categories.SWITCH */;
                            accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.SerialNumber, device["id"]);
                            accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Model, "Netatmo " + device["type"]);
                            accessory.addService(hap.Service.Switch, name);
                            this.configureAccessory(accessory);
                            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                        }
                        else if (device["type"] == "BNAS") {
                            accessory.category = 14 /* hap.Categories.WINDOW_COVERING */;
                            accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.SerialNumber, device["id"]);
                            accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Model, "Netatmo " + device["type"]);
                            accessory.addService(hap.Service.WindowCovering, name);
                            this.configureAccessory(accessory);
                            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                        }
                    }
                    else {
                        this.log.info("Accessory already registered: " + name);
                    }
                }
            });
        });
    }
    configureAccessory(accessory) {
        this.log.info("Home + Control configureAccessory", accessory.displayName);
        if (this.alreadyRegisteredNames.includes(accessory.displayName)) {
            accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Name, accessory.displayName + " (2)");
        }
        this.alreadyRegisteredNames.push(accessory.displayName);
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
                    case "Netatmo BNAS":
                        this.configureWindowCovering(accessory);
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
        const response = await fetch("http://192.168.168.166:8000/netatmo/" + this.home_id + "/devices/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        return await response.json();
    }
    async requestState(accessory, characteristic) {
        const serialNumber = accessory.getService(hap.Service.AccessoryInformation).getCharacteristic(hap.Characteristic.SerialNumber).value;
        const response = await fetch("http://192.168.168.166:8000/netatmo/" + this.home_id + "/state/" + serialNumber + "/", {
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
            case RequestCharacteristic.CurrentPosition:
                let pos = isAvailable ? data["current_position"] : 0;
                if (pos > 100) {
                    pos = 100;
                }
                if (pos < 0) {
                    pos = 0;
                }
                return pos;
            case RequestCharacteristic.PositionState:
                switch (isAvailable ? data["target_position"] : 50) {
                    case 0:
                        return hap.Characteristic.PositionState.DECREASING;
                    case 50:
                        return hap.Characteristic.PositionState.STOPPED;
                    case 100:
                        return hap.Characteristic.PositionState.INCREASING;
                    default:
                        return hap.Characteristic.PositionState.STOPPED;
                }
            case RequestCharacteristic.TargetPosition:
                let targetPosition = isAvailable ? data["target_position"] : 0;
                let currentPosition = isAvailable ? data["current_position"] : 0;
                if (targetPosition > 100) {
                    targetPosition = 100;
                }
                else if (targetPosition < 0) {
                    targetPosition = 0;
                }
                if (currentPosition > 100) {
                    currentPosition = 100;
                }
                else if (currentPosition < 0) {
                    currentPosition = 0;
                }
                if (targetPosition == 50) {
                    return currentPosition;
                }
                else {
                    return targetPosition;
                }
        }
    }
    async setState(accessory, characteristic, value) {
        const serialNumber = accessory.getService(hap.Service.AccessoryInformation).getCharacteristic(hap.Characteristic.SerialNumber).value;
        const response = await fetch("http://192.168.168.166:8000/netatmo/" + this.home_id + "/setstate/" + serialNumber + "/" + characteristic.toString() + "/" + value.toString() + "/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        return (await response.json())["status"] == "ok";
    }
    configureLightbulb(accessory) {
        accessory.on("identify" /* PlatformAccessoryEvent.IDENTIFY */, () => {
            const state = accessory.getService(hap.Service.Lightbulb).getCharacteristic(hap.Characteristic.On).value;
            const brightness = accessory.getService(hap.Service.Lightbulb).getCharacteristic(hap.Characteristic.Brightness).value;
            this.log.info("Home + Control identify", accessory.displayName);
            this.setState(accessory, RequestCharacteristic.On, true).then((success) => {
                this.setState(accessory, RequestCharacteristic.Brightness, 100).then((success) => {
                    setTimeout(() => {
                        this.setState(accessory, RequestCharacteristic.On, false).then((success) => {
                            this.setState(accessory, RequestCharacteristic.Brightness, brightness).then((success) => {
                                this.log.info("Home + Control identify done", accessory.displayName);
                            });
                        });
                    }, 1000);
                });
            });
        });
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
        accessory.on("identify" /* PlatformAccessoryEvent.IDENTIFY */, () => {
            const state = accessory.getService(hap.Service.Switch).getCharacteristic(hap.Characteristic.On).value;
            this.log.info("Home + Control identify", accessory.displayName);
            this.setState(accessory, RequestCharacteristic.On, !state).then((success) => {
                setTimeout(() => {
                    this.setState(accessory, RequestCharacteristic.On, state).then((success) => {
                        this.log.info("Home + Control identify done", accessory.displayName);
                    });
                }, 1000);
            });
        });
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
        accessory.getService(hap.Service.WindowCovering).getCharacteristic(hap.Characteristic.CurrentPosition)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.CurrentPosition).then((value) => {
                callback(null, value);
            });
        });
        accessory.getService(hap.Service.WindowCovering).getCharacteristic(hap.Characteristic.PositionState)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.PositionState).then((value) => {
                callback(null, value);
            });
        });
        accessory.getService(hap.Service.WindowCovering).getCharacteristic(hap.Characteristic.TargetPosition)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.TargetPosition).then((value) => {
                callback(null, value);
            });
        })
            .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
            let targetPosition = value >= 50 ? 100 : 0;
            this.setState(accessory, RequestCharacteristic.TargetPosition, targetPosition).then((success) => {
                callback(null);
            });
        });
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios");
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
    RequestCharacteristic["CurrentPosition"] = "current_position";
    RequestCharacteristic["PositionState"] = "position_state";
    RequestCharacteristic["TargetPosition"] = "target_position";
})(RequestCharacteristic || (RequestCharacteristic = {}));
module.exports = (api) => {
    hap = api.hap;
    Accessory = api.platformAccessory;
    api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, HomePlusControlPlatform);
};
//# sourceMappingURL=home_plus_control_dynamic.js.map