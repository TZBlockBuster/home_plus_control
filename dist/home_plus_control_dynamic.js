"use strict";
const PLATFORM_NAME = "homebridge-home_plus_control";
const PLUGIN_NAME = "homebridge-home_plus_control";
let hap;
let Accessory;
class HomePlusControlPlatform {
    constructor(log, config, api) {
        this.home_id = "";
        this.thermo_home_id = "";
        this.accessories = [];
        this.alreadyRegistered = [];
        this.log = log;
        this.api = api;
        // probably parse config or something here
        this.home_id = config["home_id"];
        this.thermo_home_id = config["thermo_home_id"];
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
                        else if (device["type"] == "BNAS") {
                            accessory.category = 14 /* hap.Categories.WINDOW_COVERING */;
                            accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.SerialNumber, device["id"]);
                            accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Model, "Netatmo " + device["type"]);
                            accessory.addService(hap.Service.WindowCovering, device["name"]);
                            this.configureAccessory(accessory);
                            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                        }
                    }
                    else {
                        this.log.info("Accessory already registered: " + device["name"]);
                    }
                }
            });
            this.requestDeviceList(this.thermo_home_id).then((data) => {
                for (const device of data) {
                    const uuid = hap.uuid.generate(device["id"] + device["name"]);
                    if (this.alreadyRegistered.find(id => id == device["id"]) == undefined) {
                        const accessory = new Accessory(device["name"], uuid);
                        if (device["type"] == "BNS") {
                            accessory.category = 9 /* hap.Categories.THERMOSTAT */;
                            accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.SerialNumber, device["id"]);
                            accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Model, "Netatmo " + device["type"]);
                            accessory.addService(hap.Service.Thermostat, device["name"]);
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
                    case "Netatmo BNAS":
                        this.configureWindowCovering(accessory);
                        break;
                    case "Netatmo BNS":
                        this.configureThermostat(accessory);
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
    async requestDeviceList(home_id = this.home_id) {
        const response = await fetch("http://192.168.168.166:8000/netatmo/" + home_id + "/devices/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        return await response.json();
    }
    async requestState(accessory, characteristic, home_id = this.home_id) {
        const serialNumber = accessory.getService(hap.Service.AccessoryInformation).getCharacteristic(hap.Characteristic.SerialNumber).value;
        const response = await fetch("http://192.168.168.166:8000/netatmo/" + home_id + "/state/" + serialNumber + "/", {
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
                if (data["target_position"] < data["current_position"]) {
                    return hap.Characteristic.PositionState.DECREASING;
                }
                else if (data["target_position"] > data["current_position"]) {
                    return hap.Characteristic.PositionState.INCREASING;
                }
                else {
                    return hap.Characteristic.PositionState.STOPPED;
                }
            /*switch (isAvailable ? data["target_position"] : 50) {
                case 0:
                    return hap.Characteristic.PositionState.DECREASING;
                case 50:
                    return hap.Characteristic.PositionState.STOPPED;
                case 100:
                    return hap.Characteristic.PositionState.INCREASING;
                default:
                    return hap.Characteristic.PositionState.STOPPED;
            }*/
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
                /*if (targetPosition == 50) {
                    return currentPosition;
                } else {
                    return targetPosition;
                }*/
                return targetPosition;
            case RequestCharacteristic.CurrentHeatingCoolingState:
                if (data["heating_power_request"] == 0) {
                    return hap.Characteristic.CurrentHeatingCoolingState.OFF;
                }
                else {
                    return hap.Characteristic.CurrentHeatingCoolingState.HEAT;
                }
            case RequestCharacteristic.CurrentTemperature:
                return data["therm_measured_temperature"];
            case RequestCharacteristic.TargetTemperature:
                return data["therm_setpoint_temperature"];
            case RequestCharacteristic.CurrentRelativeHumidity:
                return data["humidity"];
        }
    }
    async setState(accessory, characteristic, value, home_id = this.home_id) {
        const serialNumber = accessory.getService(hap.Service.AccessoryInformation).getCharacteristic(hap.Characteristic.SerialNumber).value;
        const response = await fetch("http://192.168.168.166:8000/netatmo/" + home_id + "/setstate/" + serialNumber + "/" + characteristic.toString() + "/" + value.toString() + "/", {
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
        accessory.getService(hap.Service.Thermostat).getCharacteristic(hap.Characteristic.CurrentHeatingCoolingState)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.CurrentHeatingCoolingState, this.thermo_home_id).then((value) => {
                callback(null, value);
            });
        });
        accessory.getService(hap.Service.Thermostat).getCharacteristic(hap.Characteristic.TargetHeatingCoolingState)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.CurrentHeatingCoolingState, this.thermo_home_id).then((value) => {
                callback(null, value);
            });
        });
        accessory.getService(hap.Service.Thermostat).getCharacteristic(hap.Characteristic.CurrentTemperature)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.CurrentTemperature, this.thermo_home_id).then((value) => {
                callback(null, value);
            });
        });
        accessory.getService(hap.Service.Thermostat).getCharacteristic(hap.Characteristic.TargetTemperature)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.TargetTemperature, this.thermo_home_id).then((value) => {
                callback(null, value);
            });
        });
        accessory.getService(hap.Service.Thermostat).getCharacteristic(hap.Characteristic.TemperatureDisplayUnits)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            callback(null, hap.Characteristic.TemperatureDisplayUnits.CELSIUS);
        });
        accessory.getService(hap.Service.Thermostat).getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.requestState(accessory, RequestCharacteristic.CurrentRelativeHumidity, this.thermo_home_id).then((value) => {
                callback(null, value);
            });
        });
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
            //let targetPosition = value >= 50 ? 100 : 0;
            this.setState(accessory, RequestCharacteristic.TargetPosition, value).then((success) => {
                callback(null);
            });
        });
        accessory.getService(hap.Service.WindowCovering).getCharacteristic(hap.Characteristic.HoldPosition)
            .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
            if (value) {
                this.setState(accessory, RequestCharacteristic.TargetPosition, 50).then((success) => {
                    callback(null);
                });
            }
        });
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios");
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
    RequestCharacteristic["CurrentHeatingCoolingState"] = "heating_power_request";
    RequestCharacteristic["CurrentTemperature"] = "therm_measured_temperature";
    RequestCharacteristic["TargetTemperature"] = "therm_setpoint_temperature";
    RequestCharacteristic["CurrentRelativeHumidity"] = "humidity";
})(RequestCharacteristic || (RequestCharacteristic = {}));
module.exports = (api) => {
    hap = api.hap;
    Accessory = api.platformAccessory;
    api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, HomePlusControlPlatform);
};
//# sourceMappingURL=home_plus_control_dynamic.js.map