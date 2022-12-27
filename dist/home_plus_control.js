"use strict";
const PLATFORM_NAME = "homebridge-home_plus_control";
const PLUGIN_NAME = "homebridge-home_plus_control";
let hap;
let Accessory;
class HomePlusControlPlatform {
    constructor(log, config, api) {
        this.homeAccessories = [];
        this.home_id = "";
        this.token = "";
        this.log = log;
        this.api = api;
        // probably parse config or something here
        log.info("Home + Control Platform Plugin Loading...");
        this.home_id = config["home_id"];
        this.token = config["token"];
        try {
            this.loadAccessories();
        }
        catch (e) {
            this.log.error("Error loading accessories: " + e);
        }
        // get json using a http request
        log.info("Example platform finished initializing!");
    }
    loadAccessories() {
        this.log.info("Loading accessories...");
        this.loadAsyncAccessories().then(() => {
            for (const id of HomePlusControlPlatform.Accessories) {
                this.log.info("Adding accessory with id " + id);
                this.addAccessory(HomePlusControlPlatform.AccessoryName[id], id);
            }
            this.log.info("Loaded accessories: " + HomePlusControlPlatform.Accessories);
        });
    }
    async loadAsyncAccessories() {
        const response = await fetch('https://api.netatmo.com/api/homesdata', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer ' + this.token
            }
        });
        const data = await response.json();
        this.log.info("Got data: " + JSON.stringify(data));
        if (data["error"] != null) {
            this.log.error("Error: " + data["error"]["message"]);
        }
        else if (data["body"]["homes"] != null) {
            data["body"]["homes"].forEach((home) => {
                if (home["modules"] != null) {
                    home["modules"].forEach((module) => {
                        if (module["type"] === "BNLD") {
                            HomePlusControlPlatform.Accessories.push(module["id"]);
                            HomePlusControlPlatform.AccessoryName[module["id"]] = module["name"];
                            HomePlusControlPlatform.AccessoryBridge[module["id"]] = module["bridge"];
                        }
                    });
                }
                else {
                    this.log.error("No modules found for home " + home["name"]);
                }
            });
        }
    }
    configureAccessory(accessory) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
    configureAccessoryNew(accessory) {
        this.log("Configuring accessory %s", accessory.displayName);
        accessory.on("identify" /* PlatformAccessoryEvent.IDENTIFY */, () => {
            this.log("%s identified!", accessory.displayName);
        });
        accessory.getService(hap.Service.Switch).getCharacteristic(hap.Characteristic.On)
            .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
            this.log.info("%s Light was set to: " + value);
            HomePlusControlPlatform.LightSwitchState[accessory.UUID] = value;
            this.setState(HomePlusControlPlatform.IDToIDLookup[accessory.UUID], value).then(r => {
                this.log("Set state: " + r);
            });
            callback();
        });
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Model, "Home+ Control Light Switch");
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.Manufacturer, "Netatmo");
        accessory.getService(hap.Service.AccessoryInformation).setCharacteristic(hap.Characteristic.SerialNumber, HomePlusControlPlatform.IDToIDLookup[accessory.UUID]);
        this.homeAccessories.push(accessory);
    }
    async setState(id, state) {
        const response = await fetch('https://api.netatmo.com/api/setstate', {
            method: 'POST',
            body: JSON.stringify({
                home: {
                    id: this.home_id,
                    modules: [
                        {
                            id: id,
                            on: state,
                            bridge: HomePlusControlPlatform.AccessoryBridge[id]
                        }
                    ]
                }
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.token
            }
        });
    }
    addAccessory(name, id) {
        this.log.info("Adding new accessory with name %s", name);
        const uuid = hap.uuid.generate(name);
        const accessory = new Accessory(name, uuid, 8 /* Categories.SWITCH */);
        HomePlusControlPlatform.IDToIDLookup[uuid] = id;
        accessory.addService(hap.Service.Switch, name);
        this.configureAccessory(accessory);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
}
HomePlusControlPlatform.IDToIDLookup = {};
HomePlusControlPlatform.Accessories = [];
HomePlusControlPlatform.AccessoryName = {};
HomePlusControlPlatform.AccessoryBridge = {};
HomePlusControlPlatform.LightSwitchState = {};
module.exports = (api) => {
    hap = api.hap;
    Accessory = api.platformAccessory;
    api.registerPlatform(PLATFORM_NAME, HomePlusControlPlatform);
};
//# sourceMappingURL=home_plus_control.js.map