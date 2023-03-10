import {API, APIEvent, Characteristic, CharacteristicEventTypes, CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, DynamicPlatformPlugin, HAP, Logging, PlatformAccessory, PlatformAccessoryEvent, PlatformConfig, Service} from "homebridge";


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

    private readonly alreadyRegistered: string[] = [];

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
                    if (this.alreadyRegistered.find(id => id == device["id"]) == undefined) {
                        const accessory = new Accessory(device["name"], uuid);
                        if (device["type"] == "BNLD") {
                            accessory.category = hap.Categories.LIGHTBULB;
                            accessory.getService(hap.Service.AccessoryInformation)!
                                .setCharacteristic(hap.Characteristic.SerialNumber, device["id"])
                                .setCharacteristic(hap.Characteristic.Model, "Netatmo " + device["type"]);
                            accessory.addService(hap.Service.Lightbulb, device["name"])
                                .setPrimaryService(true);
                            this.configureAccessory(accessory);

                            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                        } else if (device["type"] == "BNIL") {
                            accessory.category = hap.Categories.SWITCH;
                            accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.SerialNumber, device["id"]);
                            accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.Model, "Netatmo " + device["type"]);
                            accessory.addService(hap.Service.Switch, device["name"]);
                            this.configureAccessory(accessory);

                            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
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

        let serialNumber = accessory.getService(hap.Service.AccessoryInformation)!.getCharacteristic(hap.Characteristic.SerialNumber)!.value;
        let model = accessory.getService(hap.Service.AccessoryInformation)!.getCharacteristic(hap.Characteristic.Model)!.value;

        if (this.alreadyRegistered.find(id => id == serialNumber) == undefined) {
            if (typeof serialNumber === "string") {
                switch (model) {
                    case "Netatmo BNLD":
                        this.configureLightbulb(accessory)
                        break;
                    case "Netatmo BNIL":
                        this.configureSwitch(accessory)
                        break;
                    default:
                        this.log.error("Unknown accessory type: " + accessory.category)
                        break;
                }
                this.alreadyRegistered.push(serialNumber);
            }
        } else {
            this.log.info("Accessory already registered: " + accessory.displayName);
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

    async setState(accessory: PlatformAccessory, characteristic: RequestCharacteristic, value: any): Promise<any> {
        const serialNumber = accessory.getService(hap.Service.AccessoryInformation)!.getCharacteristic(hap.Characteristic.SerialNumber)!.value;
        const response = await fetch("http://192.168.1.96:8000/netatmo/" + this.home_id + "/setstate/" + serialNumber + "/" + characteristic.toString() + "/" + value.toString() + "/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.json();
        if (data["status"] != undefined) {
            return (await response.json())["status"] == "ok";
        } else {
            return false;
        }
    }

    configureLightbulb(accessory: PlatformAccessory) {

        accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
            const state = accessory.getService(hap.Service.Lightbulb)!.getCharacteristic(hap.Characteristic.On).value;
            const brightness = accessory.getService(hap.Service.Lightbulb)!.getCharacteristic(hap.Characteristic.Brightness).value;
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

        accessory.getService(hap.Service.Lightbulb)!.getCharacteristic(hap.Characteristic.On)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                this.requestState(accessory, RequestCharacteristic.On).then((value) => {
                    callback(null, value);
                });
            })
            .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
                this.setState(accessory, RequestCharacteristic.On, value).then((success) => {
                    callback(null);
                });
            });

        accessory.getService(hap.Service.Lightbulb)!.getCharacteristic(hap.Characteristic.Brightness)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                this.requestState(accessory, RequestCharacteristic.Brightness).then((value) => {
                    callback(null, value);
                });
            })
            .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
                this.setState(accessory, RequestCharacteristic.Brightness, value).then((success) => {
                    callback(null);
                });
            });

        accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios")

        this.accessories.push(accessory)
    }

    configureSwitch(accessory: PlatformAccessory) {

        accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
            const state = accessory.getService(hap.Service.Switch)!.getCharacteristic(hap.Characteristic.On).value;
            this.log.info("Home + Control identify", accessory.displayName);
            this.setState(accessory, RequestCharacteristic.On, !state).then((success) => {
                setTimeout(() => {
                    this.setState(accessory, RequestCharacteristic.On, state).then((success) => {
                        this.log.info("Home + Control identify done", accessory.displayName);
                    });
                }, 1000);
            });
        });

        accessory.getService(hap.Service.Switch)!.getCharacteristic(hap.Characteristic.On)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                this.requestState(accessory, RequestCharacteristic.On).then((value) => {
                    callback(null, value);
                });
            })
            .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
                this.setState(accessory, RequestCharacteristic.On, value).then((success) => {
                    callback(null);
                });
            });

        accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios")

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