"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightSwitch = void 0;
class LightSwitch {
    constructor(hap, log, name, id) {
        this.switchOn = false;
        this.log = log;
        this.name = name;
        this.switchService = new hap.Service.Switch(name);
        this.switchService.getCharacteristic(hap.Characteristic.On)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            log.info("Current state of the switch was returned: " + (this.switchOn ? "ON" : "OFF"));
            callback(undefined, this.switchOn);
        })
            .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
            this.switchOn = value;
            log.info("Switch state was set to: " + (this.switchOn ? "ON" : "OFF"));
            callback();
        });
        this.informationService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios")
            .setCharacteristic(hap.Characteristic.Model, "Some BTcino Model")
            .setCharacteristic(hap.Characteristic.SerialNumber, id);
        log.info("Light switch '%s' created!", name);
    }
    /*
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    identify() {
        this.log("Identify!");
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
exports.LightSwitch = LightSwitch;
//# sourceMappingURL=LightSwitch.js.map