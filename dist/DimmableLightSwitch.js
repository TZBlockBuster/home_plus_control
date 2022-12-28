"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimmableLightSwitch = void 0;
const HomePlusControlCache_1 = require("./HomePlusControlCache");
class DimmableLightSwitch {
    constructor(hap, log, name, id, home_id, bridge, token) {
        this.switchBrightness = 0;
        this.id = "";
        this.home_id = "";
        this.bridge = "";
        this.token = "";
        this.log = log;
        this.name = name;
        this.id = id;
        this.home_id = home_id;
        this.bridge = bridge;
        this.token = token;
        this.switchService = new hap.Service.Lightbulb(name);
        this.switchService.getCharacteristic(hap.Characteristic.Brightness)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.getState()
                .then((state) => {
                this.log.info("Successfully get brightness: " + state.brightness);
                callback(0 /* HAPStatus.SUCCESS */, state.brightness);
            });
        })
            .onSet((value) => {
            this.setBrightness(value);
        });
        this.switchService.getCharacteristic(hap.Characteristic.On)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.getState()
                .then((state) => {
                this.log.info("Successfully get brightness: " + state.on);
                callback(0 /* HAPStatus.SUCCESS */, state.on);
            });
        })
            .onSet((value) => {
            this.setSwitchState(value);
        });
        this.informationService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios")
            .setCharacteristic(hap.Characteristic.Model, "Some BTcino Model")
            .setCharacteristic(hap.Characteristic.SerialNumber, id);
        log.info("Dimmable Light switch '%s' created!", name);
    }
    /*
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    identify() {
        this.log("Identify!");
    }
    setBrightness(brightness) {
        this.setState(brightness)
            .then(() => {
            this.log.info("Successfully set brightness to: " + brightness);
        });
    }
    setSwitchState(brightness) {
        this.setStateBool(brightness)
            .then(() => {
            this.log.info("Successfully set brightness to: " + brightness);
        });
    }
    async setState(state) {
        const response = await fetch('https://api.netatmo.com/api/setstate', {
            method: 'POST',
            body: JSON.stringify({
                home: {
                    id: this.home_id,
                    modules: [
                        {
                            id: this.id,
                            brightness: state,
                            bridge: this.bridge
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
    async setStateBool(on) {
        HomePlusControlCache_1.HomePlusControlCache.forceUpdate = true;
        const response = await fetch('https://api.netatmo.com/api/setstate', {
            method: 'POST',
            body: JSON.stringify({
                home: {
                    id: this.home_id,
                    modules: [
                        {
                            id: this.id,
                            on: on,
                            bridge: this.bridge
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
    async getState() {
        const data = await HomePlusControlCache_1.HomePlusControlCache.getHomeStatus(this.home_id, this.token);
        const module = data.body.home.modules.find((module) => module.id === this.id);
        return {
            brightness: module.brightness,
            on: module.on
        };
    }
    /*
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     */
    getServices() {
        return [
            this.informationService,
            this.switchService,
        ];
    }
}
exports.DimmableLightSwitch = DimmableLightSwitch;
DimmableLightSwitch.LightBrightnessState = {};
DimmableLightSwitch.LightSwitchState = {};
//# sourceMappingURL=DimmableLightSwitch.js.map